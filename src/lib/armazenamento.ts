import { useEffect, useState } from 'react';
import type { Dados } from './calculo';
import { DADOS_EXEMPLO } from './exemplo';

// Por enquanto os dados ficam só no celular da lash (localStorage).
// Quando houver login das compradoras, isso passa a ser salvo no servidor.

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

export function novoId(): string {
  return Math.random().toString(36).slice(2, 10);
}
