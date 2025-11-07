'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Users, Database, Plus, Search, RefreshCw, AlertCircle, Edit, Trash2, Bot } from 'lucide-react';
import { ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

import { Agente, agentesApi } from '../services/agentesApi';
import { TipoAgente, tipoAgentesApi } from '../services/tipoAgentesApi';
import { Base, baseApi } from '../services/baseApi';
import Modal from './Modal';
import { Table, TableColumn, TableBadge, TableToggle, TableActionButton, TableText } from './Table';

const AgentesManager: React.FC = () => {
  const [agentes, setAgentes] = useState<Agente[]>([]);
  const [tipoAgentes, setTipoAgentes] = useState<TipoAgente[]>([]);
  const [bases, setBases] = useState<Base[]>([]);
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
  const [selectedBases, setSelectedBases] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Estados de loading específicos para cada ação
  const [refreshLoading, setRefreshLoading] = useState<boolean>(false);
  const [saveLoading, setSaveLoading] = useState<boolean>(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null); // ID do agente sendo excluído
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState<boolean>(false);
  const [toggleAtivoLoading, setToggleAtivoLoading] = useState<string | null>(null); // ID do agente sendo alterado
  const [toggleAgendamentoLoading, setToggleAgendamentoLoading] = useState<string | null>(null); // ID do agente sendo alterado

  const [isClient, setIsClient] = useState(false);

  // Verificar se estamos no lado do cliente
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

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
        if (isDropdownOpen) {
          setIsDropdownOpen(false);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isClient, showEditModal, showDeleteModal, showBulkDeleteModal, isDropdownOpen]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [agentesResponse, tipoAgentesResponse, basesResponse] = await Promise.all([
        agentesApi.getAgentes(),
        tipoAgentesApi.getTipoAgentes(),
        baseApi.getBases({ limit: 100 })
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

      if (basesResponse.success && basesResponse.data) {
        setBases(basesResponse.data.bases || []);
      } else {
        console.error('Erro ao carregar bases:', basesResponse.message);
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
    try {
      setRefreshLoading(true);
      await loadData();
      toast.success('Dados atualizados com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar dados');
    } finally {
      setRefreshLoading(false);
    }
  };

  const handleCreateAgente = () => {
    const newAgente: Agente = {
      nome: '',
      tipo_agente_id: '',
      prompt: '',
      agendamento: false,
      prompt_agendamento: '',
      ativo: true,
      base_id: []
    };
    setEditingAgente(newAgente);
    setSelectedBases([]);
    setIsCreatingAgente(true);
    setShowEditModal(true);
  };

  const handleEditAgente = (agente: Agente) => {
    setEditingAgente(agente);
    setSelectedBases(agente.base_id || []);
    setIsCreatingAgente(false);
    setShowEditModal(true);
  };

  const handleUpdateAgente = async (updatedData: Partial<Agente>) => {
    try {
      setSaveLoading(true);
      // Adicionar base_id aos dados
      const dataWithBases = {
        ...updatedData,
        base_id: selectedBases
      };

      let response;

      if (isCreatingAgente) {
        // Criar novo agente
        response = await agentesApi.createAgente(dataWithBases as Omit<Agente, 'id'>);
      } else {
        // Atualizar agente existente
        if (!editingAgente?.id) return;
        response = await agentesApi.updateAgente(editingAgente.id, dataWithBases);
      }

      if (response.success) {
        setShowEditModal(false);
        setEditingAgente(null);
        setSelectedBases([]);
        setIsCreatingAgente(false);
        await loadData();
      } else {
        toast.error(response.message || 'Erro ao salvar agente');
      }
    } catch (error) {
      console.error('Erro ao salvar agente:', error);
      toast.error('Erro ao salvar agente');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteAgente = (agente: Agente) => {
    setDeletingAgente(agente);
    setShowDeleteModal(true);
  };

  const confirmDeleteAgente = async () => {
    if (!deletingAgente?.id) return;

    try {
      setDeleteLoading(deletingAgente.id);
      const response = await agentesApi.deleteAgente(deletingAgente.id);
      if (response.success) {
        toast.success('Agente excluído com sucesso!', {
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
        setShowDeleteModal(false);
        setDeletingAgente(null);
        await loadData();
      } else {
        toast.error(response.message || 'Erro ao excluir agente');
      }
    } catch (error) {
      console.error('Erro ao excluir agente:', error);
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleToggleAtivo = async (agente: Agente) => {
    if (!agente.id) return;

    try {
      setToggleAtivoLoading(agente.id);
      const response = await agentesApi.toggleAgenteAtivo(agente.id, !agente.ativo);
      if (response.success) {
        toast.success(`Agente ${!agente.ativo ? 'ativado' : 'inativado'} com sucesso!`);
        await loadData();
      } else {
        toast.error(response.message || 'Erro ao alterar status do agente');
      }
    } catch (error) {
      console.error('Erro ao alterar status do agente:', error);
      toast.error('Erro ao alterar status do agente');
    } finally {
      setToggleAtivoLoading(null);
    }
  };

  const handleToggleAgendamento = async (agente: Agente) => {
    if (!agente.id) return;

    try {
      setToggleAgendamentoLoading(agente.id);
      const response = await agentesApi.toggleAgenteAgendamento(agente.id, !agente.agendamento);
      if (response.success) {
        toast.success(`Agendamento ${!agente.agendamento ? 'ativado' : 'desativado'} com sucesso!`);
        await loadData();
      } else {
        toast.error(response.message || 'Erro ao alterar agendamento');
      }
    } catch (error) {
      console.error('Erro ao alterar agendamento do agente:', error);
      toast.error('Erro ao alterar agendamento do agente');
    } finally {
      setToggleAgendamentoLoading(null);
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
      setBulkDeleteLoading(true);
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
    } finally {
      setBulkDeleteLoading(false);
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

  // Funções para gerenciar seleção de bases
  const toggleBaseSelection = (baseId: string) => {
    setSelectedBases(prev => {
      if (prev.includes(baseId)) {
        return prev.filter(id => id !== baseId);
      } else {
        return [...prev, baseId];
      }
    });
  };

  const removeBase = (baseId: string) => {
    setSelectedBases(prev => prev.filter(id => id !== baseId));
  };

  // Definição das colunas da tabela
  const columns: TableColumn<Agente>[] = [
    {
      key: 'nome',
      header: 'Nome',
      render: (agente) => <TableText>{agente.nome}</TableText>,
    },
    {
      key: 'tipo',
      header: 'Tipo',
      render: (agente) => (
        <TableBadge variant="blue">{getTipoAgenteNome(agente.tipo_agente_id)}</TableBadge>
      ),
    },
    {
      key: 'prompt',
      header: 'Prompt',
      render: (agente) => (
        <TableText truncate maxWidth="max-w-[200px]" title={agente.prompt}>
          {agente.prompt || '-'}
        </TableText>
      ),
    },
    {
      key: 'whatsapp',
      header: 'WhatsApp',
      render: (agente) => {
        if (agente.instancias_evolution_api && agente.instancias_evolution_api.length > 0) {
          return (
            <div className="flex flex-wrap gap-0.5">
              {agente.instancias_evolution_api.slice(0, 1).map((instancia, index) => (
                <TableBadge
                  key={instancia.id || index}
                  variant="green"
                  compact
                >
                  <span title={`Instância: ${instancia.instance_name || 'N/A'}\nFollowup: ${instancia.followup ? 'Sim' : 'Não'}\nEnvios diários: ${instancia.qtd_envios_diarios || 0}`}>
                    {instancia.instance_name || 'N/A'}
                  </span>
                </TableBadge>
              ))}
              {agente.instancias_evolution_api.length > 1 && (
                <TableBadge variant="gray" compact>
                  +{agente.instancias_evolution_api.length - 1}
                </TableBadge>
              )}
            </div>
          );
        }
        return <TableText>-</TableText>;
      },
    },
    {
      key: 'bases',
      header: 'Bases',
      render: (agente) => {
        if (agente.base_id && agente.base_id.length > 0) {
          return (
            <div className="flex flex-wrap gap-0.5">
              {agente.base_id.slice(0, 1).map(baseId => {
                const base = bases.find(b => b.id === baseId);
                return (
                  <TableBadge key={baseId} variant="purple" compact>
                    <span title={base?.nome || baseId}>
                      {base?.nome || baseId}
                    </span>
                  </TableBadge>
                );
              })}
              {agente.base_id.length > 1 && (
                <TableBadge variant="gray" compact>
                  +{agente.base_id.length - 1}
                </TableBadge>
              )}
            </div>
          );
        }
        return <TableText>-</TableText>;
      },
    },
    {
      key: 'agendamento',
      header: 'Agend.',
      align: 'center',
      render: (agente) => (
        <TableToggle
          checked={agente.agendamento || false}
          onChange={() => handleToggleAgendamento(agente)}
          disabled={toggleAgendamentoLoading === agente.id}
          color="bg-[#403CCF]"
          title={toggleAgendamentoLoading === agente.id ? 'Alterando...' : `${agente.agendamento ? 'Desativar' : 'Ativar'} agendamento`}
        />
      ),
    },
    {
      key: 'ativo',
      header: 'Ativo',
      align: 'center',
      render: (agente) => (
        <TableToggle
          checked={agente.ativo !== false}
          onChange={() => handleToggleAtivo(agente)}
          disabled={toggleAtivoLoading === agente.id}
          title={toggleAtivoLoading === agente.id ? 'Alterando...' : `${agente.ativo ? 'Inativar' : 'Ativar'} agente`}
        />
      ),
    },
    {
      key: 'acoes',
      header: 'Ações',
      width: 'w-16',
      render: (agente) => (
        <div className="flex items-center gap-0.5">
          <TableActionButton
            onClick={() => handleEditAgente(agente)}
            icon={<Edit size={14} />}
            title="Editar agente"
            variant="primary"
          />
          <TableActionButton
            onClick={() => handleDeleteAgente(agente)}
            icon={<Trash2 size={14} />}
            title={deleteLoading === agente.id ? "Excluindo..." : "Excluir agente"}
            variant="danger"
            disabled={deleteLoading === agente.id}
            loading={deleteLoading === agente.id}
          />
        </div>
      ),
    },
  ];

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
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-primary text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bot size={24} className="text-white" />
              <div>
                <h2 className="text-lg font-bold text-white !text-white">Agentes IA</h2>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={refreshLoading || loading}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors text-sm font-medium flex items-center gap-1.5 text-white"
              >
                <RefreshCw size={14} className={`text-white ${refreshLoading || loading ? 'animate-spin' : ''}`} />
                {refreshLoading ? 'Atualizando...' : 'Atualizar'}
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
                disabled={bulkDeleteLoading}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-1.5"
              >
                {bulkDeleteLoading ? (
                  <div className="w-3.5 h-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Trash2 size={14} />
                )}
                {bulkDeleteLoading ? 'Excluindo...' : 'Excluir Selecionados'}
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
            <Table
              columns={columns}
              data={paginatedAgentes}
              keyExtractor={(agente) => agente.id || ''}
              selectable
              selectedItems={selectedAgentes}
              onSelectItem={handleSelectAgente}
              onSelectAll={handleSelectAll}
              emptyMessage="Nenhum agente encontrado"
              compact
            />

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
          setSelectedBases([]);
          setIsDropdownOpen(false);
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

                  <div className="relative md:col-span-2" ref={dropdownRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bases de Conhecimento
                  </label>
                  <div
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm bg-white cursor-pointer min-h-[42px] flex items-center justify-between"
                  >
                    <div className="flex-1 flex flex-wrap gap-1">
                      {selectedBases.length === 0 ? (
                        <span className="text-gray-400">Selecione as bases</span>
                      ) : (
                        selectedBases.map(baseId => {
                          const base = bases.find(b => b.id === baseId);
                          return (
                            <span
                              key={baseId}
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded text-xs"
                            >
                              {base?.nome || baseId}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeBase(baseId);
                                }}
                                className="hover:bg-primary/20 rounded-full p-0.5"
                              >
                                <XMarkIcon className="h-3 w-3" />
                              </button>
                            </span>
                          );
                        })
                      )}
                    </div>
                    <ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform ${
                      isDropdownOpen ? 'transform rotate-180' : ''
                    }`} />
                  </div>
                  {isDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {bases.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-500 text-center">
                          Nenhuma base disponível
                        </div>
                      ) : (
                        <div className="py-1">
                          {bases.map((base) => (
                            <label
                              key={base.id}
                              className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                type="checkbox"
                                checked={selectedBases.includes(base.id!)}
                                onChange={() => toggleBaseSelection(base.id!)}
                                className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary cursor-pointer"
                              />
                              <span className="ml-2 text-sm text-gray-700">{base.nome}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {selectedBases.length > 0 && (
                    <p className="mt-1 text-xs text-gray-500">
                      {selectedBases.length} base{selectedBases.length > 1 ? 's' : ''} selecionada{selectedBases.length > 1 ? 's' : ''}
                    </p>
                  )}
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
                      setSelectedBases([]);
                      setIsDropdownOpen(false);
                      setIsCreatingAgente(false);
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saveLoading}
                    className="px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    {saveLoading ? (
                      <>
                        <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        {isCreatingAgente ? 'Criando...' : 'Salvando...'}
                      </>
                    ) : (
                      <>{isCreatingAgente ? 'Criar Agente' : 'Salvar Alterações'}</>
                    )}
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
              disabled={deleteLoading === deletingAgente?.id}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
            >
              {deleteLoading === deletingAgente?.id ? (
                <>
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Excluindo...
                </>
              ) : (
                'Excluir'
              )}
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
              disabled={bulkDeleteLoading}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
            >
              {bulkDeleteLoading ? (
                <>
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Excluindo...
                </>
              ) : (
                'Excluir Todos'
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AgentesManager;