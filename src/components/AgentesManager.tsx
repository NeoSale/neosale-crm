'use client';

import React, { useState, useEffect } from 'react';
import { Users, Database, Plus, Search, RefreshCw, AlertCircle, Edit, Trash2, Bot } from 'lucide-react';
import { DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

import { Agente, agentesApi } from '../services/agentesApi';
import { TipoAgente, tipoAgentesApi } from '../services/tipoAgentesApi';
import Modal from './Modal';

const AgentesManager: React.FC = () => {
  const [agentes, setAgentes] = useState<Agente[]>([]);
  const [tipoAgentes, setTipoAgentes] = useState<TipoAgente[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [editingAgente, setEditingAgente] = useState<Agente | null>(null);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [isCreatingAgente, setIsCreatingAgente] = useState<boolean>(false);
  const [deletingAgente, setDeletingAgente] = useState<Agente | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [selectedAgentes, setSelectedAgentes] = useState<Set<string>>(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState<boolean>(false);
  const [showInstanceModal, setShowInstanceModal] = useState<boolean>(false);
  const [selectedAgenteForInstances, setSelectedAgenteForInstances] = useState<Agente | null>(null);

  const [isClient, setIsClient] = useState(false);

  // Verificar se estamos no lado do cliente
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Carregar dados iniciais
  useEffect(() => {
    if (isClient) {
      loadData();
    }
  }, [isClient]);

  // Fechar modais com ESC
  useEffect(() => {
    if (!isClient) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showEditModal) {
          setShowEditModal(false);
          setEditingAgente(null);
          setIsCreatingAgente(false);
        }
        if (showDeleteModal) {
          setShowDeleteModal(false);
          setDeletingAgente(null);
        }
        if (showBulkDeleteModal) {
          setShowBulkDeleteModal(false);
        }
        if (showInstanceModal) {
          handleCloseInstanceModal();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isClient, showEditModal, showDeleteModal, showBulkDeleteModal, showInstanceModal]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [agentesResponse, tipoAgentesResponse] = await Promise.all([
        agentesApi.getAgentes(),
        tipoAgentesApi.getTipoAgentes()
      ]);

      if (agentesResponse.success) {
        setAgentes(agentesResponse.data || []);
      } else {
        throw new Error(agentesResponse.message || 'Erro ao carregar agentes');
      }

      if (tipoAgentesResponse.success) {
        setTipoAgentes(tipoAgentesResponse.data || []);
      } else {
        throw new Error(tipoAgentesResponse.message || 'Erro ao carregar tipos de agentes');
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await loadData();
  };

  const handleCreateAgente = () => {
    const newAgente: Agente = {
      nome: '',
      tipo_agente_id: '',
      prompt: '',
      agendamento: false,
      prompt_agendamento: '',
      ativo: true
    };
    setEditingAgente(newAgente);
    setIsCreatingAgente(true);
    setShowEditModal(true);
  };

  const handleEditAgente = (agente: Agente) => {
    setEditingAgente(agente);
    setIsCreatingAgente(false);
    setShowEditModal(true);
  };

  const handleUpdateAgente = async (updatedData: Partial<Agente>) => {
    try {
      let success;

      if (isCreatingAgente) {
        // Criar novo agente
        const response = await agentesApi.createAgente(updatedData as Omit<Agente, 'id'>);
        success = response.success;
      } else {
        // Atualizar agente existente
        if (!editingAgente?.id) return;
        const response = await agentesApi.updateAgente(editingAgente.id, updatedData);
        success = response.success;
      }

      if (success) {
        setShowEditModal(false);
        setEditingAgente(null);
        setIsCreatingAgente(false);
        await loadData();
      }
    } catch (error) {
      console.error('Erro ao salvar agente:', error);
    }
  };

  const handleDeleteAgente = (agente: Agente) => {
    setDeletingAgente(agente);
    setShowDeleteModal(true);
  };

  const confirmDeleteAgente = async () => {
    if (!deletingAgente?.id) return;

    try {
      const response = await agentesApi.deleteAgente(deletingAgente.id);
      if (response.success) {
        setShowDeleteModal(false);
        setDeletingAgente(null);
        await loadData();
      }
    } catch (error) {
      console.error('Erro ao excluir agente:', error);
    }
  };

  const handleToggleAtivo = async (agente: Agente) => {
    if (!agente.id) return;

    try {
      const response = await agentesApi.toggleAgenteAtivo(agente.id, !agente.ativo);
      if (response.success) {
        await loadData();
      }
    } catch (error) {
      console.error('Erro ao alterar status do agente:', error);
    }
  };

  const handleToggleAgendamento = async (agente: Agente) => {
    if (!agente.id) return;

    try {
      const response = await agentesApi.toggleAgenteAgendamento(agente.id, !agente.agendamento);
      if (response.success) {
        await loadData();
      }
    } catch (error) {
      console.error('Erro ao alterar agendamento do agente:', error);
    }
  };

  // Funções para seleção múltipla
  const handleSelectAgente = (agenteId: string) => {
    const newSelected = new Set(selectedAgentes);
    if (newSelected.has(agenteId)) {
      newSelected.delete(agenteId);
    } else {
      newSelected.add(agenteId);
    }
    setSelectedAgentes(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedAgentes.size === paginatedAgentes.length) {
      setSelectedAgentes(new Set());
    } else {
      const allIds = new Set(paginatedAgentes.map(agente => agente.id || '').filter(id => id));
      setSelectedAgentes(allIds);
    }
  };

  const handleBulkDelete = () => {
    if (selectedAgentes.size > 0) {
      setShowBulkDeleteModal(true);
    }
  };

  const confirmBulkDelete = async () => {
    try {
      const deletePromises = Array.from(selectedAgentes).map(agenteId => 
        agentesApi.deleteAgente(agenteId)
      );
      const results = await Promise.all(deletePromises);

      const successCount = results.filter(result => result.success).length;
      const failCount = results.length - successCount;

      if (successCount > 0) {
        await loadData();
        setSelectedAgentes(new Set());

        if (failCount > 0) {
          toast.error(`${successCount} agentes excluídos com sucesso. ${failCount} falharam.`);
        } else {
          toast.success(`${successCount} agentes excluídos com sucesso.`, {
            style: {
              background: '#10B981',
              color: '#fff',
              fontWeight: '500',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#10B981',
            },
          });
        }
      }

      setShowBulkDeleteModal(false);
    } catch (error) {
      console.error('Erro ao excluir agentes:', error);
    }
  };

  // Limpar seleção quando mudar de página ou filtro
  useEffect(() => {
    setSelectedAgentes(new Set());
  }, [currentPage, searchTerm, itemsPerPage]);

  // Filtrar agentes baseado no termo de busca
  const filteredAgentes = Array.isArray(agentes) ? agentes.filter(agente => {
    if (!searchTerm) return true;

    const tipoAgenteNome = tipoAgentes.find(tipo => tipo.id === agente.tipo_agente_id)?.nome || '';
    
    return (
      agente.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tipoAgenteNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agente.prompt?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }) : [];

  // Paginação
  const totalItems = filteredAgentes.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAgentes = filteredAgentes.slice(startIndex, endIndex);

  // Resetar página quando filtro mudar
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const getTipoAgenteNome = (tipoAgenteId: string) => {
    const tipo = tipoAgentes.find(t => t.id === tipoAgenteId);
    return tipo?.nome || 'Tipo não encontrado';
  };

  const handleOpenInstanceModal = (agente: Agente) => {
    setSelectedAgenteForInstances(agente);
    setShowInstanceModal(true);
  };

  const handleCloseInstanceModal = () => {
    setShowInstanceModal(false);
    setSelectedAgenteForInstances(null);
  };

  if (loading && (!Array.isArray(agentes) || agentes.length === 0)) {
    return (
      <div className="w-full max-w-6xl mx-auto space-y-4">
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Carregando agentes...
          </h3>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
      {/* Seção de Agentes */}
      <div className="mt-6 bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-primary text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bot size={24} className="text-white" />
              <div>
                <h2 className="text-lg font-bold text-white !text-white">Agentes IA</h2>
                <p className="text-sm text-white/80">
                  {totalItems} agente{totalItems !== 1 ? 's' : ''} encontrado{totalItems !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium flex items-center gap-1.5 text-white"
              >
                <RefreshCw size={14} className={`text-white ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
              <button
                onClick={handleCreateAgente}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium flex items-center gap-1.5 text-white"
              >
                <Plus size={14} className="text-white" />
                Novo Agente
              </button>
            </div>
          </div>
        </div>

        {/* Barra de Busca */}
        <div className="p-3 bg-gray-50 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Buscar agentes por nome, tipo, prompt..."
              className="w-full pl-10 pr-4 py-2 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Filtros e Ações */}
        {selectedAgentes.size > 0 && (
          <div className="p-3 bg-yellow-50 border-b">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {selectedAgentes.size} agente{selectedAgentes.size !== 1 ? 's' : ''} selecionado{selectedAgentes.size !== 1 ? 's' : ''}
              </span>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-1.5"
              >
                <Trash2 size={14} />
                Excluir Selecionados
              </button>
            </div>
          </div>
        )}

        {/* Verificação se há agentes */}
        {paginatedAgentes.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Database className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'Nenhum agente encontrado' : 'Nenhum agente cadastrado'}
            </h3>
            <p className="text-gray-500 text-center mb-6 max-w-md">
              {searchTerm 
                ? 'Não encontramos agentes que correspondam aos seus critérios de busca. Tente ajustar os filtros ou termos de pesquisa.'
                : 'Você ainda não possui agentes cadastrados. Crie seu primeiro agente para começar a automatizar suas conversas.'
              }
            </p>
            <div className="flex gap-3">
              {searchTerm ? (
                <button
                  onClick={() => setSearchTerm('')}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Limpar Filtro
                </button>
              ) : (
                <button
                  onClick={handleCreateAgente}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Plus size={16} />
                  Criar Primeiro Agente
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Tabela */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                      <input
                        type="checkbox"
                        checked={paginatedAgentes.length > 0 && selectedAgentes.size === paginatedAgentes.length}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nome
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prompt
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      WhatsApp
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Agendamento
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ATIVO
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedAgentes.map((agente) => (
                <tr key={agente.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selectedAgentes.has(agente.id || '')}
                      onChange={() => handleSelectAgente(agente.id || '')}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <div className="text-sm font-medium text-gray-900">{agente.nome}</div>
                  </td>
                  <td className="px-3 py-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {getTipoAgenteNome(agente.tipo_agente_id)}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="max-w-xs">
                      {agente.prompt ? (
                        <div 
                          className="text-sm text-gray-900 truncate"
                          title={agente.prompt}
                        >
                          {agente.prompt.length > 50 ? `${agente.prompt.substring(0, 50)}...` : agente.prompt}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    {agente.instancias_evolution_api && agente.instancias_evolution_api.length > 0 ? (
                      <div className="flex items-center gap-2">
                         <div className="flex items-center">
                           {agente.instancias_evolution_api.slice(0, 4).map((instancia, index) => (
                             <span
                                key={index}
                                className={`w-2 h-2 rounded-full ${
                                  instancia.status?.toLowerCase() === 'open'
                                    ? 'bg-green-500'
                                    : instancia.status?.toLowerCase() === 'close'
                                    ? 'bg-red-500'
                                    : 'bg-gray-400'
                                }`}
                              ></span>
                           ))}
                           {agente.instancias_evolution_api.length > 4 && (
                              <span className="text-xs text-gray-400 ml-1">+{agente.instancias_evolution_api.length - 4}</span>
                            )}
                         </div>
                        <button
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors cursor-pointer"
                          onClick={() => handleOpenInstanceModal(agente)}
                        >
                          {agente.instancias_evolution_api.length} instância{agente.instancias_evolution_api.length > 1 ? 's' : ''}
                        </button>
                      </div>
                    ) : (
                      <span className="inline-flex items-center text-xs text-gray-500">
                        <span className="w-2 h-2 bg-gray-300 rounded-full mr-2"></span>
                        Nenhuma instância
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <button
                      onClick={() => handleToggleAgendamento(agente)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                        agente.agendamento ? 'bg-[#403CCF]' : 'bg-gray-300'
                      }`}
                      title={`${agente.agendamento ? 'Desativar' : 'Ativar'} agendamento`}
                    >
                      <span
                        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                          agente.agendamento ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleAtivo(agente)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                        agente.ativo ? 'bg-primary' : 'bg-gray-300'
                      }`}
                      title={`${agente.ativo ? 'Inativar' : 'Ativar'} agente`}
                    >
                      <span
                        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                          agente.ativo ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditAgente(agente)}
                        className="p-1 text-primary hover:text-primary/70 hover:bg-primary/10 rounded transition-colors cursor-pointer"
                        title="Editar agente"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteAgente(agente)}
                        className="p-1 text-primary hover:text-primary/70 hover:bg-primary/10 rounded transition-colors cursor-pointer"
                        title="Excluir agente"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Controles de Paginação */}
        {totalItems > 0 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6 text-gray-700">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-700">
                  Mostrando <span className="font-medium">{startIndex + 1}</span> a{' '}
                  <span className="font-medium">{Math.min(endIndex, totalItems)}</span> de{' '}
                  <span className="font-medium">{totalItems}</span> resultados
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-700">Itens por página:</label>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                    className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>
              
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className="px-2 py-1 text-sm font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ««
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-2 py-1 text-sm font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ‹
                  </button>
                  
                  {/* Páginas visíveis */}
                  {(() => {
                    const maxVisiblePages = 5;
                    const halfVisible = Math.floor(maxVisiblePages / 2);
                    let startPage = Math.max(1, currentPage - halfVisible);
                    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                    
                    if (endPage - startPage + 1 < maxVisiblePages) {
                      startPage = Math.max(1, endPage - maxVisiblePages + 1);
                    }
                    
                    const pages = [];
                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(i);
                    }
                    
                    return pages.map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-1 text-sm font-medium rounded-md ${
                          currentPage === page
                            ? 'bg-primary text-white'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ));
                  })()}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-2 py-1 text-sm font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ›
                  </button>
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-2 py-1 text-sm font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    »»
                  </button>
                </div>
              )}
            </div>
          </div>
        )}      </>        )}      </div>

      {/* Modal de Edição/Criação */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingAgente(null);
          setIsCreatingAgente(false);
        }}
        title={isCreatingAgente ? 'Novo Agente' : 'Editar Agente'}
        size="2xl"
      >
        <div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (editingAgente) {
                    handleUpdateAgente(editingAgente);
                  }
                }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome *
                    </label>
                    <input
                      type="text"
                      value={editingAgente?.nome || ''}
                      onChange={(e) => setEditingAgente(prev => prev ? { ...prev, nome: e.target.value } : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Agente *
                    </label>
                    <select
                      value={editingAgente?.tipo_agente_id || ''}
                      onChange={(e) => setEditingAgente(prev => prev ? { ...prev, tipo_agente_id: e.target.value } : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      required
                    >
                      <option value="">Selecione um tipo</option>
                      {tipoAgentes
                        .filter(tipo => tipo.ativo)
                        .sort((a, b) => b.nome.localeCompare(a.nome))
                        .map((tipo) => (
                        <option key={tipo.id} value={tipo.id}>
                          {tipo.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prompt Principal
                  </label>
                  <textarea
                    value={editingAgente?.prompt || ''}
                    onChange={(e) => setEditingAgente(prev => prev ? { ...prev, prompt: e.target.value } : null)}
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Digite o prompt principal do agente..."
                  />
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editingAgente?.agendamento || false}
                      onChange={(e) => setEditingAgente(prev => prev ? { ...prev, agendamento: e.target.checked } : null)}
                      className="rounded border-gray-300 text-primary focus:ring-primary mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Habilitar Agendamento</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editingAgente?.ativo !== false}
                      onChange={(e) => setEditingAgente(prev => prev ? { ...prev, ativo: e.target.checked } : null)}
                      className="rounded border-gray-300 text-primary focus:ring-primary mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Agente Ativo</span>
                  </label>
                </div>

                {editingAgente?.agendamento && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prompt de Agendamento
                    </label>
                    <textarea
                      value={editingAgente?.prompt_agendamento || ''}
                      onChange={(e) => setEditingAgente(prev => prev ? { ...prev, prompt_agendamento: e.target.value } : null)}
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Digite o prompt específico para agendamento..."
                    />
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingAgente(null);
                      setIsCreatingAgente(false);
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors"
                  >
                    {isCreatingAgente ? 'Criar Agente' : 'Salvar Alterações'}
                  </button>
                </div>
              </form>
        </div>
      </Modal>

      {/* Modal de Confirmação de Exclusão */}
      <Modal
        isOpen={showDeleteModal && !!deletingAgente}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingAgente(null);
        }}
        title="Confirmar Exclusão"
        size="md"
      >
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">
                Tem certeza que deseja excluir o agente "{deletingAgente?.nome}"?
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setDeletingAgente(null);
              }}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={confirmDeleteAgente}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Excluir
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de Exclusão em Massa */}
      <Modal
        isOpen={showBulkDeleteModal}
        onClose={() => setShowBulkDeleteModal(false)}
        title="Confirmar Exclusão em Massa"
        size="md"
      >
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">
                Tem certeza que deseja excluir {selectedAgentes.size} agente{selectedAgentes.size !== 1 ? 's' : ''} selecionado{selectedAgentes.size !== 1 ? 's' : ''}?
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowBulkDeleteModal(false)}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={confirmBulkDelete}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Excluir Todos
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de Detalhes das Instâncias */}
      <Modal
        isOpen={showInstanceModal && !!selectedAgenteForInstances}
        onClose={handleCloseInstanceModal}
        title={`Instâncias WhatsApp - ${selectedAgenteForInstances?.nome}`}
        size="2xl"
      >
        <div>
          {selectedAgenteForInstances?.instancias_evolution_api && selectedAgenteForInstances.instancias_evolution_api.length > 0 ? (
            <div className="space-y-4">
              <div className="text-sm text-gray-600 mb-4">
                Total de {selectedAgenteForInstances.instancias_evolution_api.length} instância{selectedAgenteForInstances.instancias_evolution_api.length > 1 ? 's' : ''} encontrada{selectedAgenteForInstances.instancias_evolution_api.length > 1 ? 's' : ''}
              </div>
              <div className="grid gap-4">
                 {selectedAgenteForInstances.instancias_evolution_api.map((instancia, index) => {
                    const isOpen = instancia.status?.toLowerCase() === 'open';
                    const isClose = instancia.status?.toLowerCase() === 'close';
                    
                    // Função para formatar telefone
                    const formatPhone = (phone: string) => {
                      if (!phone || phone === 'Não conectado') return 'Não conectado';
                      const cleaned = phone.replace(/\D/g, '');
                      if (cleaned.length === 13 && cleaned.startsWith('55')) {
                        const countryCode = cleaned.slice(0, 2);
                        const areaCode = cleaned.slice(2, 4);
                        const firstPart = cleaned.slice(4, 9);
                        const secondPart = cleaned.slice(9, 13);
                        return `+${countryCode} (${areaCode}) ${firstPart}-${secondPart}`;
                      }
                      if (cleaned.length === 12 && cleaned.startsWith('55')) {
                        const countryCode = cleaned.slice(0, 2);
                        const areaCode = cleaned.slice(2, 4);
                        const firstPart = cleaned.slice(4, 8);
                        const secondPart = cleaned.slice(8, 12);
                        return `+${countryCode} (${areaCode}) ${firstPart}-${secondPart}`;
                      }
                      if (cleaned.length === 11) {
                        const areaCode = cleaned.slice(0, 2);
                        const firstPart = cleaned.slice(2, 7);
                        const secondPart = cleaned.slice(7, 11);
                        return `+55 (${areaCode}) ${firstPart}-${secondPart}`;
                      }
                      if (cleaned.length === 10) {
                        const areaCode = cleaned.slice(0, 2);
                        const firstPart = cleaned.slice(2, 6);
                        const secondPart = cleaned.slice(6, 10);
                        return `+55 (${areaCode}) ${firstPart}-${secondPart}`;
                      }
                      return phone;
                    };
                    
                    // Função para copiar telefone para área de transferência
                    const copyPhoneToClipboard = async (phone: string) => {
                      if (!phone || phone === 'Não conectado') {
                        toast.error('Número não disponível para cópia');
                        return;
                      }

                      // Remove todos os caracteres não numéricos para copiar apenas os números
                      const cleanPhone = phone.replace(/\D/g, '');

                      try {
                        await navigator.clipboard.writeText(cleanPhone);
                        toast.success('Número copiado para a área de transferência!');
                      } catch (error) {
                        console.error('Erro ao copiar número:', error);
                        toast.error('Erro ao copiar número');
                      }
                    };
                    
                    return (
                     <div key={index} className={`border rounded-lg p-4 transition-colors ${
                       isOpen 
                         ? 'border-green-200 bg-green-50 hover:bg-green-100'
                         : isClose
                         ? 'border-red-200 bg-red-50 hover:bg-red-100'
                         : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                     }`}>
                      <div className="flex items-start gap-4">
                        {/* Foto do perfil */}
                        <div className="flex-shrink-0">
                          {instancia.profilePictureUrl ? (
                            <img
                              src={instancia.profilePictureUrl}
                              alt={instancia.profileName || instancia.instanceName}
                              className="w-12 h-12 rounded-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div className={`w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center ${instancia.profilePictureUrl ? 'hidden' : ''}`}>
                            <span className="text-gray-500 text-sm font-medium">
                              {(instancia.profileName || instancia.instanceName)?.charAt(0)?.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        
                        {/* Informações principais */}
                        <div className="flex-1 min-w-0">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Coluna esquerda */}
                            <div className="space-y-3">
                              {/* Nome do perfil */}
                              <div>
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Perfil WhatsApp</label>
                                <div className="flex items-center gap-2 mt-1">
                                  <div className="text-sm font-medium text-gray-900">
                                    {instancia.profileName || 'Não conectado'}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Nome da instância */}
                              <div>
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Instância</label>
                                <div className="text-sm font-medium text-gray-900 mt-1">
                                  {instancia.instanceName}
                                </div>
                              </div>
                            </div>
                            
                            {/* Coluna direita */}
                            <div className="space-y-3">
                              {/* Status */}
                              <div>
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Status</label>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`w-2 h-2 rounded-full ${
                                    instancia.status?.toLowerCase() === 'open'
                                      ? 'bg-green-500'
                                      : instancia.status?.toLowerCase() === 'close'
                                      ? 'bg-red-500'
                                      : 'bg-gray-400'
                                  }`}></span>
                                  <span className="text-sm font-medium text-gray-900">
                                    {instancia.status?.toLowerCase() === 'open' ? 'Conectado' : 
                                     instancia.status?.toLowerCase() === 'close' ? 'Desconectado' : 
                                     instancia.status || 'Desconhecido'}
                                  </span>
                                </div>
                              </div>

                              {/* Telefone */}
                              <div>
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Telefone</label>
                                <div className="flex items-center gap-2 mt-1">
                                  <div className="text-sm font-medium text-gray-900">
                                    {formatPhone(instancia.owner || '')}
                                  </div>
                                  {instancia.owner && instancia.owner !== 'Não conectado' && (
                                     <button
                                       onClick={() => copyPhoneToClipboard(instancia.owner || '')}
                                       className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                       title="Copiar número"
                                     >
                                       <DocumentDuplicateIcon className="h-4 w-4" />
                                     </button>
                                   )}
                                </div>
                              </div>
                              
                              {/* ID do Agente */}
                              {instancia.id_agente && (
                                <div>
                                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">ID Agente</label>
                                  <div className="text-sm font-medium text-gray-900 mt-1">
                                    {instancia.id_agente}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                     </div>
                   );
                 })}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="w-2 h-2 bg-gray-300 rounded-full"></span>
              </div>
              <p className="text-gray-500">Nenhuma instância encontrada para este agente.</p>
            </div>
          )}
          <div className="flex justify-end pt-4 border-t border-gray-200 mt-6">
            <button
              onClick={handleCloseInstanceModal}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AgentesManager;