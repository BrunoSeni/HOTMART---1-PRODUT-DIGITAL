// Regras de cálculo da Lash Empresária.
// Corrige os erros da planilha original (ver Jira LP-47):
// - custo fixo por hora usa as horas realmente trabalhadas, não 720 h (30 dias × 24 h);
// - o custo fixo entra pela duração real do procedimento, não por 1 hora fixa;
// - o mês tem 4,33 semanas, não 4;
// - taxas da maquininha e impostos entram no preço;
// - a margem desejada gera o preço sugerido (antes a lash chutava o preço).

export const SEMANAS_POR_MES = 52 / 12; // ≈ 4,33

export const DIAS_DA_SEMANA = [
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
  'Domingo',
] as const;

export interface Material {
  id: string;
  nome: string;
  /** Quanto pagou na embalagem (R$). */
  preco: number;
  /** Quantas aplicações a embalagem rende. */
  rendimento: number;
}

export interface CustoFixo {
  id: string;
  nome: string;
  /** Valor mensal (R$). */
  valor: number;
}

export interface Procedimento {
  id: string;
  nome: string;
  /** Duração do atendimento, em horas. */
  duracaoHoras: number;
  /** Materiais usados em cada aplicação. */
  materiais: string[];
  /** Quanto cobra hoje (R$), opcional. */
  precoAtual?: number;
}

export interface Rotina {
  /** Horas de trabalho em cada dia, de segunda a domingo. */
  horasPorDia: number[];
  /** Parte das horas que vira atendimento de fato (0 a 1). Desconta faltas e horários vazios. */
  ocupacao: number;
}

export interface Ajustes {
  /** Salário que a lash quer tirar por mês (R$). */
  proLabore: number;
  /** Taxa média da maquininha, sobre o preço (0 a 1). */
  taxaCartao: number;
  /** Impostos sobre o preço (0 a 1). O DAS do MEI, que é fixo, entra nos custos fixos. */
  imposto: number;
  /** Lucro desejado, sobre o preço (0 a 1). */
  margem: number;
}

export interface Dados {
  rotina: Rotina;
  custosFixos: CustoFixo[];
  materiais: Material[];
  procedimentos: Procedimento[];
  ajustes: Ajustes;
}

export interface ResultadoProcedimento {
  procedimento: Procedimento;
  custoMaterial: number;
  custoFixo: number;
  /** Material + custo fixo pelo tempo do atendimento. */
  custoTotal: number;
  /** Preço que só paga os custos e as taxas, sem lucro. */
  precoMinimo: number;
  /** Preço com a margem desejada. */
  precoSugerido: number;
  /** Preço sugerido arredondado para cima, de 5 em 5 reais. */
  precoSugeridoRedondo: number;
  /** Lucro por atendimento cobrando o preço sugerido redondo. */
  lucroSugerido: number;
  /** Lucro (ou prejuízo, se negativo) por atendimento cobrando o preço atual. */
  lucroAtual?: number;
  /** Atendimentos por mês para pagar custos fixos e pró-labore com o preço sugerido redondo. */
  atendimentosParaPagarContas: number;
}

export interface Resumo {
  horasSemana: number;
  horasMes: number;
  horasProdutivasMes: number;
  totalCustosFixos: number;
  /** Custos fixos + pró-labore. */
  custoMensal: number;
  custoFixoPorHora: number;
  /** Taxas + margem passam de 100% do preço: não existe preço possível. */
  margemImpossivel: boolean;
  procedimentos: ResultadoProcedimento[];
}

export function custoPorAplicacao(m: Material): number {
  if (!(m.rendimento > 0)) return 0;
  return m.preco / m.rendimento;
}

export function arredondarPara5(valor: number): number {
  if (!Number.isFinite(valor)) return valor;
  return Math.ceil(valor / 5 - 1e-9) * 5;
}

export function calcular(dados: Dados): Resumo {
  const { rotina, custosFixos, materiais, procedimentos, ajustes } = dados;

  const horasSemana = rotina.horasPorDia.reduce((s, h) => s + (h || 0), 0);
  const horasMes = horasSemana * SEMANAS_POR_MES;
  const horasProdutivasMes = horasMes * rotina.ocupacao;

  const totalCustosFixos = custosFixos.reduce((s, c) => s + (c.valor || 0), 0);
  const custoMensal = totalCustosFixos + (ajustes.proLabore || 0);
  const custoFixoPorHora = horasProdutivasMes > 0 ? custoMensal / horasProdutivasMes : 0;

  const taxas = ajustes.taxaCartao + ajustes.imposto;
  const margemImpossivel = taxas + ajustes.margem >= 1;

  const porId = new Map(materiais.map((m) => [m.id, m]));

  const resultados = procedimentos.map((p): ResultadoProcedimento => {
    const custoMaterial = p.materiais.reduce((s, id) => {
      const m = porId.get(id);
      return m ? s + custoPorAplicacao(m) : s;
    }, 0);
    const custoFixo = custoFixoPorHora * p.duracaoHoras;
    const custoTotal = custoMaterial + custoFixo;

    const precoMinimo = taxas < 1 ? custoTotal / (1 - taxas) : Infinity;
    const precoSugerido = margemImpossivel ? Infinity : custoTotal / (1 - taxas - ajustes.margem);
    const precoSugeridoRedondo = arredondarPara5(precoSugerido);

    const lucroCom = (preco: number) => preco - custoTotal - preco * taxas;
    // O que sobra de cada atendimento para pagar as contas do mês: preço menos material e taxas.
    // O custo fixo não entra aqui porque é justamente ele que estamos tentando pagar.
    const contribuicao = precoSugeridoRedondo - custoMaterial - precoSugeridoRedondo * taxas;

    return {
      procedimento: p,
      custoMaterial,
      custoFixo,
      custoTotal,
      precoMinimo,
      precoSugerido,
      precoSugeridoRedondo,
      lucroSugerido: lucroCom(precoSugeridoRedondo),
      lucroAtual: p.precoAtual != null && p.precoAtual > 0 ? lucroCom(p.precoAtual) : undefined,
      atendimentosParaPagarContas: contribuicao > 0 ? Math.ceil(custoMensal / contribuicao) : Infinity,
    };
  });

  return {
    horasSemana,
    horasMes,
    horasProdutivasMes,
    totalCustosFixos,
    custoMensal,
    custoFixoPorHora,
    margemImpossivel,
    procedimentos: resultados,
  };
}

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function formatarReais(valor: number): string {
  if (!Number.isFinite(valor)) return '—';
  return moeda.format(valor);
}

export function formatarHoras(horas: number): string {
  const h = Math.floor(horas);
  const min = Math.round((horas - h) * 60);
  if (min === 0) return `${h} h`;
  if (h === 0) return `${min} min`;
  return `${h} h ${min} min`;
}
