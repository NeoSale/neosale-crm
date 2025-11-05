'use client';

import React from 'react';
import { toast } from 'react-hot-toast';
import { DocumentDuplicateIcon } from '@heroicons/react/24/outline';

// Função para formatar telefone
export const formatPhone = (phone: string): string => {
  if (!phone) return '';
  // Remove todos os caracteres não numéricos
  const cleaned = phone.replace(/\D/g, '');

  // Se tem 13 dígitos e começa com 55, é um número brasileiro
  if (cleaned.length === 13 && cleaned.startsWith('55')) {
    const countryCode = cleaned.slice(0, 2);
    const areaCode = cleaned.slice(2, 4);
    const firstPart = cleaned.slice(4, 9);
    const secondPart = cleaned.slice(9, 13);
    return `(${areaCode}) ${firstPart}-${secondPart}`;
  }

  // Se tem 12 dígitos e começa com 55, é um número brasileiro (telefone fixo)
  if (cleaned.length === 12 && cleaned.startsWith('55')) {
    const countryCode = cleaned.slice(0, 2);
    const areaCode = cleaned.slice(2, 4);
    const firstPart = cleaned.slice(4, 8);
    const secondPart = cleaned.slice(8, 12);
    return `(${areaCode}) ${firstPart}-${secondPart}`;
  }

  // Se tem 11 dígitos, assume que é brasileiro sem código do país
  if (cleaned.length === 11) {
    const areaCode = cleaned.slice(0, 2);
    const firstPart = cleaned.slice(2, 7);
    const secondPart = cleaned.slice(7, 11);
    return `(${areaCode}) ${firstPart}-${secondPart}`;
  }

  // Se tem 10 dígitos, assume que é brasileiro sem código do país (telefone fixo)
  if (cleaned.length === 10) {
    const areaCode = cleaned.slice(0, 2);
    const firstPart = cleaned.slice(2, 6);
    const secondPart = cleaned.slice(6, 10);
    return `(${areaCode}) ${firstPart}-${secondPart}`;
  }

  // Retorna o número original se não conseguir formatar
  return phone;
};

// Função para copiar telefone para clipboard (número bruto sem formatação e sem código 55)
export const copyPhone = async (phone: string): Promise<void> => {
  try {
    // Verifica se o número tem o padrão @lid
    if (phone.includes('@lid')) {
      // Se tem @lid, copia o número completo incluindo @lid
      await navigator.clipboard.writeText(phone);
      toast.success('Telefone copiado!');
      return;
    }
    
    // Remove todos os caracteres não numéricos
    const cleaned = phone.replace(/\D/g, '');
    
    // Remove o código do país 55 se presente
    let phoneNumber = cleaned;
    if (cleaned.startsWith('55') && (cleaned.length === 12 || cleaned.length === 13)) {
      phoneNumber = cleaned.substring(2);
    }
    
    await navigator.clipboard.writeText(phoneNumber);
    toast.success('Telefone copiado!');
  } catch (error) {
    toast.error('Erro ao copiar telefone');
  }
};

// Componente para exibir telefone formatado com botão de cópia
interface FormattedPhoneProps {
  phone: string;
  className?: string;
  showCopyButton?: boolean;
  copyButtonClassName?: string;
}

export const FormattedPhone: React.FC<FormattedPhoneProps> = ({ 
  phone, 
  className = '', 
  showCopyButton = true,
  copyButtonClassName = 'p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors'
}) => {
  const formattedPhone = formatPhone(phone);
  
  if (!formattedPhone) {
    return <span className={className}>Telefone não disponível</span>;
  }

  return (
    <div className="flex items-center space-x-2">
      <span className={className}>{formattedPhone}</span>
      {showCopyButton && (
        <button
          onClick={() => copyPhone(formattedPhone)}
          className={copyButtonClassName}
          title="Copiar telefone"
        >
          <DocumentDuplicateIcon className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

// Função para remover o prefixo '55' do telefone para exibição no formulário
export const removePhonePrefix = (phone: string): string => {
  if (!phone) return '';
  const cleanPhone = phone.replace(/\D/g, '');
  // Se começa com 55, remove o prefixo
  if (cleanPhone.startsWith('55') && cleanPhone.length > 2) {
    return cleanPhone.substring(2);
  }
  return cleanPhone;
};

// Função para formatar telefone com máscara 55 (99) 99999-9999 ou 55 (99) 9999-9999
export const formatPhoneDisplay = (phone: string): string => {
  // Remove todos os caracteres não numéricos
  const cleanPhone = phone.replace(/\D/g, '');

  // Se tem 13 dígitos e começa com 55 (celular com código do país)
  if (cleanPhone.length === 13 && cleanPhone.startsWith('55')) {
    return `${cleanPhone.slice(0, 2)} (${cleanPhone.slice(2, 4)}) ${cleanPhone.slice(4, 9)}-${cleanPhone.slice(9, 13)}`;
  }

  // Se tem 12 dígitos e começa com 55 (fixo com código do país)
  if (cleanPhone.length === 12 && cleanPhone.startsWith('55')) {
    return `${cleanPhone.slice(0, 2)} (${cleanPhone.slice(2, 4)}) ${cleanPhone.slice(4, 8)}-${cleanPhone.slice(8, 12)}`;
  }

  // Se tem 11 dígitos (celular sem código do país), adiciona o 55
  if (cleanPhone.length === 11) {
    return `55 (${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2, 7)}-${cleanPhone.slice(7, 11)}`;
  }

  // Se tem 10 dígitos (fixo sem código do país), adiciona o 55
  if (cleanPhone.length === 10) {
    return `55 (${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2, 6)}-${cleanPhone.slice(6, 10)}`;
  }

  // Para números menores, aplica formatação parcial
  if (cleanPhone.length <= 2) {
    return cleanPhone;
  } else if (cleanPhone.length <= 6) {
    // DDD + até 4 dígitos (formato fixo)
    return `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2)}`;
  } else if (cleanPhone.length <= 10) {
    // DDD + 4 dígitos + hífen + resto (formato fixo)
    return `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2, 6)}-${cleanPhone.slice(6)}`;
  } else if (cleanPhone.length === 11) {
    // DDD + 5 dígitos + hífen + 4 dígitos (formato celular)
    return `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2, 7)}-${cleanPhone.slice(7)}`;
  }

  // Padrão para números com mais de 11 dígitos
  return `${cleanPhone.slice(0, 2)} (${cleanPhone.slice(2, 4)}) ${cleanPhone.slice(4, 9)}-${cleanPhone.slice(9, 13)}`;
};

export default FormattedPhone;