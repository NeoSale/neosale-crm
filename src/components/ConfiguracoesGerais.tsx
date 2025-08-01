'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { configuracoesApi } from '@/services/configuracoesApi';

interface Configuracoes {
  apikey_openai?: string;
  prompt?: string;
  horario_inicio?: string;
  horario_fim?: string;
  quantidade_diaria_maxima?: string;
  envia_somente_dias_uteis?: boolean;
}

export default function ConfiguracoesGerais() {
  const [configuracoes, setConfiguracoes] = useState<Configuracoes>({});
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [editingApiKey, setEditingApiKey] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');

  useEffect(() => {
    loadConfiguracoes();
  }, []);

  const loadConfiguracoes = async () => {
    try {
      setLoadingData(true);
      const response = await configuracoesApi.getConfiguracoes();
      if (response.success && response.data && response.data.length > 0) {
        const config = response.data[0]; // Pega o primeiro item do array
        console.log('config', config);
        const configMap: Configuracoes = {
          apikey_openai: config.apikeyopenai || '',
          prompt: config.promptsdr || '',
          horario_inicio: config.horario_inicio ? `${config.horario_inicio.toString().padStart(2, '0')}:00` : '',
          horario_fim: config.horario_fim ? `${config.horario_fim.toString().padStart(2, '0')}:00` : '',
          quantidade_diaria_maxima: config.qtd_envio_diario ? config.qtd_envio_diario.toString() : '',
          envia_somente_dias_uteis: config.somente_dias_uteis || false
        };
        setConfiguracoes(configMap);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoadingData(false);
    }
  };

  const handleInputChange = (field: keyof Configuracoes, value: string | string[] | boolean) => {
    setConfiguracoes(prev => ({
      ...prev,
      [field]: value
    }));
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const configForm: { [key: string]: string } = {};
      
      if (configuracoes?.apikey_openai) {
        configForm.apikeyopenai = configuracoes.apikey_openai;
      }
      if (configuracoes?.prompt) {
        configForm.promptsdr = configuracoes.prompt;
      }
      if (configuracoes?.horario_inicio) {
        // Converter HH:MM para número (apenas a hora)
        const hora = parseInt(configuracoes.horario_inicio.split(':')[0]);
        configForm.horario_inicio = hora.toString();
      }
      if (configuracoes?.horario_fim) {
        // Converter HH:MM para número (apenas a hora)
        const hora = parseInt(configuracoes.horario_fim.split(':')[0]);
        configForm.horario_fim = hora.toString();
      }
      if (configuracoes?.quantidade_diaria_maxima) {
        configForm.qtd_envio_diario = configuracoes.quantidade_diaria_maxima;
      }
      if (configuracoes?.envia_somente_dias_uteis !== undefined) {
        configForm.somente_dias_uteis = configuracoes.envia_somente_dias_uteis.toString();
      }

      const success = await configuracoesApi.saveMultipleConfiguracoes(configForm);
      if (!success) {
        throw new Error('Falha ao salvar configurações');
      }
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações');
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
      {/* Seção de Configurações do Follow Up */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Configurações do Follow Up</h2>
          <p className="text-gray-600 mt-1">Gerencie as configurações do Follow Up</p>
        </div>

        <div className="p-6 space-y-6">
          {/* API Key */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              ApiKey (OpenAI)
              <div className="group relative ml-2">
                <svg className="h-4 w-4 text-blue-500 cursor-help" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                  Chave da API do OpenAI para integração com IA
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                </div>
              </div>
            </label>
            <div className="relative">
              {editingApiKey ? (
                <div className="flex space-x-2">
                  <input
                    type="password"
                    placeholder="sk-..."
                    value={tempApiKey}
                    onChange={(e) => setTempApiKey(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => {
                      handleInputChange('apikey_openai', tempApiKey);
                      setEditingApiKey(false);
                      setTempApiKey('');
                    }}
                    className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    ✓
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingApiKey(false);
                      setTempApiKey('');
                    }}
                    className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={configuracoes?.apikey_openai ? `${configuracoes.apikey_openai.substring(0, 8)}...${configuracoes.apikey_openai.substring(configuracoes.apikey_openai.length - 8)}` : ''}
                    readOnly
                    placeholder="Nenhuma API Key configurada"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900 cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setEditingApiKey(true);
                      setTempApiKey('');
                    }}
                    className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Editar
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Prompt */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              Prompt
              <div className="group relative ml-2">
                <svg className="h-4 w-4 text-blue-500 cursor-help" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                  Prompt personalizado para a IA
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                </div>
              </div>
            </label>
            <textarea
              value={configuracoes?.prompt as string || ''}
              onChange={(e) => handleInputChange('prompt', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 resize-y min-h-[100px] max-h-[400px]"
              placeholder="Digite o prompt personalizado para a IA..."
            />
          </div>

          {/* Horários de Funcionamento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                Horário de Início
                <div className="group relative ml-2">
                  <svg className="h-4 w-4 text-blue-500 cursor-help" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                    Horário de início de envio de mensagens
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                  </div>
                </div>
              </label>
              <input
                type="text"
                placeholder="HH"
                value={configuracoes?.horario_inicio || ''}
                onChange={(e) => {
                  let value = e.target.value.replace(/\D/g, '');
                  if (value.length >= 2) {
                    const hours = parseInt(value.substring(0, 2));
                    if (hours > 23) value = '23' + value.substring(2);
                  }
                  if (value.length >= 4) {
                    const minutes = parseInt(value.substring(2, 4));
                    if (minutes > 59) value = value.substring(0, 2) + '59';
                  }
                  if (value.length >= 2) {
                    value = value.substring(0, 2) + (value.length > 2 ? ':' + value.substring(2, 4) : '');
                  }
                  handleInputChange('horario_inicio', value);
                }}
                maxLength={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>

            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                Horário de Fim
                <div className="group relative ml-2">
                  <svg className="h-4 w-4 text-blue-500 cursor-help" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                    Horário de fim de envio de mensagens
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                  </div>
                </div>
              </label>
              <input
                type="text"
                placeholder="HH"
                value={configuracoes?.horario_fim || ''}
                onChange={(e) => {
                  let value = e.target.value.replace(/\D/g, '');
                  if (value.length >= 2) {
                    const hours = parseInt(value.substring(0, 2));
                    if (hours > 23) value = '23' + value.substring(2);
                  }
                  if (value.length >= 4) {
                    const minutes = parseInt(value.substring(2, 4));
                    if (minutes > 59) value = value.substring(0, 2) + '59';
                  }
                  if (value.length >= 2) {
                    value = value.substring(0, 2) + (value.length > 2 ? ':' + value.substring(2, 4) : '');
                  }
                  handleInputChange('horario_fim', value);
                }}
                maxLength={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>
          </div>

          {/* Quantidade Diária Máxima */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              Quantidade Máxima de Envios Diária
              <div className="group relative ml-2">
                 <svg className="h-4 w-4 text-blue-500 cursor-help" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                  Número máximo de mensagens enviadas por dia
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                </div>
              </div>
            </label>
            <input
              type="number"
              min="1"
              max="1000"
              value={configuracoes?.quantidade_diaria_maxima as string || ''}
              onChange={(e) => handleInputChange('quantidade_diaria_maxima', e.target.value)}
              className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              placeholder="Ex: 30"
            />
          </div>

          {/* Enviar Apenas em Dias Úteis */}
          <div>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={configuracoes?.envia_somente_dias_uteis as boolean || false}
                onChange={(e) => handleInputChange('envia_somente_dias_uteis', e.target.checked)}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-700">
                  Enviar Apenas em Dias Úteis
                </span>
                <div className="group relative ml-2">
                  <svg className="h-4 w-4 text-blue-500 cursor-help" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                    Quando ativado, os leads serão notificados apenas de segunda a sexta-feira
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                  </div>
                </div>
              </div>
            </label>
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={loadConfiguracoes}
              disabled={loading}
              className="px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              <span>{loading ? 'Salvando...' : 'Salvar'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}