'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { clientesApi, Cliente } from '@/services/clientesApi';
import { validateCNPJForForm, applyCNPJMask } from '@/utils/document-validation';
import { getCurrentClienteId } from '@/utils/cliente-utils';

interface ClienteCompleto extends Cliente {
  nome_responsavel_principal?: string;
  cnpj?: string;
  espaco_fisico?: boolean;
  site_oficial?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  cep?: string;
  cidade?: string;
  estado?: string;
  pais?: string;
  redes_sociais?: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
  };
  horario_funcionamento?: {
    [key: string]: {
      abertura?: string;
      fechamento?: string;
      ativo: boolean;
    };
  };
  regioes_atendidas?: string[];
}

interface FormErrors {
  [key: string]: string;
}

const diasSemana = [
  { key: 'segunda', label: 'Segunda-feira' },
  { key: 'terca', label: 'Terça-feira' },
  { key: 'quarta', label: 'Quarta-feira' },
  { key: 'quinta', label: 'Quinta-feira' },
  { key: 'sexta', label: 'Sexta-feira' },
  { key: 'sabado', label: 'Sábado' },
  { key: 'domingo', label: 'Domingo' }
];

export default function ConfiguracoesConta() {
  const [cliente, setCliente] = useState<ClienteCompleto>({
    id: '',
    nome: '',
    email: '',
    telefone: '',
    nome_responsavel_principal: '',
    cnpj: '',
    espaco_fisico: false,
    site_oficial: '',
    endereco: '',
    numero: '',
    complemento: '',
    cep: '',
    cidade: '',
    estado: '',
    pais: 'Brasil',
    redes_sociais: {
      facebook: '',
      instagram: '',
      linkedin: '',
    },
    horario_funcionamento: {
      segunda: { abertura: '08:00', fechamento: '18:00', ativo: true },
      terca: { abertura: '08:00', fechamento: '18:00', ativo: true },
      quarta: { abertura: '08:00', fechamento: '18:00', ativo: true },
      quinta: { abertura: '08:00', fechamento: '18:00', ativo: true },
      sexta: { abertura: '08:00', fechamento: '18:00', ativo: true },
      sabado: { abertura: '08:00', fechamento: '12:00', ativo: true },
      domingo: { ativo: false }
    },
    regioes_atendidas: []
  });
  
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [errors, setErrors] = useState<FormErrors>({});
  const [novaRegiao, setNovaRegiao] = useState('');

  useEffect(() => {
    loadCliente();
  }, []);

  const loadCliente = async () => {
    try {
      setLoadingData(true);
      const clienteId = getCurrentClienteId();
      if (!clienteId) {
        toast.error('Cliente não identificado');
        return;
      }

      // Buscar cliente específico por ID
      const response = await clientesApi.getClienteById(clienteId);
      if (response.success && response.data) {
        setCliente(prev => ({ ...prev, ...response.data }));
      }
    } catch (error) {
      console.error('Erro ao carregar cliente:', error);
      toast.error('Erro ao carregar dados do cliente');
    } finally {
      setLoadingData(false);
    }
  };

  const validateField = (name: string, value: any): string => {
    switch (name) {
      case 'nome':
        return !value || value.trim() === '' ? 'Nome é obrigatório' : '';
      case 'email':
        if (!value || value.trim() === '') return 'Email é obrigatório';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return !emailRegex.test(value) ? 'Email inválido' : '';
      case 'telefone':
        return !value || value.trim() === '' ? 'Telefone é obrigatório' : '';
      case 'cnpj':
        return validateCNPJForForm(value) || '';
      case 'cep':
        if (value && value.length > 0) {
          const cepRegex = /^\d{5}-\d{3}$/;
          return !cepRegex.test(value) ? 'CEP inválido' : '';
        }
        return '';
      case 'site_oficial':
        if (value && value.length > 0) {
          const urlRegex = /^https?:\/\/.+/;
          return !urlRegex.test(value) ? 'URL inválida (deve começar com http:// ou https://)' : '';
        }
        return '';
      default:
        return '';
    }
  };

  const handleInputChange = (name: string, value: any) => {
    setCliente(prev => ({ ...prev, [name]: value }));
    
    // Validação em tempo real
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleRedesSociaisChange = (rede: string, value: string) => {
    setCliente(prev => ({
      ...prev,
      redes_sociais: {
        ...prev.redes_sociais,
        [rede]: value
      }
    }));
  };

  const handleHorarioChange = (dia: string, campo: string, value: string | boolean) => {
    setCliente(prev => ({
      ...prev,
      horario_funcionamento: {
        ...prev.horario_funcionamento,
        [dia]: {
          abertura: prev.horario_funcionamento?.[dia]?.abertura || '',
          fechamento: prev.horario_funcionamento?.[dia]?.fechamento || '',
          ativo: prev.horario_funcionamento?.[dia]?.ativo || false,
          [campo]: value
        }
      }
    }));
  };

  const buscarCEP = async (cep: string) => {
    if (cep.length === 9) { // CEP com máscara: 00000-000
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep.replace('-', '')}/json/`);
        const data = await response.json();
        
        if (!data.erro) {
          setCliente(prev => ({
            ...prev,
            endereco: data.logradouro || '',
            cidade: data.localidade || '',
            estado: data.uf || '',
            pais: 'Brasil'
          }));
          toast.success('Endereço preenchido automaticamente');
        } else {
          toast.error('CEP não encontrado');
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
        toast.error('Erro ao buscar CEP');
      }
    }
  };

  const adicionarRegiao = () => {
    if (novaRegiao.trim() && !cliente.regioes_atendidas?.includes(novaRegiao.trim())) {
      setCliente(prev => ({
        ...prev,
        regioes_atendidas: [...(prev.regioes_atendidas || []), novaRegiao.trim()]
      }));
      setNovaRegiao('');
    }
  };

  const removerRegiao = (regiao: string) => {
    setCliente(prev => ({
      ...prev,
      regioes_atendidas: prev.regioes_atendidas?.filter(r => r !== regiao) || []
    }));
  };

  const formatCNPJ = (value: string) => {
    return applyCNPJMask(value);
  };

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{5})(\d{3})/, '$1-$2');
  };

  const formatTelefone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    newErrors.nome = validateField('nome', cliente.nome);
    newErrors.email = validateField('email', cliente.email);
    newErrors.telefone = validateField('telefone', cliente.telefone);
    newErrors.cnpj = validateField('cnpj', cliente.cnpj);
    newErrors.cep = validateField('cep', cliente.cep);
    newErrors.site_oficial = validateField('site_oficial', cliente.site_oficial);
    
    // Remove erros vazios
    Object.keys(newErrors).forEach(key => {
      if (!newErrors[key]) delete newErrors[key];
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Corrija os erros antes de salvar');
      return;
    }

    try {
      setLoading(true);
      
      // Atualizar cliente via API
      const response = await clientesApi.updateCliente(cliente.id, cliente);
      
      if (response.success) {
        toast.success('Dados salvos com sucesso!');
        // Recarregar dados atualizados
        await loadCliente();
      } else {
        toast.error(response.message || 'Erro ao salvar dados');
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar dados');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Informações Básicas */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Informações Básicas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Empresa *
                </label>
                <input
                  type="text"
                  value={cliente.nome}
                  onChange={(e) => handleInputChange('nome', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.nome ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Nome da empresa"
                />
                {errors.nome && <p className="text-red-500 text-sm mt-1">{errors.nome}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={cliente.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="email@empresa.com"
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone *
                </label>
                <input
                  type="text"
                  value={cliente.telefone}
                  onChange={(e) => handleInputChange('telefone', formatTelefone(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.telefone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="(11) 99999-9999"
                />
                {errors.telefone && <p className="text-red-500 text-sm mt-1">{errors.telefone}</p>}
              </div>
            </div>
          </div>

          {/* Dados Empresariais */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Dados Empresariais</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Responsável Principal
                </label>
                <input
                  type="text"
                  value={cliente.nome_responsavel_principal}
                  onChange={(e) => handleInputChange('nome_responsavel_principal', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nome do responsável"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CNPJ
                </label>
                <input
                  type="text"
                  value={cliente.cnpj}
                  onChange={(e) => handleInputChange('cnpj', formatCNPJ(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.cnpj ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                />
                {errors.cnpj && <p className="text-red-500 text-sm mt-1">{errors.cnpj}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Site Oficial
                </label>
                <input
                  type="url"
                  value={cliente.site_oficial}
                  onChange={(e) => handleInputChange('site_oficial', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.site_oficial ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="https://www.empresa.com"
                />
                {errors.site_oficial && <p className="text-red-500 text-sm mt-1">{errors.site_oficial}</p>}
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="espaco_fisico"
                  checked={cliente.espaco_fisico}
                  onChange={(e) => handleInputChange('espaco_fisico', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="espaco_fisico" className="ml-2 block text-sm text-gray-700">
                  Possui espaço físico
                </label>
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Endereço</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CEP
                </label>
                <input
                  type="text"
                  value={cliente.cep}
                  onChange={(e) => {
                    const formattedCEP = formatCEP(e.target.value);
                    handleInputChange('cep', formattedCEP);
                    buscarCEP(formattedCEP);
                  }}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.cep ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="00000-000"
                  maxLength={9}
                />
                {errors.cep && <p className="text-red-500 text-sm mt-1">{errors.cep}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Endereço
                </label>
                <input
                  type="text"
                  value={cliente.endereco}
                  onChange={(e) => handleInputChange('endereco', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Rua, Avenida, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número
                </label>
                <input
                  type="text"
                  value={cliente.numero}
                  onChange={(e) => handleInputChange('numero', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="123"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Complemento
                </label>
                <input
                  type="text"
                  value={cliente.complemento}
                  onChange={(e) => handleInputChange('complemento', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Apto 101, Bloco A, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cidade
                </label>
                <input
                  type="text"
                  value={cliente.cidade}
                  onChange={(e) => handleInputChange('cidade', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Cidade"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <input
                  type="text"
                  value={cliente.estado}
                  onChange={(e) => handleInputChange('estado', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Estado"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  País
                </label>
                <input
                  type="text"
                  value={cliente.pais}
                  onChange={(e) => handleInputChange('pais', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="País"
                />
              </div>
            </div>
          </div>

          {/* Redes Sociais */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Redes Sociais</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Facebook
                </label>
                <input
                  type="url"
                  value={cliente.redes_sociais?.facebook || ''}
                  onChange={(e) => handleRedesSociaisChange('facebook', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://facebook.com/empresa"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Instagram
                </label>
                <input
                  type="text"
                  value={cliente.redes_sociais?.instagram || ''}
                  onChange={(e) => handleRedesSociaisChange('instagram', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://www.instagram.com/empresa"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  LinkedIn
                </label>
                <input
                  type="url"
                  value={cliente.redes_sociais?.linkedin || ''}
                  onChange={(e) => handleRedesSociaisChange('linkedin', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://linkedin.com/company/empresa"
                />
              </div>
            </div>
          </div>

          {/* Horário de Funcionamento */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Horário de Funcionamento</h2>
            <div className="space-y-3">
              {diasSemana.map(dia => (
                <div key={dia.key} className="flex items-center space-x-4">
                  <div className="w-32">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={cliente.horario_funcionamento?.[dia.key]?.ativo || false}
                        onChange={(e) => handleHorarioChange(dia.key, 'ativo', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                      />
                      <span className="text-sm font-medium text-gray-700">{dia.label}</span>
                    </label>
                  </div>
                  
                  {cliente.horario_funcionamento?.[dia.key]?.ativo && (
                    <>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Abertura</label>
                        <input
                          type="time"
                          value={cliente.horario_funcionamento?.[dia.key]?.abertura || ''}
                          onChange={(e) => handleHorarioChange(dia.key, 'abertura', e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Fechamento</label>
                        <input
                          type="time"
                          value={cliente.horario_funcionamento?.[dia.key]?.fechamento || ''}
                          onChange={(e) => handleHorarioChange(dia.key, 'fechamento', e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={loadCliente}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || Object.keys(errors).length > 0}
              className={`px-6 py-2 rounded-md text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                loading || Object.keys(errors).length > 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvando...
                </div>
              ) : (
                'Salvar Alterações'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}