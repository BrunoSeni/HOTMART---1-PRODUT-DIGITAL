import { useState, type FormEvent, type ReactNode } from 'react';
import { CampoTexto } from '../components/Campos';
import { criarConta, entrar, LINK_COMPRA, recuperarSenha, sair, trocarSenha } from '../lib/acesso';

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

type Modo = 'entrar' | 'criar' | 'esqueci';

const TEXTOS: Record<Modo, { titulo: string; apoio: string; botao: string }> = {
  entrar: { titulo: 'Entrar', apoio: 'Use o e-mail da compra e a sua senha.', botao: 'Entrar' },
  criar: {
    titulo: 'Primeiro acesso',
    apoio: 'Crie sua senha com o mesmo e-mail que você usou na compra. Vamos mandar um link para confirmar o e-mail, só desta vez.',
    botao: 'Criar minha senha',
  },
  esqueci: {
    titulo: 'Nova senha',
    apoio: 'Digite o e-mail da compra. Vamos mandar um link para você criar uma senha nova.',
    botao: 'Enviar link',
  },
};

const MINIMO_SENHA = 8;

function mensagemDeErro(erro: unknown, modo: Modo): string {
  const codigo = (erro as { code?: string })?.code;
  if (codigo === 'invalid_credentials') return 'E-mail ou senha incorretos.';
  if (codigo === 'email_not_confirmed') return 'Falta confirmar seu e-mail: abra o link que mandamos no primeiro acesso.';
  if (codigo === 'weak_password') return `A senha precisa ter pelo menos ${MINIMO_SENHA} caracteres.`;
  if (codigo === 'over_email_send_rate_limit') return 'Muitas tentativas. Espere alguns minutos e tente de novo.';
  return modo === 'entrar' ? 'Não conseguimos entrar agora. Confira a internet e tente de novo.' : 'Não conseguimos enviar o e-mail agora. Tente de novo em alguns minutos.';
}

/** Login com e-mail e senha; primeiro acesso e "esqueci minha senha" na mesma tela. */
export function Entrar() {
  const [modo, setModo] = useState<Modo>('entrar');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');

  const trocarModo = (novo: Modo) => {
    setModo(novo);
    setSenha('');
    setErro('');
    setAviso('');
  };

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) return setErro('Digite o e-mail que você usou na compra.');
    if (modo === 'criar' && senha.length < MINIMO_SENHA) return setErro(`A senha precisa ter pelo menos ${MINIMO_SENHA} caracteres.`);
    setEnviando(true);
    setErro('');
    setAviso('');
    try {
      if (modo === 'entrar') await entrar(email, senha);
      if (modo === 'criar') {
        await criarConta(email, senha);
        setAviso('Pronto! Abra o e-mail que mandamos e toque no link para confirmar. Depois é só entrar com seu e-mail e senha. Se você já tinha criado a senha antes, use Entrar.');
      }
      if (modo === 'esqueci') {
        await recuperarSenha(email);
        setAviso('Se este e-mail tiver uma conta, você vai receber o link em instantes. Confira também a caixa de spam.');
      }
    } catch (falha) {
      setErro(mensagemDeErro(falha, modo));
    } finally {
      setEnviando(false);
    }
  };

  const texto = TEXTOS[modo];

  return (
    <Moldura>
      <header className="tela__cabecalho">
        <span className="eyebrow">Área da compradora</span>
        <h1 className="titulo">{texto.titulo}</h1>
        <p className="apoio">{texto.apoio}</p>
      </header>

      <form className="lista" onSubmit={enviar}>
        <CampoTexto rotulo="E-mail" valor={email} aoMudar={setEmail} placeholder="voce@email.com" tipo="email" />
        {modo !== 'esqueci' && (
          <CampoTexto rotulo="Senha" valor={senha} aoMudar={setSenha} tipo={modo === 'criar' ? 'nova-senha' : 'senha'} />
        )}
        <button className="botao" disabled={enviando}>
          {enviando ? 'Aguarde…' : texto.botao}
        </button>
      </form>

      {erro && (
        <p className="negativo" role="alert">
          {erro}
        </p>
      )}
      {aviso && (
        <p className="aviso" role="status">
          {aviso}
        </p>
      )}

      <div className="lista">
        {modo !== 'entrar' && (
          <button className="botao botao--secundario" onClick={() => trocarModo('entrar')}>
            Já tenho senha
          </button>
        )}
        {modo !== 'criar' && (
          <button className="botao botao--secundario" onClick={() => trocarModo('criar')}>
            Primeiro acesso
          </button>
        )}
        {modo === 'entrar' && (
          <button className="link-discreto" onClick={() => trocarModo('esqueci')}>
            Esqueci minha senha
          </button>
        )}
      </div>

      {LINK_COMPRA && (
        <p className="ajuda">
          Ainda não tem a Lash Empresária? <a href={LINK_COMPRA}>Garanta seu acesso</a>.
        </p>
      )}
    </Moldura>
  );
}

/** Aberta pelo link "esqueci minha senha" do e-mail. */
export function NovaSenha({ aoConcluir }: { aoConcluir: () => void }) {
  const [senha, setSenha] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  const salvar = async (e: FormEvent) => {
    e.preventDefault();
    if (senha.length < MINIMO_SENHA) return setErro(`A senha precisa ter pelo menos ${MINIMO_SENHA} caracteres.`);
    setEnviando(true);
    setErro('');
    try {
      await trocarSenha(senha);
      aoConcluir();
    } catch {
      setErro('Não conseguimos salvar a senha. Peça um novo link e tente de novo.');
      setEnviando(false);
    }
  };

  return (
    <Moldura>
      <header className="tela__cabecalho">
        <span className="eyebrow">Área da compradora</span>
        <h1 className="titulo">Nova senha</h1>
        <p className="apoio">Crie sua senha nova, com pelo menos {MINIMO_SENHA} caracteres.</p>
      </header>
      <form className="lista" onSubmit={salvar}>
        <CampoTexto rotulo="Nova senha" valor={senha} aoMudar={setSenha} tipo="nova-senha" />
        <button className="botao" disabled={enviando}>
          {enviando ? 'Salvando…' : 'Salvar senha'}
        </button>
      </form>
      {erro && (
        <p className="negativo" role="alert">
          {erro}
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
