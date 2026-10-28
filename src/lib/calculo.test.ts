import { describe, expect, it } from 'vitest';
import { arredondarPara5, calcular, custoPorAplicacao, SEMANAS_POR_MES, type Dados } from './calculo';
import { DADOS_EXEMPLO } from './exemplo';

const base: Dados = {
  rotina: { horasPorDia: [8, 8, 8, 8, 8, 0, 0], ocupacao: 1 },
  custosFixos: [{ id: 'c', nome: 'Aluguel', valor: 1000 }],
  materiais: [{ id: 'm', nome: 'Cola', preco: 50, rendimento: 50 }],
  procedimentos: [{ id: 'p', nome: 'Teste', duracaoHoras: 2, materiais: ['m'], precoAtual: 50 }],
  ajustes: { proLabore: 1000, taxaCartao: 0, imposto: 0, margem: 0 },
};

describe('custoPorAplicacao', () => {
  it('divide o preço pelo rendimento', () => {
    expect(custoPorAplicacao({ id: 'x', nome: 'Cola', preco: 68.9, rendimento: 50 })).toBeCloseTo(1.378);
  });
  it('rendimento zero não quebra a conta', () => {
    expect(custoPorAplicacao({ id: 'x', nome: 'Cola', preco: 10, rendimento: 0 })).toBe(0);
  });
});

describe('calcular', () => {
  it('usa as horas realmente trabalhadas e 4,33 semanas por mês', () => {
    const r = calcular(base);
    expect(r.horasSemana).toBe(40);
    expect(r.horasMes).toBeCloseTo(40 * SEMANAS_POR_MES);
    expect(r.custoFixoPorHora).toBeCloseTo(2000 / (40 * SEMANAS_POR_MES));
  });

  it('cobra o custo fixo pela duração do procedimento', () => {
    const r = calcular(base).procedimentos[0];
    const hora = 2000 / (40 * SEMANAS_POR_MES);
    expect(r.custoMaterial).toBeCloseTo(1);
    expect(r.custoFixo).toBeCloseTo(hora * 2);
    expect(r.custoTotal).toBeCloseTo(1 + hora * 2);
  });

  it('desconta a ocupação: menos horas produtivas, hora mais cara', () => {
    const cheia = calcular(base).custoFixoPorHora;
    const meia = calcular({ ...base, rotina: { ...base.rotina, ocupacao: 0.5 } }).custoFixoPorHora;
    expect(meia).toBeCloseTo(cheia * 2);
  });

  it('o preço mínimo cobre as taxas e o sugerido cobre taxas e margem', () => {
    const dados = { ...base, ajustes: { ...base.ajustes, taxaCartao: 0.05, imposto: 0.05, margem: 0.3 } };
    const r = calcular(dados).procedimentos[0];
    expect(r.precoMinimo * (1 - 0.1)).toBeCloseTo(r.custoTotal);
    expect(r.precoSugerido * (1 - 0.4)).toBeCloseTo(r.custoTotal);
    // cobrando o mínimo o lucro é zero
    expect(r.precoMinimo - r.custoTotal - r.precoMinimo * 0.1).toBeCloseTo(0);
  });

  it('mostra prejuízo quando o preço atual fica abaixo do custo', () => {
    const dados = { ...base, procedimentos: [{ ...base.procedimentos[0], precoAtual: 20 }] };
    const r = calcular(dados).procedimentos[0];
    expect(r.lucroAtual).toBeCloseTo(20 - r.custoTotal);
    expect(r.lucroAtual).toBeLessThan(0);
  });

  it('atendimentos para pagar as contas usam preço menos material e taxas', () => {
    const r = calcular(base).procedimentos[0];
    expect(r.atendimentosParaPagarContas).toBe(Math.ceil(2000 / (r.precoSugeridoRedondo - 1)));
  });

  it('avisa quando taxas + margem passam de 100%', () => {
    const r = calcular({ ...base, ajustes: { ...base.ajustes, taxaCartao: 0.1, margem: 0.95 } });
    expect(r.margemImpossivel).toBe(true);
    expect(r.procedimentos[0].precoSugerido).toBe(Infinity);
  });

  it('sem horas na semana, não divide por zero', () => {
    const r = calcular({ ...base, rotina: { horasPorDia: [0, 0, 0, 0, 0, 0, 0], ocupacao: 0.8 } });
    expect(r.custoFixoPorHora).toBe(0);
  });
});

describe('arredondarPara5', () => {
  it('arredonda para cima de 5 em 5', () => {
    expect(arredondarPara5(126.2)).toBe(130);
    expect(arredondarPara5(130)).toBe(130);
    expect(arredondarPara5(130.01)).toBe(135);
  });
});

describe('dados de exemplo (planilha original)', () => {
  it('a hora fixa sai bem acima dos R$ 5,98 da planilha antiga', () => {
    const r = calcular(DADOS_EXEMPLO);
    expect(r.totalCustosFixos).toBe(2305);
    expect(r.custoMensal).toBe(4305);
    // planilha antiga: 4305 / 720 h = R$ 5,98 por hora
    expect(r.custoFixoPorHora).toBeGreaterThan(4 * (4305 / 720));
  });

  it('volume moderado a R$ 125 fica abaixo do preço sugerido', () => {
    const r = calcular(DADOS_EXEMPLO);
    const vm = r.procedimentos.find((p) => p.procedimento.nome === 'Volume moderado')!;
    expect(vm.precoSugeridoRedondo).toBeGreaterThan(125);
  });
});
