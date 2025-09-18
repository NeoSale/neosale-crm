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
    return `+${countryCode} (${areaCode}) ${firstPart}-${secondPart}`;
  }

  // Se tem 12 dígitos e começa com 55, é um número brasileiro (telefone fixo)
  if (cleaned.length === 12 && cleaned.startsWith('55')) {
    const countryCode = cleaned.slice(0, 2);
    const areaCode = cleaned.slice(2, 4);
    const firstPart = cleaned.slice(4, 8);
    const secondPart = cleaned.slice(8, 12);
    return `+${countryCode} (${areaCode}) ${firstPart}-${secondPart}`;
  }

  // Se tem 11 dígitos, assume que é brasileiro sem código do país
  if (cleaned.length === 11) {
    const areaCode = cleaned.slice(0, 2);
    const firstPart = cleaned.slice(2, 7);
    const secondPart = cleaned.slice(7, 11);
    return `+55 (${areaCode}) ${firstPart}-${secondPart}`;
  }

  // Se tem 10 dígitos, assume que é brasileiro sem código do país (telefone fixo)
  if (cleaned.length === 10) {
    const areaCode = cleaned.slice(0, 2);
    const firstPart = cleaned.slice(2, 6);
    const secondPart = cleaned.slice(6, 10);
    return `+55 (${areaCode}) ${firstPart}-${secondPart}`;
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

// Função para formatar telefone com máscara (99) 99999-9999
export const formatPhoneDisplay = (phone: string): string => {
  // Remove todos os caracteres não numéricos
  const cleanPhone = phone.replace(/\D/g, '');

  // Aplica a máscara baseada no tamanho
  if (cleanPhone.length <= 2) {
    return cleanPhone;
  } else if (cleanPhone.length <= 7) {
    return `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2)}`;
  } else if (cleanPhone.length <= 11) {
    return `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2, 7)}-${cleanPhone.slice(7)}`;
  }

  // Limita a 11 dígitos
  return `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2, 7)}-${cleanPhone.slice(7, 11)}`;
};

export default FormattedPhone;