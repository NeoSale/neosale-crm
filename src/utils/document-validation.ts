/**
 * Utilitários para validação de documentos brasileiros
 */

/**
 * Formata um CNPJ removendo caracteres especiais
 * @param cnpj - CNPJ com ou sem formatação
 * @returns CNPJ apenas com números
 */
export const cleanCNPJ = (cnpj: string): string => {
  return cnpj.replace(/\D/g, '');
};

/**
 * Formata um CNPJ para o padrão brasileiro XX.XXX.XXX/XXXX-XX
 * @param cnpj - CNPJ apenas com números
 * @returns CNPJ formatado
 */
export const formatCNPJ = (cnpj: string): string => {
  const cleaned = cleanCNPJ(cnpj);
  if (cleaned.length !== 14) return cnpj;
  
  return cleaned.replace(
    /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
    '$1.$2.$3/$4-$5'
  );
};

/**
 * Valida se o formato do CNPJ está correto (XX.XXX.XXX/XXXX-XX)
 * @param cnpj - CNPJ formatado
 * @returns true se o formato estiver correto
 */
export const isValidCNPJFormat = (cnpj: string): boolean => {
  const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;
  return cnpjRegex.test(cnpj);
};

/**
 * Calcula os dígitos verificadores do CNPJ
 * @param cnpjBase - Os primeiros 12 dígitos do CNPJ
 * @returns Array com os dois dígitos verificadores
 */
const calculateCNPJVerificationDigits = (cnpjBase: string): [number, number] => {
  // Primeiro dígito verificador
  let soma = 0;
  let peso = 2;
  for (let i = 11; i >= 0; i--) {
    soma += parseInt(cnpjBase.charAt(i)) * peso;
    peso = peso === 9 ? 2 : peso + 1;
  }
  const digito1 = soma % 11 < 2 ? 0 : 11 - (soma % 11);

  // Segundo dígito verificador
  soma = 0;
  peso = 2;
  const cnpjComPrimeiroDigito = cnpjBase + digito1;
  for (let i = 12; i >= 0; i--) {
    soma += parseInt(cnpjComPrimeiroDigito.charAt(i)) * peso;
    peso = peso === 9 ? 2 : peso + 1;
  }
  const digito2 = soma % 11 < 2 ? 0 : 11 - (soma % 11);

  return [digito1, digito2];
};

/**
 * Valida um CNPJ completo (formato e dígitos verificadores)
 * @param cnpj - CNPJ com ou sem formatação
 * @returns Objeto com resultado da validação
 */
export const validateCNPJ = (cnpj: string): {
  isValid: boolean;
  error?: string;
  formatted?: string;
} => {
  if (!cnpj || !cnpj.trim()) {
    return { isValid: false, error: 'CNPJ é obrigatório' };
  }

  const cleaned = cleanCNPJ(cnpj);

  // Verifica se tem 14 dígitos
  if (cleaned.length !== 14) {
    return { 
      isValid: false, 
      error: 'CNPJ deve ter 14 dígitos no formato XX.XXX.XXX/XXXX-XX' 
    };
  }

  // Verifica se não são todos os dígitos iguais
  if (/^(\d)\1{13}$/.test(cleaned)) {
    return { isValid: false, error: 'CNPJ inválido - todos os dígitos são iguais' };
  }

  // Valida os dígitos verificadores
  const cnpjBase = cleaned.substring(0, 12);
  const [expectedDigit1, expectedDigit2] = calculateCNPJVerificationDigits(cnpjBase);
  
  const actualDigit1 = parseInt(cleaned.charAt(12));
  const actualDigit2 = parseInt(cleaned.charAt(13));

  if (actualDigit1 !== expectedDigit1 || actualDigit2 !== expectedDigit2) {
    return { isValid: false, error: 'CNPJ inválido - dígitos verificadores incorretos' };
  }

  return { 
    isValid: true, 
    formatted: formatCNPJ(cleaned)
  };
};

/**
 * Valida CNPJ para uso em formulários (permite campo vazio)
 * @param cnpj - CNPJ com ou sem formatação
 * @returns String com erro ou null se válido
 */
export const validateCNPJForForm = (cnpj: string): string | null => {
  if (!cnpj || !cnpj.trim()) {
    return null; // CNPJ não é obrigatório
  }

  const result = validateCNPJ(cnpj);
  return result.isValid ? null : result.error || 'CNPJ inválido';
};

/**
 * Aplica máscara de CNPJ durante a digitação
 * @param value - Valor atual do input
 * @returns Valor formatado com máscara
 */
export const applyCNPJMask = (value: string): string => {
  const cleaned = cleanCNPJ(value);
  
  // Limita a 14 dígitos
  const limited = cleaned.substring(0, 14);
  
  // Aplica a máscara progressivamente
  if (limited.length <= 2) {
    return limited;
  } else if (limited.length <= 5) {
    return limited.replace(/(\d{2})(\d+)/, '$1.$2');
  } else if (limited.length <= 8) {
    return limited.replace(/(\d{2})(\d{3})(\d+)/, '$1.$2.$3');
  } else if (limited.length <= 12) {
    return limited.replace(/(\d{2})(\d{3})(\d{3})(\d+)/, '$1.$2.$3/$4');
  } else {
    return limited.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d+)/, '$1.$2.$3/$4-$5');
  }
};