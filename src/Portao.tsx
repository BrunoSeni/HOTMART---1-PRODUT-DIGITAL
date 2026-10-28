import { App } from './App';
import { supabase, useAcesso } from './lib/acesso';
import { Carregando, Entrar, ErroConexao, NovaSenha, SemAcesso } from './telas/Entrar';

/** Só mostra a calculadora para quem comprou. Sem Supabase configurado, abre direto. */
export function Portao() {
  return supabase ? <ComLogin /> : <App />;
}

function ComLogin() {
  const { situacao, erro, novaSenha, senhaDefinida } = useAcesso();
  if (erro) return <ErroConexao />;
  if (novaSenha) return <NovaSenha aoConcluir={senhaDefinida} />;

  switch (situacao.tipo) {
    case 'carregando':
      return <Carregando />;
    case 'sem-login':
      return <Entrar />;
    case 'sem-compra':
      return <SemAcesso email={situacao.email} />;
    case 'vencido':
      return <SemAcesso email={situacao.email} venceuEm={situacao.venceuEm} />;
    case 'liberado':
      return <App conta={situacao} />;
  }
}
