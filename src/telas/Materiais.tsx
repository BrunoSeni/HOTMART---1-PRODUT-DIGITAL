import { custoPorAplicacao, formatarReais, type Material } from '../lib/calculo';
import { novoId } from '../lib/armazenamento';
import { CampoNumero, CampoTexto } from '../components/Campos';

interface Props {
  materiais: Material[];
  aoMudar: (m: Material[]) => void;
}

export function Materiais({ materiais, aoMudar }: Props) {
  const atualizar = (id: string, parte: Partial<Material>) =>
    aoMudar(materiais.map((m) => (m.id === id ? { ...m, ...parte } : m)));

  return (
    <div className="tela">
      <header className="tela__cabecalho">
        <span className="eyebrow">Passo 3</span>
        <h1 className="titulo">Materiais</h1>
        <p className="apoio">
          Quanto você pagou em cada produto e quantas aplicações ele rende. O app calcula quanto cada aplicação gasta.
        </p>
      </header>

      <div className="lista">
        {materiais.map((m) => (
          <article className="cartao cartao--form" key={m.id}>
            <div className="cartao__acoes">
              <CampoTexto rotulo="Produto" valor={m.nome} aoMudar={(nome) => atualizar(m.id, { nome })} placeholder="Ex.: cola" />
              <button
                className="remover"
                aria-label={`Remover ${m.nome || 'material'}`}
                onClick={() => aoMudar(materiais.filter((x) => x.id !== m.id))}
              >
                ×
              </button>
            </div>
            <div className="grade-2">
              <CampoNumero compacto rotulo="Preço pago" prefixo="R$" valor={m.preco} aoMudar={(preco) => atualizar(m.id, { preco })} />
              <CampoNumero
                compacto
                rotulo="Rende"
                sufixo="aplic."
                valor={m.rendimento}
                aoMudar={(rendimento) => atualizar(m.id, { rendimento })}
              />
            </div>
            <p className="cartao__rodape">
              Cada aplicação gasta <strong>{formatarReais(custoPorAplicacao(m))}</strong>
            </p>
          </article>
        ))}
      </div>

      <button
        className="botao botao--secundario"
        onClick={() => aoMudar([...materiais, { id: novoId(), nome: '', preco: 0, rendimento: 1 }])}
      >
        Adicionar material
      </button>
    </div>
  );
}
