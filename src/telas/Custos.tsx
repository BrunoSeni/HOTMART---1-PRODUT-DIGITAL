import { formatarReais, type Ajustes, type CustoFixo, type Resumo } from '../lib/calculo';
import { novoId } from '../lib/armazenamento';
import { CampoNumero, CampoTexto } from '../components/Campos';

interface Props {
  custos: CustoFixo[];
  ajustes: Ajustes;
  resumo: Resumo;
  aoMudarCustos: (c: CustoFixo[]) => void;
  aoMudarAjustes: (a: Ajustes) => void;
}

export function Custos({ custos, ajustes, resumo, aoMudarCustos, aoMudarAjustes }: Props) {
  const atualizar = (id: string, parte: Partial<CustoFixo>) =>
    aoMudarCustos(custos.map((c) => (c.id === id ? { ...c, ...parte } : c)));

  return (
    <div className="tela">
      <header className="tela__cabecalho">
        <span className="eyebrow">Passo 2</span>
        <h1 className="titulo">Custos do mês</h1>
        <p className="apoio">Tudo que você paga todo mês, atendendo ou não. Sem esquecer o seu salário.</p>
      </header>

      <section className="destaque-salario">
        <CampoNumero
          rotulo="Seu salário (pró-labore)"
          prefixo="R$"
          valor={ajustes.proLabore}
          aoMudar={(n) => aoMudarAjustes({ ...ajustes, proLabore: n })}
          ajuda="Quanto você quer tirar para você por mês. Quem não se paga, trabalha de graça."
        />
      </section>

      <div className="lista">
        {custos.map((c) => (
          <div className="linha-item" key={c.id}>
            <CampoTexto rotulo="Conta" valor={c.nome} aoMudar={(nome) => atualizar(c.id, { nome })} placeholder="Ex.: aluguel" />
            <CampoNumero compacto rotulo="Por mês" prefixo="R$" valor={c.valor} aoMudar={(valor) => atualizar(c.id, { valor })} />
            <button
              className="remover"
              aria-label={`Remover ${c.nome || 'conta'}`}
              onClick={() => aoMudarCustos(custos.filter((x) => x.id !== c.id))}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <button className="botao botao--secundario" onClick={() => aoMudarCustos([...custos, { id: novoId(), nome: '', valor: 0 }])}>
        Adicionar conta
      </button>

      <dl className="resumo">
        <dt>Contas do mês</dt>
        <dd>{formatarReais(resumo.totalCustosFixos)}</dd>
        <dt>Seu salário</dt>
        <dd>{formatarReais(ajustes.proLabore)}</dd>
        <dt>Total que o trabalho precisa pagar</dt>
        <dd>
          <strong>{formatarReais(resumo.custoMensal)}</strong>
        </dd>
      </dl>
    </div>
  );
}
