import type { Dados } from './calculo';

// Dados de exemplo tirados da planilha original (PLAN CUSTO LASH), para o app
// abrir mostrando um cálculo completo. A lash troca pelos números dela.

const materiais = [
  { id: 'm1', nome: 'Soro (melanina)', preco: 9.9, rendimento: 20 },
  { id: 'm2', nome: 'Primer', preco: 58.5, rendimento: 100 },
  { id: 'm3', nome: 'Fita micropore', preco: 4.9, rendimento: 15 },
  { id: 'm4', nome: 'Fita transpore', preco: 5.9, rendimento: 15 },
  { id: 'm5', nome: 'Escovinhas', preco: 15.99, rendimento: 50 },
  { id: 'm6', nome: 'Microbrush', preco: 12.99, rendimento: 100 },
  { id: 'm7', nome: 'Protetor de pálpebras', preco: 24.9, rendimento: 30 },
  { id: 'm8', nome: 'Anel descartável', preco: 5.49, rendimento: 25 },
  { id: 'm9', nome: 'Cola', preco: 68.9, rendimento: 50 },
  { id: 'm10', nome: 'Fios 8 mm', preco: 42.9, rendimento: 10 },
  { id: 'm11', nome: 'Fios 9 mm', preco: 42.9, rendimento: 10 },
  { id: 'm12', nome: 'Fios 10 mm', preco: 42.9, rendimento: 8 },
  { id: 'm13', nome: 'Fios 11 mm', preco: 42.9, rendimento: 8 },
  { id: 'm14', nome: 'Fios 12 mm', preco: 42.9, rendimento: 8 },
  { id: 'm15', nome: 'Fios 13 mm', preco: 42.9, rendimento: 10 },
];

const todos = materiais.map((m) => m.id);

export const DADOS_EXEMPLO: Dados = {
  rotina: { horasPorDia: [8, 8, 8, 8, 8, 4, 0], ocupacao: 0.8 },
  custosFixos: [
    { id: 'c1', nome: 'Aluguel', valor: 890 },
    { id: 'c2', nome: 'Luz', valor: 90 },
    { id: 'c3', nome: 'Água', valor: 50 },
    { id: 'c4', nome: 'Internet', valor: 60 },
    { id: 'c5', nome: 'Celular', valor: 30 },
    { id: 'c6', nome: 'Vale-transporte', valor: 250 },
    { id: 'c7', nome: 'Aluguel da maquininha', valor: 30 },
    { id: 'c8', nome: 'Canva', valor: 30 },
    { id: 'c9', nome: 'Mercado (café, água, lanches)', valor: 150 },
    { id: 'c10', nome: 'Imprevistos', valor: 100 },
    { id: 'c11', nome: 'Brindes', valor: 100 },
    { id: 'c12', nome: 'Marketing (Instagram)', valor: 150 },
    { id: 'c13', nome: 'Cartão de crédito da empresa', valor: 300 },
    { id: 'c14', nome: 'MEI (DAS)', valor: 75 },
  ],
  materiais,
  procedimentos: [
    { id: 'p1', nome: 'Volume brasileiro', duracaoHoras: 1.5, materiais: todos, precoAtual: 130 },
    { id: 'p2', nome: 'Volume moderado', duracaoHoras: 2, materiais: todos, precoAtual: 125 },
    { id: 'p3', nome: 'Capping Y', duracaoHoras: 2, materiais: todos, precoAtual: 125 },
    { id: 'p4', nome: 'Volume fox', duracaoHoras: 3, materiais: todos, precoAtual: 250 },
  ],
  ajustes: { proLabore: 2000, taxaCartao: 0.035, imposto: 0, margem: 0.3 },
};

export const DADOS_VAZIOS: Dados = {
  rotina: { horasPorDia: [8, 8, 8, 8, 8, 0, 0], ocupacao: 0.8 },
  custosFixos: [],
  materiais: [],
  procedimentos: [],
  ajustes: { proLabore: 0, taxaCartao: 0.035, imposto: 0, margem: 0.3 },
};
