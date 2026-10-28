import { useMemo, useState } from 'react';
import { calcular, type Dados } from './lib/calculo';
import { useEstado } from './lib/armazenamento';
import { DADOS_EXEMPLO, DADOS_VAZIOS } from './lib/exemplo';
import { Resultado } from './telas/Resultado';
import { Rotina } from './telas/Rotina';
import { Custos } from './telas/Custos';
import { Materiais } from './telas/Materiais';
import { Procedimentos } from './telas/Procedimentos';

export type Aba = 'precos' | 'rotina' | 'custos' | 'materiais' | 'procedimentos';

const ABAS: { id: Aba; rotulo: string }[] = [
  { id: 'precos', rotulo: 'Preços' },
  { id: 'rotina', rotulo: 'Rotina' },
  { id: 'custos', rotulo: 'Custos' },
  { id: 'materiais', rotulo: 'Materiais' },
  { id: 'procedimentos', rotulo: 'Proced.' },
];

export function App() {
  const [estado, setEstado] = useEstado();
  const [aba, setAba] = useState<Aba>('precos');
  const resumo = useMemo(() => calcular(estado.dados), [estado.dados]);

  // qualquer edição transforma o exemplo nos dados da lash
  const mudar = <K extends keyof Dados>(chave: K, valor: Dados[K]) =>
    setEstado((e) => ({ exemplo: false, dados: { ...e.dados, [chave]: valor } }));

  const irPara = (nova: Aba) => {
    setAba(nova);
    window.scrollTo({ top: 0 });
  };

  const { dados } = estado;

  return (
    <div className="app">
      <header className="marca">
        <span className="marca__nome">LASH EMPRESÁRIA</span>
        <span className="marca__apoio">Precificação • para • lash designers</span>
      </header>

      {estado.exemplo && (
        <div className="faixa-exemplo">
          <p>Você está vendo um exemplo. Troque pelos seus números ou comece do zero.</p>
          <button
            className="botao botao--claro"
            onClick={() => {
              setEstado({ exemplo: false, dados: DADOS_VAZIOS });
              irPara('rotina');
            }}
          >
            Começar do zero
          </button>
        </div>
      )}

      <main className="conteudo">
        {aba === 'precos' && (
          <Resultado resumo={resumo} ajustes={dados.ajustes} aoMudarAjustes={(a) => mudar('ajustes', a)} irPara={irPara} />
        )}
        {aba === 'rotina' && <Rotina rotina={dados.rotina} resumo={resumo} aoMudar={(r) => mudar('rotina', r)} />}
        {aba === 'custos' && (
          <Custos
            custos={dados.custosFixos}
            ajustes={dados.ajustes}
            resumo={resumo}
            aoMudarCustos={(c) => mudar('custosFixos', c)}
            aoMudarAjustes={(a) => mudar('ajustes', a)}
          />
        )}
        {aba === 'materiais' && <Materiais materiais={dados.materiais} aoMudar={(m) => mudar('materiais', m)} />}
        {aba === 'procedimentos' && (
          <Procedimentos procedimentos={dados.procedimentos} materiais={dados.materiais} aoMudar={(p) => mudar('procedimentos', p)} />
        )}

        {!estado.exemplo && aba === 'precos' && (
          <button
            className="link-discreto"
            onClick={() => setEstado({ exemplo: true, dados: DADOS_EXEMPLO })}
          >
            Ver o exemplo de novo (apaga seus dados)
          </button>
        )}
      </main>

      <nav className="abas" aria-label="Seções">
        {ABAS.map((a) => (
          <button
            key={a.id}
            className={a.id === aba ? 'aba aba--ativa' : 'aba'}
            aria-current={a.id === aba ? 'page' : undefined}
            onClick={() => irPara(a.id)}
          >
            {a.rotulo}
          </button>
        ))}
      </nav>
    </div>
  );
}
