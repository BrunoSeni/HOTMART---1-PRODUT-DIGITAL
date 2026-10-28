# Lash Empresária

Calculadora de precificação para lash designers, vendida pela Hotmart/Kiwify. App web pensado para o celular: abre no navegador e pode ser salvo na tela inicial.

## O que o MVP faz

1. **Rotina:** horas de trabalho por dia e ocupação da agenda.
2. **Custos do mês:** contas fixas e o salário (pró-labore) da lash.
3. **Materiais:** preço pago e rendimento → custo por aplicação.
4. **Procedimentos:** duração, materiais usados e preço cobrado hoje.
5. **Preços:** preço sugerido (com a margem desejada), preço mínimo, lucro ou prejuízo do preço atual e quantos atendimentos pagam as contas do mês.

O app abre com os números da planilha original como exemplo. Os dados ficam salvos só no aparelho (localStorage) por enquanto.

## Regras de cálculo

Ver `src/lib/calculo.ts`. Em resumo:

- horas do mês = horas da semana × 4,33 × ocupação
- custo fixo por hora = (contas do mês + pró-labore) ÷ horas do mês
- custo do procedimento = material por aplicação + custo fixo por hora × duração
- preço mínimo = custo ÷ (1 − taxas)
- preço sugerido = custo ÷ (1 − taxas − margem), arredondado para cima de 5 em 5 reais

## Rodar

```bash
npm install
npm run dev     # desenvolvimento
npm test        # testes do cálculo
npm run build   # versão para publicar (pasta dist/)
```
