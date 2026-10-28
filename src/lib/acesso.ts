import { useEffect, useState } from 'react';
import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js';

// Sem as variáveis do Supabase (ex.: rodando no computador), o app abre sem login.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const chave = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase: SupabaseClient | null = url && chave ? createClient(url, chave) : null;

/** Link do checkout da Hotmart, mostrado para quem ainda não comprou ou venceu. */
export const LINK_COMPRA = (import.meta.env.VITE_LINK_COMPRA as string | undefined) ?? '';

export interface Acesso {
  plano: 'anual' | 'vitalicio';
  status: 'ativo' | 'reembolsado' | 'cancelado';
  vence_em: string | null;
}

export type Situacao =
  | { tipo: 'carregando' }
  | { tipo: 'sem-login' }
  | { tipo: 'sem-compra'; email: string }
  | { tipo: 'vencido'; email: string; venceuEm: Date }
  | { tipo: 'liberado'; email: string; userId: string; plano: Acesso['plano']; venceEm: Date | null };

/** Decide o que a compradora vê a partir da linha de `acessos` (ou da falta dela). */
export function situacao(email: string, userId: string, acesso: Acesso | null, agora = new Date()): Situacao {
  if (!acesso || acesso.status !== 'ativo') return { tipo: 'sem-compra', email };
  const venceEm = acesso.vence_em ? new Date(acesso.vence_em) : null;
  if (venceEm && venceEm <= agora) return { tipo: 'vencido', email, venceuEm: venceEm };
  return { tipo: 'liberado', email, userId, plano: acesso.plano, venceEm };
}

async function verificar(sessao: Session | null): Promise<Situacao> {
  if (!supabase || !sessao?.user.email) return { tipo: 'sem-login' };
  const { data, error } = await supabase
    .from('acessos')
    .select('plano, status, vence_em')
    .eq('produto', 'calculadora')
    .maybeSingle<Acesso>();
  if (error) throw error;
  return situacao(sessao.user.email, sessao.user.id, data);
}

export function useAcesso() {
  const [estado, setEstado] = useState<Situacao>({ tipo: 'carregando' });
  const [erro, setErro] = useState(false);
  // veio do link "esqueci minha senha": antes de tudo, ela cria a senha nova
  const [novaSenha, setNovaSenha] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    const atualizar = (sessao: Session | null) =>
      verificar(sessao).then(
        (s) => {
          setErro(false);
          setEstado(s);
        },
        () => setErro(true),
      );

    supabase.auth.getSession().then(({ data }) => atualizar(data.session));
    // o Supabase pede que a callback não espere outras chamadas dele; por isso o setTimeout
    const { data } = supabase.auth.onAuthStateChange((evento, sessao) => {
      if (evento === 'PASSWORD_RECOVERY') setNovaSenha(true);
      if (evento === 'SIGNED_IN' || evento === 'SIGNED_OUT') setTimeout(() => atualizar(sessao), 0);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return { situacao: estado, erro, novaSenha, senhaDefinida: () => setNovaSenha(false) };
}

const normalizar = (email: string) => email.trim().toLowerCase();
// os links dos e-mails (confirmação e nova senha) voltam para o próprio app
const voltarPara = () => window.location.origin;

export async function entrar(email: string, senha: string) {
  if (!supabase) return;
  const { error } = await supabase.auth.signInWithPassword({ email: normalizar(email), password: senha });
  if (error) throw error;
}

/** Primeiro acesso: cria a conta e manda um e-mail de confirmação, só desta vez. */
export async function criarConta(email: string, senha: string) {
  if (!supabase) return;
  const { error } = await supabase.auth.signUp({
    email: normalizar(email),
    password: senha,
    options: { emailRedirectTo: voltarPara() },
  });
  if (error) throw error;
}

export async function recuperarSenha(email: string) {
  if (!supabase) return;
  const { error } = await supabase.auth.resetPasswordForEmail(normalizar(email), { redirectTo: voltarPara() });
  if (error) throw error;
}

export async function trocarSenha(senha: string) {
  if (!supabase) return;
  const { error } = await supabase.auth.updateUser({ password: senha });
  if (error) throw error;
}

export async function sair() {
  await supabase?.auth.signOut();
}
