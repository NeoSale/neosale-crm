import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface Configuracao {
  id: string;
  chave: string;
  valor: string;
  createdAt: string;
  updatedAt: string;
}

interface ConfiguracaoForm {
  [key: string]: string | boolean;
}

const ConfiguracoesManager: React.FC = () => {
  const [configuracoes, setConfiguracoes] = useState<ConfiguracaoForm>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Carregar configurações ao montar o componente
  useEffect(() => {
    loadConfiguracoes();
  }, []);

  const loadConfiguracoes = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/configuracoes');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const configMap: { [key: string]: string } = {};
          data.data.forEach((config: Configuracao) => {
            configMap[config.chave] = config.valor;
          });

          const newConfiguracoes: ConfiguracaoForm = {};
          data.data.forEach((config: Configuracao) => {
            if (config.chave === 'envia_somente_dias_uteis') {
              newConfiguracoes[config.chave] = config.valor === 'true';
            } else {
              newConfiguracoes[config.chave] = config.valor;
            }
          });
          setConfiguracoes(newConfiguracoes);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const saveConfiguracao = async (chave: string, valor: string) => {
    try {
      // Primeiro, tentar buscar a configuração existente
      const getResponse = await fetch(`/api/configuracoes/chave/${chave}`);
      
      if (getResponse.ok) {
        // Configuração existe, fazer update
        const existingConfig = await getResponse.json();
        const updateResponse = await fetch(`/api/configuracoes/${existingConfig.data.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ valor }),
        });
        
        if (!updateResponse.ok) {
          throw new Error('Erro ao atualizar configuração');
        }
      } else if (getResponse.status === 404) {
        // Configuração não existe, criar nova
        const createResponse = await fetch('/api/configuracoes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ chave, valor }),
        });
        
        if (!createResponse.ok) {
          throw new Error('Erro ao criar configuração');
        }
      } else {
        throw new Error('Erro ao verificar configuração');
      }
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      throw error;
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const savePromises = Object.keys(configuracoes).map(chave => {
        const valor = configuracoes[chave];
        return saveConfiguracao(chave, typeof valor === 'boolean' ? valor.toString() : valor as string);
      });
      await Promise.all(savePromises);
      
      // Atualizar limite diário se a quantidade foi alterada
      if (configuracoes.quantidade_diaria_maxima) {
        try {
          const response = await fetch('/api/controle-envios/limite-diario', {
             method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              limite: parseInt(configuracoes.quantidade_diaria_maxima as string) 
            }),
          });
          
          if (!response.ok) {
            console.warn('Erro ao atualizar limite diário:', response.statusText);
          }
        } catch (error) {
          console.warn('Erro ao chamar endpoint de limite diário:', error);
        }
      }
      
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setConfiguracoes(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Configurações do Sistema</h2>
          <p className="text-gray-600 mt-1">Gerencie as configurações gerais do sistema</p>
        </div>

        <div className="p-6 space-y-6">
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
                placeholder="HH:MM"
                value={configuracoes.horario_inicio as string || ''}
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
                placeholder="HH:MM"
                value={configuracoes.horario_fim as string || ''}
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
              value={configuracoes.quantidade_diaria_maxima as string || ''}
              onChange={(e) => handleInputChange('quantidade_diaria_maxima', e.target.value)}
              className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              placeholder="Ex: 30"
            />

          </div>

          {/* Envio Apenas em Dias Úteis */}
          <div>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={configuracoes.envia_somente_dias_uteis as boolean || false}
                onChange={(e) => handleInputChange('envia_somente_dias_uteis', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
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
              disabled={loading || saving}
              className="px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {saving && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              <span>{saving ? 'Salvando...' : 'Salvar Configurações'}</span>
            </button>
          </div>
        </div>
      </div>


    </div>
  );
};

export default ConfiguracoesManager;