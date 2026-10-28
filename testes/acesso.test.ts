import { describe, expect, it } from 'vitest';
import { combinar, interpretar, type Acesso, type EventoHotmart } from '../api/hotmart';
import { situacao } from '../src/lib/acesso';

const APROVADA = Date.UTC(2026, 10, 10); // 10/11/2026
const DIA = 24 * 60 * 60 * 1000;

function evento(event: string, extra: { transacao?: string; oferta?: string; email?: string } = {}): EventoHotmart {
  return {
    event,
    data: {
      buyer: { email: extra.email ?? ' Maria@Email.com ', name: 'Maria' },
      purchase: { transaction: extra.transacao ?? 'HP1', approved_date: APROVADA, offer: { code: extra.oferta ?? 'anual01' } },
    },
  };
}

const anualAtivo: Acesso = {
  email: 'maria@email.com',
  produto: 'calculadora',
  nome: 'Maria',
  plano: 'anual',
  status: 'ativo',
  vence_em: new Date(APROVADA + 365 * DIA).toISOString(),
  transacao: 'HP1',
};

describe('webhook da Hotmart', () => {
  it('compra aprovada libera o plano anual por 365 dias, com e-mail em minúsculas', () => {
    const nova = combinar(null, interpretar(evento('PURCHASE_APPROVED'), ['vit01']));
    expect(nova).toEqual(anualAtivo);
  });

  it('oferta listada como vitalícia não vence', () => {
    const nova = combinar(null, interpretar(evento('PURCHASE_APPROVED', { oferta: 'vit01' }), ['vit01']));
    expect(nova?.plano).toBe('vitalicio');
    expect(nova?.vence_em).toBeNull();
  });

  it('PURCHASE_COMPLETE da mesma compra não muda nada', () => {
    expect(combinar(anualAtivo, interpretar(evento('PURCHASE_COMPLETE'), []))).toBeNull();
  });

  it('renovação do anual soma 12 meses ao vencimento atual', () => {
    const renovacao = interpretar(evento('PURCHASE_APPROVED', { transacao: 'HP2' }), []);
    const nova = combinar(anualAtivo, renovacao);
    expect(nova?.vence_em).toBe(new Date(APROVADA + 730 * DIA).toISOString());
    expect(nova?.transacao).toBe('HP2');
  });

  it('compra anual não rebaixa quem já é vitalícia', () => {
    const vitalicia: Acesso = { ...anualAtivo, plano: 'vitalicio', vence_em: null };
    expect(combinar(vitalicia, interpretar(evento('PURCHASE_APPROVED', { transacao: 'HP2' }), []))).toBeNull();
  });

  it('reembolso e chargeback revogam a compra', () => {
    expect(combinar(anualAtivo, interpretar(evento('PURCHASE_REFUNDED'), []))?.status).toBe('reembolsado');
    expect(combinar(anualAtivo, interpretar(evento('PURCHASE_CHARGEBACK'), []))?.status).toBe('reembolsado');
  });

  it('reembolso de outra transação não mexe no acesso', () => {
    expect(combinar(anualAtivo, interpretar(evento('PURCHASE_REFUNDED', { transacao: 'HP9' }), []))).toBeNull();
  });

  it('eventos que não mudam o acesso são ignorados', () => {
    expect(interpretar(evento('PURCHASE_BILLET_PRINTED'), []).tipo).toBe('ignorar');
    expect(interpretar({ event: 'PURCHASE_APPROVED', data: {} }, []).tipo).toBe('ignorar');
  });
});

describe('situação da compradora no app', () => {
  const agora = new Date(APROVADA + 10 * DIA);

  it('sem compra ou com compra reembolsada não entra', () => {
    expect(situacao('a@b.com', 'u1', null, agora).tipo).toBe('sem-compra');
    expect(situacao('a@b.com', 'u1', { plano: 'anual', status: 'reembolsado', vence_em: null }, agora).tipo).toBe('sem-compra');
  });

  it('anual dentro do prazo entra; depois do vencimento, não', () => {
    const acesso = { plano: 'anual' as const, status: 'ativo' as const, vence_em: anualAtivo.vence_em };
    expect(situacao('a@b.com', 'u1', acesso, agora).tipo).toBe('liberado');
    expect(situacao('a@b.com', 'u1', acesso, new Date(APROVADA + 400 * DIA)).tipo).toBe('vencido');
  });

  it('vitalício entra sempre', () => {
    const s = situacao('a@b.com', 'u1', { plano: 'vitalicio', status: 'ativo', vence_em: null }, new Date(2040, 0, 1));
    expect(s).toMatchObject({ tipo: 'liberado', venceEm: null });
  });
});
