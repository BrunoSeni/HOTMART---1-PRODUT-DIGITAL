import { formatarHoras, formatarReais, type Ajustes, type Resumo } from '../lib/calculo';
import { CampoNumero } from '../components/Campos';
import type { Aba } from '../App';

interface Props {
  resumo: Resumo;
  ajustes: Ajustes;
  aoMudarAjustes: (a: Ajustes) => void;
  irPara: (aba: Aba) => void;
}

const pct = (n: number) => Math.round(n * 1000) / 10;

export function Resultado({ resumo, ajustes, aoMudarAjustes, irPara }: Props) {
  const semRotina = resumo.horasSemana === 0;

  return (
    <div className="tela">
      <header className="tela__cabecalho">
        <span className="eyebrow">Seus preços</span>
        <h1 className="titulo">Quanto cobrar</h1>
      </header>

      <section className="destaque-hora">
        <span className="eyebrow">Cada hora sua custa</span>
        <span className="numero-xl">{formatarReais(resumo.custoFixoPorHora)}</span>
        <p className="ajuda ajuda--inversa">
          {formatarReais(resumo.custoMensal)} por mês (contas + seu salário) divididos por{' '}
          {Math.round(resumo.horasProdutivasMes)} horas de atendimento.
        </p>
      </section>

      {semRotina && (
        <Aviso texto="Informe quantas horas você trabalha por semana para calcular o custo da sua hora." acao="Preencher rotina" aoClicar={() => irPara('rotina')} />
      )}
      {resumo.margemImpossivel && (
        <Aviso texto="Taxas e lucro somam 100% ou mais do preço. Diminua a margem de lucro abaixo." />
      )}

      {resumo.procedimentos.length === 0 ? (
        <div className="vazio">
          <p className="titulo-md">Nenhum procedimento ainda</p>
          <p>Cadastre seus materiais e depois os procedimentos que você faz. O preço aparece aqui.</p>
          <button className="botao" onClick={() => irPara('procedimentos')}>
            Cadastrar procedimento
          </button>
        </div>
      ) : (
        <div className="lista">
          {resumo.procedimentos.map((r) => {
            const taxas = r.precoSugeridoRedondo * (ajustes.taxaCartao + ajustes.imposto);
            return (
              <article className="cartao" key={r.procedimento.id}>
                <div className="cartao__topo">
                  <span className="eyebrow eyebrow--suave">{formatarHoras(r.procedimento.duracaoHoras)}</span>
                  <h2 className="titulo-md">{r.procedimento.nome || 'Sem nome'}</h2>
                </div>
                <div className="cartao__heroi">
                  <span className="eyebrow">Preço sugerido</span>
                  <span className="numero-xl">{formatarReais(r.precoSugeridoRedondo)}</span>
                </div>
                <dl className="detalhes">
                  <dt>Material por aplicação</dt>
                  <dd>{formatarReais(r.custoMaterial)}</dd>
                  <dt>Custo fixo ({formatarHoras(r.procedimento.duracaoHoras)})</dt>
                  <dd>{formatarReais(r.custoFixo)}</dd>
                  <dt>Taxas e impostos</dt>
                  <dd>{formatarReais(taxas)}</dd>
                  <dt>Preço mínimo (sem lucro)</dt>
                  <dd>{formatarReais(r.precoMinimo)}</dd>
                  <div className="detalhes__linha" />
                  <dt>Lucro por atendimento</dt>
                  <dd className="positivo">Lucro {formatarReais(r.lucroSugerido)}</dd>
                  {r.lucroAtual != null && (
                    <>
                      <dt>Cobrando hoje {formatarReais(r.procedimento.precoAtual!)}</dt>
                      <dd className={r.lucroAtual >= 0 ? 'positivo' : 'negativo'}>
                        {r.lucroAtual >= 0 ? 'Lucro' : 'Prejuízo'} {formatarReais(Math.abs(r.lucroAtual))}
                      </dd>
                    </>
                  )}
                </dl>
                {Number.isFinite(r.atendimentosParaPagarContas) && (
                  <p className="cartao__rodape">
                    Com esse preço, <strong>{r.atendimentosParaPagarContas} atendimentos</strong> por mês pagam todas as
                    contas e o seu salário.
                  </p>
                )}
              </article>
            );
          })}
        </div>
      )}

      <section className="secao">
        <h2 className="eyebrow">Ajustes do preço</h2>
        <div className="grade-2">
          <CampoNumero
            rotulo="Lucro desejado"
            sufixo="%"
            valor={pct(ajustes.margem)}
            aoMudar={(n) => aoMudarAjustes({ ...ajustes, margem: n / 100 })}
            ajuda="Parte do preço que fica de lucro."
          />
          <CampoNumero
            rotulo="Taxa da maquininha"
            sufixo="%"
            valor={pct(ajustes.taxaCartao)}
            aoMudar={(n) => aoMudarAjustes({ ...ajustes, taxaCartao: n / 100 })}
            ajuda="Média entre Pix, débito e crédito."
          />
          <CampoNumero
            rotulo="Impostos sobre o preço"
            sufixo="%"
            valor={pct(ajustes.imposto)}
            aoMudar={(n) => aoMudarAjustes({ ...ajustes, imposto: n / 100 })}
            ajuda="MEI paga valor fixo: deixe 0 e coloque o DAS nos custos."
          />
        </div>
      </section>
    </div>
  );
}

function Aviso({ texto, acao, aoClicar }: { texto: string; acao?: string; aoClicar?: () => void }) {
  return (
    <div className="aviso" role="status">
      <p>{texto}</p>
      {acao && (
        <button className="botao botao--secundario" onClick={aoClicar}>
          {acao}
        </button>
      )}
    </div>
  );
}
