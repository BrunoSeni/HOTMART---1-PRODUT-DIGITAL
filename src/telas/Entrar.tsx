import { useState, type FormEvent, type ReactNode } from 'react';
import { CampoTexto } from '../components/Campos';
import { confirmarCodigo, enviarCodigo, LINK_COMPRA, sair } from '../lib/acesso';

function Moldura({ children }: { children: ReactNode }) {
  return (
    <div className="app app--sem-abas">
      <header className="marca">
        <span className="marca__nome">LASH EMPRESÁRIA</span>
        <span className="marca__apoio">Precificação • para • lash designers</span>
      </header>
      <main className="conteudo">
        <div className="tela">{children}</div>
      </main>
    </div>
  );
}

export function Carregando() {
  return (
    <Moldura>
      <p className="apoio">Carregando…</p>
    </Moldura>
  );
}

export function ErroConexao() {
  return (
    <Moldura>
      <header className="tela__cabecalho">
        <h1 className="titulo-md">Sem conexão</h1>
        <p className="apoio">Não conseguimos confirmar seu acesso. Confira a internet e tente de novo.</p>
      </header>
      <button className="botao" onClick={() => window.location.reload()}>
        Tentar de novo
      </button>
    </Moldura>
  );
}

/** Login sem senha: a compradora recebe um código no e-mail usado na compra. */
export function Entrar() {
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [etapa, setEtapa] = useState<'email' | 'codigo'>('email');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  const pedirCodigo = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) return setErro('Digite o e-mail que você usou na compra.');
    setEnviando(true);
    setErro('');
    try {
      await enviarCodigo(email);
      setEtapa('codigo');
    } catch {
      setErro('Não conseguimos enviar o código agora. Espere um minuto e tente de novo.');
    } finally {
      setEnviando(false);
    }
  };

  const entrar = async (e: FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setErro('');
    try {
      await confirmarCodigo(email, codigo);
    } catch {
      setErro('Código inválido ou vencido. Confira o último e-mail ou peça um novo código.');
      setEnviando(false);
    }
  };

  return (
    <Moldura>
      <header className="tela__cabecalho">
        <span className="eyebrow">Área da compradora</span>
        <h1 className="titulo">Entrar</h1>
        <p className="apoio">
          {etapa === 'email'
            ? 'Digite o e-mail que você usou na compra. Vamos te mandar um código de acesso.'
            : `Mandamos um código para ${email.trim().toLowerCase()}. Confira também a caixa de spam.`}
        </p>
      </header>

      {etapa === 'email' ? (
        <form className="lista" onSubmit={pedirCodigo}>
          <CampoTexto rotulo="E-mail" valor={email} aoMudar={setEmail} placeholder="voce@email.com" tipo="email" />
          <button className="botao" disabled={enviando}>
            {enviando ? 'Enviando…' : 'Receber código'}
          </button>
        </form>
      ) : (
        <form className="lista" onSubmit={entrar}>
          <CampoTexto rotulo="Código" valor={codigo} aoMudar={setCodigo} placeholder="000000" tipo="codigo" />
          <button className="botao" disabled={enviando || codigo.trim().length < 6}>
            {enviando ? 'Entrando…' : 'Entrar'}
          </button>
          <button
            type="button"
            className="botao botao--secundario"
            onClick={() => {
              setEtapa('email');
              setCodigo('');
              setErro('');
            }}
          >
            Usar outro e-mail
          </button>
        </form>
      )}

      {erro && (
        <p className="negativo" role="alert">
          {erro}
        </p>
      )}

      {LINK_COMPRA && (
        <p className="ajuda">
          Ainda não tem a Lash Empresária? <a href={LINK_COMPRA}>Garanta seu acesso</a>.
        </p>
      )}
    </Moldura>
  );
}

interface SemAcessoProps {
  email: string;
  venceuEm?: Date;
}

/** Entrou, mas não há compra ativa com esse e-mail (ou o plano anual venceu). */
export function SemAcesso({ email, venceuEm }: SemAcessoProps) {
  return (
    <Moldura>
      <header className="tela__cabecalho">
        <span className="eyebrow">{email}</span>
        <h1 className="titulo-md">{venceuEm ? 'Seu acesso venceu' : 'Não achamos sua compra'}</h1>
        <p className="apoio">
          {venceuEm
            ? `Seu plano anual terminou em ${venceuEm.toLocaleDateString('pt-BR')}. Renove para continuar usando a calculadora com os seus números.`
            : 'Não encontramos uma compra ativa com este e-mail. Se você comprou com outro e-mail, entre com ele. A liberação pode levar alguns minutos depois do pagamento.'}
        </p>
      </header>
      {LINK_COMPRA && (
        <a className="botao" href={LINK_COMPRA}>
          {venceuEm ? 'Renovar acesso' : 'Garantir meu acesso'}
        </a>
      )}
      <button className="botao botao--secundario" onClick={() => sair()}>
        Entrar com outro e-mail
      </button>
    </Moldura>
  );
}
