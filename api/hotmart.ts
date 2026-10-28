// Webhook da Hotmart (versão 2.0.0): a cada compra, reembolso ou cancelamento,
// a Hotmart chama POST /api/hotmart e este arquivo atualiza a tabela `acessos`.
//
// Variáveis de ambiente na Vercel:
//   HOTMART_HOTTOK            token "Hottok" mostrado na tela de webhooks da Hotmart
//   HOTMART_OFERTAS_VITALICIO códigos das ofertas do plano vitalício, separados por vírgula
//   SUPABASE_URL              endereço do projeto Supabase
//   SUPABASE_SERVICE_ROLE_KEY chave secreta (service_role) do Supabase; nunca vai para o navegador

import { timingSafeEqual } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

// Cada produto vendido (hoje só a calculadora; no futuro, a agenda) tem sua própria
// linha em `acessos`. Quando houver mais de um, o produto virá do id da Hotmart.
export const PRODUTO = 'calculadora';

export type Plano = 'anual' | 'vitalicio';
export type Status = 'ativo' | 'reembolsado' | 'cancelado';

export interface Acesso {
  email: string;
  produto: string;
  nome: string | null;
  plano: Plano;
  status: Status;
  /** null no vitalício. ISO 8601. */
  vence_em: string | null;
  transacao: string;
}

export interface EventoHotmart {
  event?: string;
  data?: {
    buyer?: { email?: string; name?: string };
    purchase?: { transaction?: string; approved_date?: number; offer?: { code?: string } };
  };
}

export type Mudanca =
  | { tipo: 'liberar'; email: string; nome: string | null; plano: Plano; transacao: string; aprovadaEm: Date }
  | { tipo: 'revogar'; email: string; transacao: string; status: Exclude<Status, 'ativo'> }
  | { tipo: 'ignorar'; motivo: string };

const ANO_MS = 365 * 24 * 60 * 60 * 1000;

const LIBERA = new Set(['PURCHASE_APPROVED', 'PURCHASE_COMPLETE']);
const REVOGA: Record<string, Exclude<Status, 'ativo'>> = {
  PURCHASE_REFUNDED: 'reembolsado',
  PURCHASE_CHARGEBACK: 'reembolsado',
  PURCHASE_CANCELED: 'cancelado',
};

/** Traduz o corpo enviado pela Hotmart no que precisa mudar no acesso. */
export function interpretar(evento: EventoHotmart, ofertasVitalicio: string[]): Mudanca {
  const nome = evento.event ?? '';
  const email = evento.data?.buyer?.email?.trim().toLowerCase();
  const transacao = evento.data?.purchase?.transaction;
  if (!email || !transacao) return { tipo: 'ignorar', motivo: 'evento sem e-mail ou transação' };

  if (LIBERA.has(nome)) {
    const codigo = evento.data?.purchase?.offer?.code ?? '';
    const aprovada = evento.data?.purchase?.approved_date;
    return {
      tipo: 'liberar',
      email,
      nome: evento.data?.buyer?.name?.trim() || null,
      plano: ofertasVitalicio.includes(codigo) ? 'vitalicio' : 'anual',
      transacao,
      aprovadaEm: aprovada ? new Date(aprovada) : new Date(),
    };
  }
  if (nome in REVOGA) return { tipo: 'revogar', email, transacao, status: REVOGA[nome] };
  return { tipo: 'ignorar', motivo: `evento ${nome || 'sem nome'} não muda o acesso` };
}

/**
 * Calcula a nova linha de `acessos`, ou null quando nada muda.
 * Regras: uma compra nova nunca rebaixa um vitalício ativo; a renovação do anual
 * soma 12 meses a partir do vencimento atual; reembolso só revoga a própria transação.
 */
export function combinar(atual: Acesso | null, mudanca: Mudanca): Acesso | null {
  if (mudanca.tipo === 'ignorar') return null;

  if (mudanca.tipo === 'revogar') {
    if (!atual || atual.transacao !== mudanca.transacao) return null;
    return { ...atual, status: mudanca.status };
  }

  const ativo = atual?.status === 'ativo';
  if (ativo && atual.transacao === mudanca.transacao) return null; // APPROVED e depois COMPLETE da mesma compra
  if (ativo && atual.plano === 'vitalicio') return null;

  let venceEm: string | null = null;
  if (mudanca.plano === 'anual') {
    const inicio = ativo && atual.vence_em ? Math.max(Date.parse(atual.vence_em), mudanca.aprovadaEm.getTime()) : mudanca.aprovadaEm.getTime();
    venceEm = new Date(inicio + ANO_MS).toISOString();
  }

  return {
    email: mudanca.email,
    produto: PRODUTO,
    nome: mudanca.nome ?? atual?.nome ?? null,
    plano: mudanca.plano,
    status: 'ativo',
    vence_em: venceEm,
    transacao: mudanca.transacao,
  };
}

function mesmoToken(recebido: string | null, esperado: string): boolean {
  if (!recebido) return false;
  const a = Buffer.from(recebido);
  const b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}

function resposta(status: number, corpo: object): Response {
  return new Response(JSON.stringify(corpo), { status, headers: { 'content-type': 'application/json' } });
}

export async function POST(request: Request): Promise<Response> {
  const { HOTMART_HOTTOK, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!HOTMART_HOTTOK || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return resposta(500, { erro: 'variáveis de ambiente faltando' });
  }
  if (!mesmoToken(request.headers.get('x-hotmart-hottok'), HOTMART_HOTTOK)) {
    return resposta(401, { erro: 'hottok inválido' });
  }

  let evento: EventoHotmart;
  try {
    evento = (await request.json()) as EventoHotmart;
  } catch {
    return resposta(400, { erro: 'corpo inválido' });
  }

  const ofertas = (process.env.HOTMART_OFERTAS_VITALICIO ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  const mudanca = interpretar(evento, ofertas);
  if (mudanca.tipo === 'ignorar') return resposta(200, { ok: true, ignorado: mudanca.motivo });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const { data: atual, error: erroLeitura } = await supabase
    .from('acessos')
    .select('email, produto, nome, plano, status, vence_em, transacao')
    .eq('email', mudanca.email)
    .eq('produto', PRODUTO)
    .maybeSingle<Acesso>();
  // erro devolve 500 para a Hotmart tentar de novo mais tarde
  if (erroLeitura) return resposta(500, { erro: erroLeitura.message });

  const nova = combinar(atual, mudanca);
  if (!nova) return resposta(200, { ok: true, semMudanca: true });

  const { error } = await supabase.from('acessos').upsert({ ...nova, atualizado_em: new Date().toISOString() }, { onConflict: 'email,produto' });
  if (error) return resposta(500, { erro: error.message });
  return resposta(200, { ok: true, status: nova.status });
}
