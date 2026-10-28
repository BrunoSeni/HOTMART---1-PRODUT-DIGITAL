import { DIAS_DA_SEMANA, type Resumo, type Rotina as TRotina } from '../lib/calculo';
import { CampoNumero } from '../components/Campos';

interface Props {
  rotina: TRotina;
  resumo: Resumo;
  aoMudar: (r: TRotina) => void;
}

export function Rotina({ rotina, resumo, aoMudar }: Props) {
  return (
    <div className="tela">
      <header className="tela__cabecalho">
        <span className="eyebrow">Passo 1</span>
        <h1 className="titulo">Sua rotina</h1>
        <p className="apoio">Quantas horas você fica disponível para atender em cada dia da semana?</p>
      </header>

      <div className="grade-2">
        {DIAS_DA_SEMANA.map((dia, i) => (
          <CampoNumero
            key={dia}
            compacto
            rotulo={dia}
            sufixo="h"
            valor={rotina.horasPorDia[i]}
            aoMudar={(n) => {
              const horasPorDia = [...rotina.horasPorDia];
              horasPorDia[i] = n;
              aoMudar({ ...rotina, horasPorDia });
            }}
          />
        ))}
      </div>

      <section className="secao">
        <CampoNumero
          rotulo="Ocupação da agenda"
          sufixo="%"
          valor={Math.round(rotina.ocupacao * 100)}
          aoMudar={(n) => aoMudar({ ...rotina, ocupacao: Math.min(n, 100) / 100 })}
          ajuda="Nenhuma agenda fica 100% cheia: tem falta de cliente, horário vazio e intervalo. 80% é um bom começo."
        />
      </section>

      <dl className="resumo">
        <dt>Horas por semana</dt>
        <dd>{resumo.horasSemana.toLocaleString('pt-BR')} h</dd>
        <dt>Horas por mês (4,33 semanas)</dt>
        <dd>{Math.round(resumo.horasMes)} h</dd>
        <dt>Horas de atendimento de verdade</dt>
        <dd>{Math.round(resumo.horasProdutivasMes)} h</dd>
      </dl>
    </div>
  );
}
