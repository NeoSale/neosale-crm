/**
 * Utilitários para gerenciamento do cliente_id no sistema
 */

/**
 * Obtém o cliente_id de forma global
 * Prioriza o parâmetro fornecido, depois o localStorage
 * @param cliente_id - ID do cliente fornecido como parâmetro (opcional)
 * @returns string | undefined - O cliente_id encontrado ou undefined
 */
export const getClienteId = (cliente_id?: string): string | undefined => {
  // Se foi fornecido como parâmetro, usar ele
  if (cliente_id) {
    return cliente_id;
  }
  
  // Verificar se estamos no lado do cliente (browser)
  if (typeof window !== 'undefined') {
    return localStorage.getItem('cliente_id') || undefined;
  }
  
  return undefined;
};

/**
 * Define o cliente_id no localStorage
 * @param cliente_id - ID do cliente para armazenar
 */
export const setClienteId = (cliente_id: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('cliente_id', cliente_id);
  }
};

/**
 * Remove o cliente_id do localStorage
 */
export const removeClienteId = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('cliente_id');
  }
};

/**
 * Verifica se existe um cliente_id armazenado
 * @returns boolean - true se existe cliente_id
 */
export const hasClienteId = (): boolean => {
  if (typeof window !== 'undefined') {
    const clienteId = localStorage.getItem('cliente_id');
    return clienteId !== null && clienteId !== '';
  }
  return false;
};

/**
 * Obtém o cliente_id atual do localStorage
 * @returns string | null - O cliente_id armazenado ou null
 */
export const getCurrentClienteId = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('cliente_id');
  }
  return null;
};