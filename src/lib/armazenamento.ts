import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import type { Dados } from './calculo';
import { DADOS_EXEMPLO } from './exemplo';
import { supabase } from './acesso';

// Os dados ficam no celular (localStorage) e, com login, também na conta da
// compradora (tabela `calculadoras` no Supabase), para não perder ao trocar de aparelho.

const CHAVE = 'lash-empresaria:v1';

export interface Estado {
  dados: Dados;
  /** true enquanto a lash ainda está vendo os números de exemplo. */
  exemplo: boolean;
}

function carregar(): Estado {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (bruto) return JSON.parse(bruto) as Estado;
  } catch {
    // armazenamento indisponível ou corrompido: começa do exemplo
  }
  return { dados: DADOS_EXEMPLO, exemplo: true };
}

export function useEstado() {
  const [estado, setEstado] = useState<Estado>(carregar);

  useEffect(() => {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(estado));
    } catch {
      // sem armazenamento, o app continua funcionando só nesta sessão
    }
  }, [estado]);

  return [estado, setEstado] as const;
}

const ESPERA_MS = 1500;

/**
 * Com login: ao entrar, os dados da conta substituem os do aparelho (ou, na
 * primeira vez, os do aparelho sobem para a conta). Depois, cada mudança é salva
 * na conta 1,5 s após a última edição.
 */
export function useSincronizar(estado: Estado, setEstado: Dispatch<SetStateAction<Estado>>, userId: string | null) {
  const [pronto, setPronto] = useState(false);
  const ultimoSalvo = useRef<string>('');

  useEffect(() => {
    setPronto(false);
    if (!supabase || !userId) return;
    let cancelado = false;
    supabase
      .from('calculadoras')
      .select('estado')
      .maybeSingle<{ estado: Estado }>()
      .then(({ data, error }) => {
        if (cancelado || error) return;
        if (data) {
          ultimoSalvo.current = JSON.stringify(data.estado);
          setEstado(data.estado);
        }
        setPronto(true);
      });
    return () => {
      cancelado = true;
    };
  }, [userId, setEstado]);

  useEffect(() => {
    if (!supabase || !userId || !pronto) return;
    const json = JSON.stringify(estado);
    if (json === ultimoSalvo.current) return;
    const t = setTimeout(() => {
      supabase!
        .from('calculadoras')
        .upsert({ user_id: userId, estado, atualizado_em: new Date().toISOString() })
        .then(({ error }) => {
          if (!error) ultimoSalvo.current = json;
        });
    }, ESPERA_MS);
    return () => clearTimeout(t);
  }, [estado, userId, pronto]);
}

export function novoId(): string {
  return Math.random().toString(36).slice(2, 10);
}
