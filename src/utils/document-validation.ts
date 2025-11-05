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

/**
 * Formata um CPF removendo caracteres especiais
 * @param cpf - CPF com ou sem formatação
 * @returns CPF apenas com números
 */
export const cleanCPF = (cpf: string): string => {
  return cpf.replace(/\D/g, '');
};

/**
 * Formata um CPF para o padrão brasileiro XXX.XXX.XXX-XX
 * @param cpf - CPF apenas com números
 * @returns CPF formatado
 */
export const formatCPF = (cpf: string): string => {
  const cleaned = cleanCPF(cpf);
  if (cleaned.length !== 11) return cpf;
  
  return cleaned.replace(
    /(\d{3})(\d{3})(\d{3})(\d{2})/,
    '$1.$2.$3-$4'
  );
};

/**
 * Valida se o formato do CPF está correto (XXX.XXX.XXX-XX)
 * @param cpf - CPF formatado
 * @returns true se o formato estiver correto
 */
export const isValidCPFFormat = (cpf: string): boolean => {
  const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
  return cpfRegex.test(cpf);
};

/**
 * Calcula os dígitos verificadores do CPF
 * @param cpfBase - Os primeiros 9 dígitos do CPF
 * @returns Array com os dois dígitos verificadores
 */
const calculateCPFVerificationDigits = (cpfBase: string): [number, number] => {
  // Primeiro dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpfBase.charAt(i)) * (10 - i);
  }
  let resto = soma % 11;
  const digito1 = resto < 2 ? 0 : 11 - resto;

  // Segundo dígito verificador
  soma = 0;
  const cpfComPrimeiroDigito = cpfBase + digito1;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpfComPrimeiroDigito.charAt(i)) * (11 - i);
  }
  resto = soma % 11;
  const digito2 = resto < 2 ? 0 : 11 - resto;

  return [digito1, digito2];
};

/**
 * Valida um CPF completo (formato e dígitos verificadores)
 * @param cpf - CPF com ou sem formatação
 * @returns Objeto com resultado da validação
 */
export const validateCPF = (cpf: string): {
  isValid: boolean;
  error?: string;
  formatted?: string;
} => {
  if (!cpf || !cpf.trim()) {
    return { isValid: false, error: 'CPF é obrigatório' };
  }

  const cleaned = cleanCPF(cpf);

  // Verifica se tem 11 dígitos
  if (cleaned.length !== 11) {
    return { 
      isValid: false, 
      error: 'CPF deve ter 11 dígitos no formato XXX.XXX.XXX-XX' 
    };
  }

  // Verifica se não são todos os dígitos iguais
  if (/^(\d)\1{10}$/.test(cleaned)) {
    return { isValid: false, error: 'CPF inválido - todos os dígitos são iguais' };
  }

  // Valida os dígitos verificadores
  const cpfBase = cleaned.substring(0, 9);
  const [expectedDigit1, expectedDigit2] = calculateCPFVerificationDigits(cpfBase);
  
  const actualDigit1 = parseInt(cleaned.charAt(9));
  const actualDigit2 = parseInt(cleaned.charAt(10));

  if (actualDigit1 !== expectedDigit1 || actualDigit2 !== expectedDigit2) {
    return { isValid: false, error: 'CPF inválido - dígitos verificadores incorretos' };
  }

  return { 
    isValid: true, 
    formatted: formatCPF(cleaned)
  };
};

/**
 * Valida CPF para uso em formulários (permite campo vazio)
 * @param cpf - CPF com ou sem formatação
 * @returns String com erro ou null se válido
 */
export const validateCPFForForm = (cpf: string): string | null => {
  if (!cpf || !cpf.trim()) {
    return null; // CPF não é obrigatório
  }

  const result = validateCPF(cpf);
  return result.isValid ? null : result.error || 'CPF inválido';
};

/**
 * Aplica máscara de CPF durante a digitação
 * @param value - Valor atual do input
 * @returns Valor formatado com máscara
 */
export const applyCPFMask = (value: string): string => {
  const cleaned = cleanCPF(value);
  
  // Limita a 11 dígitos
  const limited = cleaned.substring(0, 11);
  
  // Aplica a máscara progressivamente
  if (limited.length <= 3) {
    return limited;
  } else if (limited.length <= 6) {
    return limited.replace(/(\d{3})(\d+)/, '$1.$2');
  } else if (limited.length <= 9) {
    return limited.replace(/(\d{3})(\d{3})(\d+)/, '$1.$2.$3');
  } else {
    return limited.replace(/(\d{3})(\d{3})(\d{3})(\d+)/, '$1.$2.$3-$4');
  }
};