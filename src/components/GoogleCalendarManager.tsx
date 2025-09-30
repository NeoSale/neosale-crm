'use client';

import React, { useState, useEffect } from 'react';
import {
  CalendarIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowPathIcon,
  ClipboardIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { Search } from 'lucide-react';
import Modal from './Modal';
import ConfirmModal from './ConfirmModal';
import { googleCalendarApi, GoogleCalendarIntegracao, CreateGoogleCalendarIntegracao } from '../services/googleCalendarApi';
import { parametrosApi } from '../services/parametrosApi';
import toast from 'react-hot-toast';

interface GoogleCalendarManagerProps {
  cliente_id?: string;
}

export default function GoogleCalendarManager({ cliente_id }: GoogleCalendarManagerProps) {
  const [integracoes, setConfiguracoes] = useState<GoogleCalendarIntegracao[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingConfiguracoes, setLoadingConfiguracoes] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [editingIntegracao, setEditingIntegracao] = useState<GoogleCalendarIntegracao | null>(null);
  const [integracaoToDelete, setIntegracaoToDelete] = useState<GoogleCalendarIntegracao | null>(null);
  const [showClientSecret, setShowClientSecret] = useState<{ [key: string]: boolean }>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [copiedRedirectUri, setCopiedRedirectUri] = useState(false);
  const [isCredentialsGuideOpen, setIsCredentialsGuideOpen] = useState(false);
  const [copiedFields, setCopiedFields] = useState<{ [key: string]: boolean }>({});

  const [defaultRedirectUri, setDefaultRedirectUri] = useState<string>('');
  const [formData, setFormData] = useState<CreateGoogleCalendarIntegracao>({
    nome: '',
    client_id: '',
    client_secret: '',
    redirect_uri: '',
    ativo: true,
  });

  // Função para buscar parâmetro usando o serviço parametrosApi
  const fetchParametro = async (chave: string): Promise<string | null> => {
    try {
      const response = await parametrosApi.getParametroByChave(chave, { showError: false });

      if (response.success && response.data?.valor) {
        // Remove espaços em branco e aspas extras do valor
        return response.data.valor.trim().replace(/^["']|["']$/g, '');
      }

      return null;
    } catch (error) {
      console.error(`Erro ao buscar parâmetro ${chave}:`, error);
      return null;
    }
  };

  // Carregar integrações
  const loadConfiguracoes = async (showLoadingState = true) => {
    if (showLoadingState) {
      setLoading(true);
    } else {
      setLoadingConfiguracoes(true);
    }
    try {
      const response = await googleCalendarApi.listarConfiguracoes(cliente_id);
      if (response.success) {
        setConfiguracoes(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar integrações:', error);
    } finally {
      if (showLoadingState) {
        setLoading(false);
      } else {
        setLoadingConfiguracoes(false);
      }
    }
  };

  // Função para carregar o Redirect URI do parâmetro
  const loadRedirectUri = async () => {
    try {
      const redirectUri = await fetchParametro('url_api_google_calendar_auth_callback');
      if (redirectUri) {
        setDefaultRedirectUri(redirectUri);
      }
    } catch (error) {
      console.error('Erro ao carregar Redirect URI:', error);
    }
  };

  // Função para copiar o Redirect URI
  const copyRedirectUri = async () => {
    if (!formData.redirect_uri) {
      console.log('Redirect URI está vazio');
      return;
    }

    try {
      await navigator.clipboard.writeText(formData.redirect_uri);
      console.log('Copiado com sucesso via clipboard API');
      setCopiedRedirectUri(true);
      setTimeout(() => setCopiedRedirectUri(false), 2000);
      toast.success('Redirect URI copiada!');
    } catch (error) {
      console.error('Erro ao copiar Redirect URI:', error);
      // Fallback para navegadores mais antigos
      const textArea = document.createElement('textarea');
      textArea.value = formData.redirect_uri;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        console.log('Copiado com sucesso via fallback');
        setCopiedRedirectUri(true);
        setTimeout(() => setCopiedRedirectUri(false), 2000);
        toast.success('Redirect URI copiada!');
      } catch (fallbackError) {
        console.error('Erro no fallback de cópia:', fallbackError);
      }
      document.body.removeChild(textArea);
    }
  };

  // Função genérica para copiar texto dos campos da tabela
  const copyToClipboard = async (text: string, fieldKey: string, fieldName: string) => {
    if (!text) {
      console.log(`${fieldName} está vazio`);
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      console.log(`${fieldName} copiado com sucesso via clipboard API`);
      setCopiedFields(prev => ({ ...prev, [fieldKey]: true }));
      setTimeout(() => setCopiedFields(prev => ({ ...prev, [fieldKey]: false })), 2000);
      toast.success(`${fieldName} copiado!`);
    } catch (error) {
      console.error(`Erro ao copiar ${fieldName}:`, error);
      // Fallback para navegadores mais antigos
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        console.log(`${fieldName} copiado com sucesso via fallback`);
        setCopiedFields(prev => ({ ...prev, [fieldKey]: true }));
        setTimeout(() => setCopiedFields(prev => ({ ...prev, [fieldKey]: false })), 2000);
        toast.success(`${fieldName} copiado!`);
      } catch (fallbackError) {
        console.error(`Erro no fallback de cópia do ${fieldName}:`, fallbackError);
      }
      document.body.removeChild(textArea);
    }
  };



  useEffect(() => {

    if (cliente_id) {
      // Carregar o Redirect URI ao montar o componente
      loadRedirectUri();
      // Só carrega as integrações se o cliente_id estiver disponível
      loadConfiguracoes();
    }
  }, [cliente_id]); // Mantendo cliente_id como dependência, mas com verificação

  // Resetar formulário
  const resetForm = () => {
    setFormData({
      nome: '',
      client_id: '',
      client_secret: '',
      redirect_uri: defaultRedirectUri, // Preservar o Redirect URI padrão
      ativo: true,
    });
    setEditingIntegracao(null);
    setCopiedRedirectUri(false);
  };

  // Abrir modal para criar nova integração
  const handleCreate = async () => {
    resetForm();
    setShowModal(true);
  };

  // Abrir modal para editar integração
  const handleEdit = async (integracao: GoogleCalendarIntegracao) => {
    setFormData({
      nome: integracao.nome,
      client_id: integracao.client_id,
      client_secret: integracao.client_secret,
      redirect_uri: integracao.redirect_uri,
      ativo: integracao.ativo,
    });
    setEditingIntegracao(integracao);
    setShowModal(true);
  };

  // Salvar integração (criar ou atualizar)
  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingIntegracao) {
        await googleCalendarApi.atualizarIntegracao(editingIntegracao.id!, formData, cliente_id);
      } else {
        await googleCalendarApi.criarIntegracao(formData, cliente_id);
      }

      setShowModal(false);
      resetForm();
      loadConfiguracoes(false);
    } catch (error) {
      console.error('Erro ao salvar integração:', error);
    } finally {
      setSaving(false);
    }
  };

  // Confirmar exclusão
  const handleDeleteConfirm = (integracao: GoogleCalendarIntegracao) => {
    setIntegracaoToDelete(integracao);
    setShowConfirmModal(true);
  };

  // Executar exclusão
  const handleDelete = async () => {
    if (integracaoToDelete) {
      setDeleting(true);
      try {
        await googleCalendarApi.deletarIntegracao(integracaoToDelete.id!, cliente_id);
        setShowConfirmModal(false);
        setIntegracaoToDelete(null);
        loadConfiguracoes(false);
      } catch (error) {
        console.error('Erro ao deletar integração:', error);
      } finally {
        setDeleting(false);
      }
    }
  };

  // Toggle visibilidade do client_secret
  const toggleClientSecretVisibility = (id: string) => {
    setShowClientSecret(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Alternar status ativo/inativo da integração
  const toggleAtivo = async (configuracao: GoogleCalendarIntegracao) => {
    try {
      const updatedData: CreateGoogleCalendarIntegracao = {
        nome: configuracao.nome,
        client_id: configuracao.client_id,
        client_secret: configuracao.client_secret,
        redirect_uri: configuracao.redirect_uri,
        ativo: !configuracao.ativo
      };

      await googleCalendarApi.atualizarIntegracao(configuracao.id!, updatedData, cliente_id);
      loadConfiguracoes(false);
      
      toast.success(`Integração ${!configuracao.ativo ? 'ativada' : 'desativada'} com sucesso!`);
    } catch (error) {
      console.error('Erro ao alterar status da integração:', error);
      toast.error('Erro ao alterar status da integração');
    }
  };

  // Mascarar client_secret
  const maskClientSecret = (secret: string) => {
    if (secret.length <= 8) return '*'.repeat(secret.length);
    return secret.substring(0, 4) + '*'.repeat(secret.length - 30) + secret.substring(secret.length - 4);
  };

  // Filtrar integrações baseado no termo de busca
  const filteredConfiguracoes = integracoes.filter(config => {
    if (!searchTerm) return true;
    return config.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      config.client_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      config.redirect_uri?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Cálculos de paginação
  const totalPages = Math.ceil(filteredConfiguracoes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentConfiguracoes = filteredConfiguracoes.slice(startIndex, endIndex);

  if (loading && integracoes.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-primary text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CalendarIcon className="h-8 w-8 text-white" />
              <div>
                <h2 className="text-lg font-bold text-white !text-white">Integrações Google Calendar</h2>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => loadConfiguracoes(false)}
                disabled={loading || loadingConfiguracoes}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium flex items-center gap-1.5 text-white"
              >
                <ArrowPathIcon className={`h-4 w-4 ${(loading || loadingConfiguracoes) ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
              <button
                onClick={handleCreate}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium flex items-center gap-1.5 text-white"
              >
                <PlusIcon className="h-4 w-4" />
                Nova Integração
              </button>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        {integracoes.length > 0 && (
          <div className="p-6 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {integracoes.length}
                </div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {integracoes.filter(c => c.ativo).length}
                </div>
                <div className="text-sm text-gray-600">Ativas</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {integracoes.filter(c => !c.ativo).length}
                </div>
                <div className="text-sm text-gray-600">Inativas</div>
              </div>
            </div>
          </div>
        )}

        {/* Barra de Busca */}
        <div className="p-3 bg-gray-50 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" width={16} height={16} />
            <input
              type="text"
              placeholder="Buscar integrações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        {/* Tabela de Integrações */}
        <div className="overflow-x-auto relative">
          {loadingConfiguracoes && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span className="text-sm text-gray-600">Atualizando integrações...</span>
              </div>
            </div>
          )}
          {currentConfiguracoes.length === 0 ? (
            <div className="text-center py-12">
              <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {searchTerm ? 'Nenhuma integração encontrada' : 'Nenhuma integração cadastrada'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? 'Tente ajustar os filtros de busca.' : 'Comece criando sua primeira integração do Google Calendar.'}
              </p>
              {!searchTerm && (
                <div className="mt-6">
                  <button
                    onClick={handleCreate}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90"
                  >
                    <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                    Nova Integração
                  </button>
                </div>
              )}
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client Secret
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentConfiguracoes.map((integracao) => (
                  <tr key={integracao.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 truncate max-w-[12rem]" title={integracao.nome}>
                        {integracao.nome}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div 
                        className="text-sm font-medium text-gray-900 truncate max-w-[12rem] cursor-pointer hover:bg-gray-100 p-1 rounded transition-colors flex items-center gap-1" 
                        title={`${integracao.client_id} - Clique para copiar`}
                        onClick={() => copyToClipboard(integracao.client_id, `client_id_${integracao.id}`, 'Client ID')}
                      >
                        <span className="truncate">{integracao.client_id}</span>
                        {copiedFields[`client_id_${integracao.id}`] ? (
                          <svg className="h-3 w-3 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <ClipboardIcon className="h-3 w-3 text-gray-400 flex-shrink-0" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 max-w-xs">
                        <div 
                          className="text-sm font-medium text-gray-900 flex-1 cursor-pointer hover:bg-gray-100 p-1 rounded transition-colors flex items-center gap-1" 
                          title={`${showClientSecret[integracao.id!] ? integracao.client_secret : maskClientSecret(integracao.client_secret)} - Clique para copiar`}
                          onClick={() => copyToClipboard(integracao.client_secret, `client_secret_${integracao.id}`, 'Client Secret')}
                        >
                          <span className="truncate">
                            {showClientSecret[integracao.id!]
                              ? integracao.client_secret
                              : maskClientSecret(integracao.client_secret)
                            }
                          </span>
                          {copiedFields[`client_secret_${integracao.id}`] ? (
                            <svg className="h-3 w-3 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <ClipboardIcon className="h-3 w-3 text-gray-400 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-300 shadow-sm cursor-pointer ${
                          integracao.ativo ? 'bg-[#403CCF]' : 'bg-gray-300'
                        }`}
                        title={`Integração ${integracao.ativo ? 'ativa' : 'inativa'}`}
                        onClick={() => toggleAtivo(integracao)}
                      >
                        <span
                          className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-300 ${
                            integracao.ativo ? 'translate-x-5' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(integracao)}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                          title="Editar"
                        >
                          <PencilIcon className="h-4 w-4 mr-1" />
                        </button>
                        <button
                          onClick={() => handleDeleteConfirm(integracao)}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          title="Excluir"
                        >
                          <TrashIcon className="h-4 w-4 mr-1" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {filteredConfiguracoes.length > 0 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <p className="text-sm text-gray-700">
                  Mostrando <span className="font-medium">{startIndex + 1}</span> a{' '}
                  <span className="font-medium">{Math.min(endIndex, filteredConfiguracoes.length)}</span> de{' '}
                  <span className="font-medium">{filteredConfiguracoes.length}</span> resultados
                </p>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="ml-4 border border-gray-300 rounded-md text-sm"
                >
                  <option value={5}>5 por página</option>
                  <option value={10}>10 por página</option>
                  <option value={25}>25 por página</option>
                  <option value={50}>50 por página</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <span className="text-sm text-gray-700">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Próxima
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal para criar/editar integração */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingIntegracao ? 'Editar Integração' : 'Nova Integração'}
      >
        {/* Seção de Ajuda */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <button
                type="button"
                onClick={() => setIsCredentialsGuideOpen(!isCredentialsGuideOpen)}
                className="flex items-center justify-between w-full text-left text-sm font-medium text-blue-800 hover:text-blue-900 transition-colors"
              >
                <span>Como obter as credenciais do Google Calendar</span>
                <ChevronDownIcon
                  className={`h-4 w-4 transition-transform duration-200 ${isCredentialsGuideOpen ? 'rotate-180' : ''
                    }`}
                />
              </button>

              {isCredentialsGuideOpen && (
                <div className="mt-3 text-sm text-blue-700 space-y-2 animate-in slide-in-from-top-2 duration-200">
                  <p>Para configurar a integração com o Google Calendar, você precisa:</p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Acessar o <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-900">Google Cloud Console</a></li>
                    <li>Criar um novo projeto ou selecionar um existente</li>
                    <li>Ativar a API do Google Calendar</li>
                    <li>Ir em "Credenciais" e criar um "ID do cliente OAuth 2.0"</li>
                    <li>Configurar as origens autorizadas e URIs de redirecionamento abaixo</li>
                    <li>Copiar o Client ID e Client Secret gerados</li>
                  </ol>
                  <p className="mt-2">
                    <a
                      href="https://developers.google.com/workspace/calendar/api/guides/overview"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-blue-900 font-medium"
                    >
                      📖 Guia completo da documentação oficial
                    </a>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="redirect_uri" className="block text-sm font-medium text-gray-700">
              Redirect URI
              <span className="text-xs text-gray-500 ml-2">(Clique para copiar)</span>
            </label>
            <div className="relative">
              <input
                type="url"
                id="redirect_uri"
                value={formData.redirect_uri}
                onClick={copyRedirectUri}
                onMouseDown={(e) => e.preventDefault()}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-100 cursor-pointer select-none"
                placeholder="https://seu-dominio.com/callback"
                readOnly
                title="Clique para copiar a URL"
              />
              <button
                type="button"
                onClick={copyRedirectUri}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors"
                title={copiedRedirectUri ? "Copiado!" : "Copiar URL"}
              >
                {copiedRedirectUri ? (
                  <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <ClipboardIcon className="h-4 w-4" />
                )}
              </button>
            </div>
            {copiedRedirectUri && (
              <p className="mt-1 text-xs text-green-600">✓ URL copiada para a área de transferência!</p>
            )}
          </div>

          <div>
            <label htmlFor="nome" className="block text-sm font-medium text-gray-700">
              Nome *
            </label>
            <input
              type="text"
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Digite um nome para a integração"
              required
            />
          </div>

          <div>
            <label htmlFor="client_id" className="block text-sm font-medium text-gray-700">
              Client ID *
            </label>
            <input
              type="text"
              id="client_id"
              value={formData.client_id}
              onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Digite o Client ID do Google"
              required
            />
          </div>

          <div>
            <label htmlFor="client_secret" className="block text-sm font-medium text-gray-700">
              Client Secret *
            </label>
            <input
              type="password"
              id="client_secret"
              value={formData.client_secret}
              onChange={(e) => setFormData({ ...formData, client_secret: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Digite o Client Secret do Google"
              required
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="ativo"
              checked={formData.ativo}
              onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="ativo" className="ml-2 block text-sm text-gray-900">
              Integração ativa
            </label>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => {
              setShowModal(false);
              resetForm();
            }}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !formData.nome || !formData.client_id || !formData.client_secret || !formData.redirect_uri}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            {saving 
              ? (editingIntegracao ? 'Atualizando...' : 'Criando...') 
              : (editingIntegracao ? 'Atualizar' : 'Criar')
            }
          </button>
        </div>
      </Modal>

      {/* Modal de confirmação para exclusão */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setIntegracaoToDelete(null);
        }}
        onConfirm={handleDelete}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja excluir a integração do Google Calendar? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        type="danger"
        isLoading={deleting}
      />
    </div>
  );
}