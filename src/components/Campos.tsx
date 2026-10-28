import { useEffect, useId, useState } from 'react';

/** Converte "1.234,56", "1234,56" ou "1234.56" em número. */
export function lerNumero(texto: string): number {
  const limpo = texto.trim().replace(/\s|R\$/g, '');
  if (!limpo) return 0;
  const normalizado = limpo.includes(',') ? limpo.replace(/\./g, '').replace(',', '.') : limpo;
  const n = Number(normalizado);
  return Number.isFinite(n) ? n : 0;
}

export function mostrarNumero(n: number): string {
  if (!n) return '';
  return n.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
}

interface CampoNumeroProps {
  rotulo: string;
  valor: number;
  aoMudar: (n: number) => void;
  prefixo?: string;
  sufixo?: string;
  ajuda?: string;
  compacto?: boolean;
}

/** Campo numérico que aceita vírgula, como a lash digita no celular. */
export function CampoNumero({ rotulo, valor, aoMudar, prefixo, sufixo, ajuda, compacto }: CampoNumeroProps) {
  const id = useId();
  const [texto, setTexto] = useState(mostrarNumero(valor));

  // atualiza o texto quando o valor muda por fora (ex.: "Começar do zero")
  useEffect(() => {
    if (lerNumero(texto) !== valor) setTexto(mostrarNumero(valor));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valor]);

  return (
    <div className={compacto ? 'campo campo--compacto' : 'campo'}>
      <label htmlFor={id} className="rotulo">
        {rotulo}
      </label>
      <div className="entrada">
        {prefixo && <span className="entrada__extra">{prefixo}</span>}
        <input
          id={id}
          inputMode="decimal"
          autoComplete="off"
          value={texto}
          placeholder="0"
          onChange={(e) => {
            setTexto(e.target.value);
            aoMudar(lerNumero(e.target.value));
          }}
        />
        {sufixo && <span className="entrada__extra">{sufixo}</span>}
      </div>
      {ajuda && <p className="ajuda">{ajuda}</p>}
    </div>
  );
}

interface CampoTextoProps {
  rotulo: string;
  valor: string;
  aoMudar: (t: string) => void;
  placeholder?: string;
  tipo?: 'texto' | 'email' | 'senha' | 'nova-senha';
}

const TECLADO = {
  texto: {},
  email: { type: 'email', inputMode: 'email', autoComplete: 'email', autoCapitalize: 'none' },
  senha: { type: 'password', autoComplete: 'current-password' },
  'nova-senha': { type: 'password', autoComplete: 'new-password', minLength: 8 },
} as const;

export function CampoTexto({ rotulo, valor, aoMudar, placeholder, tipo = 'texto' }: CampoTextoProps) {
  const id = useId();
  return (
    <div className="campo">
      <label htmlFor={id} className="rotulo">
        {rotulo}
      </label>
      <div className="entrada">
        <input id={id} {...TECLADO[tipo]} value={valor} placeholder={placeholder} onChange={(e) => aoMudar(e.target.value)} />
      </div>
    </div>
  );
}
