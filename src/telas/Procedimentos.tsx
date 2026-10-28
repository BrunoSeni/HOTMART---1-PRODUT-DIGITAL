import { custoPorAplicacao, formatarReais, type Material, type Procedimento } from '../lib/calculo';
import { novoId } from '../lib/armazenamento';
import { CampoNumero, CampoTexto } from '../components/Campos';

interface Props {
  procedimentos: Procedimento[];
  materiais: Material[];
  aoMudar: (p: Procedimento[]) => void;
}

export function Procedimentos({ procedimentos, materiais, aoMudar }: Props) {
  const atualizar = (id: string, parte: Partial<Procedimento>) =>
    aoMudar(procedimentos.map((p) => (p.id === id ? { ...p, ...parte } : p)));

  const alternarMaterial = (p: Procedimento, idMaterial: string) =>
    atualizar(p.id, {
      materiais: p.materiais.includes(idMaterial)
        ? p.materiais.filter((x) => x !== idMaterial)
        : [...p.materiais, idMaterial],
    });

  return (
    <div className="tela">
      <header className="tela__cabecalho">
        <span className="eyebrow">Passo 4</span>
        <h1 className="titulo">Procedimentos</h1>
        <p className="apoio">Quanto tempo cada um leva, quais materiais usa e quanto você cobra hoje.</p>
      </header>

      <div className="lista">
        {procedimentos.map((p) => (
          <article className="cartao cartao--form" key={p.id}>
            <div className="cartao__acoes">
              <CampoTexto rotulo="Procedimento" valor={p.nome} aoMudar={(nome) => atualizar(p.id, { nome })} placeholder="Ex.: volume brasileiro" />
              <button
                className="remover"
                aria-label={`Remover ${p.nome || 'procedimento'}`}
                onClick={() => aoMudar(procedimentos.filter((x) => x.id !== p.id))}
              >
                ×
              </button>
            </div>
            <div className="grade-2">
              <CampoNumero
                compacto
                rotulo="Duração"
                sufixo="h"
                valor={p.duracaoHoras}
                aoMudar={(duracaoHoras) => atualizar(p.id, { duracaoHoras })}
                ajuda="1h30 = 1,5"
              />
              <CampoNumero
                compacto
                rotulo="Cobra hoje"
                prefixo="R$"
                valor={p.precoAtual ?? 0}
                aoMudar={(precoAtual) => atualizar(p.id, { precoAtual })}
              />
            </div>
            <fieldset className="materiais">
              <legend className="rotulo">Materiais usados</legend>
              {materiais.length === 0 && <p className="ajuda">Cadastre os materiais primeiro.</p>}
              {materiais.map((m) => (
                <label key={m.id} className="marcar">
                  <input type="checkbox" checked={p.materiais.includes(m.id)} onChange={() => alternarMaterial(p, m.id)} />
                  <span>{m.nome || 'Sem nome'}</span>
                  <span className="marcar__valor">{formatarReais(custoPorAplicacao(m))}</span>
                </label>
              ))}
            </fieldset>
          </article>
        ))}
      </div>

      <button
        className="botao botao--secundario"
        onClick={() =>
          aoMudar([
            ...procedimentos,
            { id: novoId(), nome: '', duracaoHoras: 2, materiais: materiais.map((m) => m.id), precoAtual: 0 },
          ])
        }
      >
        Adicionar procedimento
      </button>
    </div>
  );
}
