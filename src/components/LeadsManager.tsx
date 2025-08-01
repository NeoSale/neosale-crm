'use client';

import React, { useState } from 'react';
import { Users, Database, Plus, Search, RefreshCw, AlertCircle, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

import { useLeads } from '../hooks/useLeads';
import { Lead } from '../services/leadsApi';

const LeadsManager: React.FC = () => {
  const {
    leads,
    stats,
    loading,
    error,
    refreshLeads,
    addLead,
    addMultipleLeads,
    updateLead,
    deleteLead
  } = useLeads();


  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [showMappingModal, setShowMappingModal] = useState<boolean>(false);
  const [fileData, setFileData] = useState<any[]>([]);
  const [fileHeaders, setFileHeaders] = useState<string[]>([]);
  const [fieldMapping, setFieldMapping] = useState<{ [key: string]: string }>({});
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [isCreatingLead, setIsCreatingLead] = useState<boolean>(false);
  const [deletingLead, setDeletingLead] = useState<Lead | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState<boolean>(false);

  // Estado para controlar se estamos no cliente
  const [isClient, setIsClient] = React.useState(false);

  // Verificar se estamos no lado do cliente
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  // Fechar modais com ESC
  React.useEffect(() => {
    if (!isClient) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showEditModal) {
          setShowEditModal(false);
          setEditingLead(null);
          setIsCreatingLead(false);
        }
        if (showDeleteModal) {
          setShowDeleteModal(false);
          setDeletingLead(null);
        }
        if (showMappingModal) {
          handleCancelMapping();
        }
        if (showBulkDeleteModal) {
          setShowBulkDeleteModal(false);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isClient, showEditModal, showDeleteModal, showMappingModal, showBulkDeleteModal]);

  const handleImportLeads = async (newLeads: Lead[]) => {
    try {
      const success = await addMultipleLeads(newLeads);
      if (success) {
        await refreshLeads();
      }
    } catch (error) {
      console.error('Erro ao importar leads:', error);
    }
  };

  const handleFieldMappingChange = (leadField: string, excelColumn: string) => {
    setFieldMapping(prev => ({
      ...prev,
      [leadField]: excelColumn
    }));
  };

  const handleConfirmMapping = async () => {
    try {
      const mappedData = fileData.map(row => {
        const mappedRow: any = {};
        Object.entries(fieldMapping).forEach(([leadField, excelColumn]) => {
          if (excelColumn && excelColumn !== '') {
            mappedRow[leadField] = row[excelColumn] || '';
          }
        });
        return mappedRow;
      });

      if (mappedData.length > 0) {
        await handleImportLeads(mappedData as Lead[]);
        setShowMappingModal(false);
        setFileData([]);
        setFileHeaders([]);
        setFieldMapping({});
      }
    } catch (error) {
      console.error('Erro ao processar mapeamento:', error);
      toast.error('Erro ao processar mapeamento de campos.');
    }
  };

  const handleCancelMapping = () => {
    setShowMappingModal(false);
    setFileData([]);
    setFileHeaders([]);
    setFieldMapping({});
  };

  const autoMapFields = (headers: string[]) => {
    const mapping: { [key: string]: string } = {};
    const leadFields = ['nome', 'email', 'telefone', 'empresa', 'cargo', 'status', 'contador', 'escritorio', 'responsavel', 'cnpj', 'observacao', 'segmento', 'erp_atual'];

    headers.forEach(header => {
      const normalizedHeader = header.toLowerCase().trim();

      // Mapeamento automático baseado em palavras-chave
      if (normalizedHeader.includes('nome') || normalizedHeader.includes('name')) {
        mapping['nome'] = header;
      } else if (normalizedHeader.includes('telefone') || normalizedHeader.includes('phone') || normalizedHeader.includes('celular')) {
        mapping['telefone'] = header;
      } else if (normalizedHeader.includes('email') || normalizedHeader.includes('e-mail')) {
        mapping['email'] = header;
      } else if (normalizedHeader.includes('cnpj') || normalizedHeader.includes('tax_id')) {
        mapping['cnpj'] = header;
      } else if (normalizedHeader.includes('status') || normalizedHeader.includes('situação')) {
        mapping['status'] = header;
      }
    });

    return mapping;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileExtension = file.name.toLowerCase().split('.').pop();

    try {
      if (fileExtension === 'csv') {
        // Processar arquivo CSV
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const csvText = e.target?.result as string;
            const lines = csvText.split('\n').filter(line => line.trim());

            if (lines.length < 2) {
              toast.error('Arquivo CSV deve conter pelo menos um cabeçalho e uma linha de dados.');
              return;
            }

            const headers = lines[0].split(';').map(h => h.trim().replace(/"/g, ''));
            const jsonData = [];

            for (let i = 1; i < lines.length; i++) {
              const values = lines[i].split(';').map(v => v.trim().replace(/"/g, ''));
              const row: any = {};
              headers.forEach((header, index) => {
                row[header] = values[index] || '';
              });

              // Ignorar linhas vazias - verifica se pelo menos um campo tem valor
              const hasValidData = Object.values(row).some(value => {
                if (typeof value === 'string') return value.trim() !== '';
                return value !== null && value !== undefined;
              });

              if (hasValidData) {
                jsonData.push(row);
              }
            }

            // Mapeamento automático e abertura do modal
            const autoMapping = autoMapFields(headers);
            setFileHeaders(headers);
            setFileData(jsonData);
            setFieldMapping(autoMapping);
            setShowMappingModal(true);
          } catch (error) {
            console.error('Erro ao processar arquivo CSV:', error);
            toast.error('Erro ao processar arquivo CSV. Verifique se o formato está correto.');
          }
        };

        reader.readAsText(file);
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls' || fileExtension === 'xlsm') {
        // Processar arquivo Excel
        const XLSX = await import('xlsx');

        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            if (jsonData.length < 2) {
              toast.error('Arquivo deve conter pelo menos um cabeçalho e uma linha de dados.');
              return;
            }

            const headers = (jsonData[0] as string[]).map(h => String(h || '').trim());
            const dataRows = [];

            for (let i = 1; i < jsonData.length; i++) {
              const row: any = {};
              const values = jsonData[i] as any[];
              headers.forEach((header, index) => {
                row[header] = String(values[index] || '').trim();
              });

              // Ignorar linhas vazias - verifica se pelo menos um campo tem valor
              const hasValidData = Object.values(row).some(value => {
                if (typeof value === 'string') return value.trim() !== '';
                return value !== null && value !== undefined;
              });

              if (hasValidData) {
                dataRows.push(row);
              }
            }

            // Mapeamento automático e abertura do modal
            const autoMapping = autoMapFields(headers);
            setFileHeaders(headers);
            setFileData(dataRows);
            setFieldMapping(autoMapping);
            setShowMappingModal(true);
          } catch (error) {
            console.error('Erro ao processar arquivo Excel:', error);
            toast.error('Erro ao processar arquivo Excel. Verifique se o formato está correto.');
          }
        };

        reader.readAsArrayBuffer(file);
      } else {
        toast.error('Formato de arquivo não suportado. Use apenas .xlsx, .xls ou .csv');
      }
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      toast.error('Erro ao processar arquivo.');
    }

    // Limpar o input para permitir selecionar o mesmo arquivo novamente
    event.target.value = '';
  };

  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead);
    setShowEditModal(true);
  };

  const handleUpdateLead = async (updatedData: Partial<Lead>) => {
    try {
      let success;

      if (isCreatingLead) {
        // Criar novo lead
        success = await addLead(updatedData as Lead);
      } else {
        // Atualizar lead existente
        if (!editingLead?.id) return;
        success = await updateLead(editingLead.id, updatedData);
      }

      if (success) {
        setShowEditModal(false);
        setEditingLead(null);
        setIsCreatingLead(false);
        await refreshLeads();
      }
    } catch (error) {
      console.error('Erro ao salvar lead:', error);
    }
  };

  const handleDeleteLead = (lead: Lead) => {
    setDeletingLead(lead);
    setShowDeleteModal(true);
  };

  const confirmDeleteLead = async () => {
    if (!deletingLead?.id) return;

    try {
      const success = await deleteLead(deletingLead.id);
      if (success) {
        setShowDeleteModal(false);
        setDeletingLead(null);
        await refreshLeads();
      }
    } catch (error) {
      console.error('Erro ao excluir lead:', error);
    }
  };

  // Funções para seleção múltipla
  const handleSelectLead = (leadId: string) => {
    const newSelected = new Set(selectedLeads);
    if (newSelected.has(leadId)) {
      newSelected.delete(leadId);
    } else {
      newSelected.add(leadId);
    }
    setSelectedLeads(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedLeads.size === paginatedLeads.length) {
      setSelectedLeads(new Set());
    } else {
      const allIds = new Set(paginatedLeads.map(lead => lead.id || '').filter(id => id));
      setSelectedLeads(allIds);
    }
  };

  const handleBulkDelete = () => {
    if (selectedLeads.size > 0) {
      setShowBulkDeleteModal(true);
    }
  };

  const confirmBulkDelete = async () => {
    try {
      const deletePromises = Array.from(selectedLeads).map(leadId => deleteLead(leadId));
      const results = await Promise.all(deletePromises);

      const successCount = results.filter(result => result).length;
      const failCount = results.length - successCount;

      if (successCount > 0) {
        await refreshLeads();
        setSelectedLeads(new Set());

        // Mostrar mensagem de sucesso em verde apenas se houve sucessos
        if (failCount > 0) {
          toast.error(`${successCount} leads excluídos com sucesso. ${failCount} falharam.`);
        } else {
          toast.success(`${successCount} leads excluídos com sucesso.`, {
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
      console.error('Erro ao excluir leads:', error);
    }
  };

  // Limpar seleção quando mudar de página ou filtro
  React.useEffect(() => {
    setSelectedLeads(new Set());
  }, [currentPage, searchTerm, itemsPerPage]);

  // Função para criar novo lead
  const handleCreateLead = () => {
    const newLead: Lead = {
      nome: '',
      email: '',
      telefone: '',
      empresa: '',
      cargo: '',
      status_agendamento: false,
      contador: '',
      escritorio: '',
      responsavel: '',
      cnpj: '',
      observacao: '',
      segmento: '',
      erp_atual: ''
    };
    setEditingLead(newLead);
    setIsCreatingLead(true);
    setShowEditModal(true);
  };

  const handleRefresh = async () => {
    await refreshLeads();
  };

  // Filtrar leads baseado no termo de busca
  const filteredLeads = Array.isArray(leads) ? leads.filter(lead => {
    if (!searchTerm) return true;

    return Object.values(lead).some(value =>
      value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    );
  }) : [];

  // Paginação
  const totalItems = filteredLeads.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLeads = filteredLeads.slice(startIndex, endIndex);

  // Resetar página quando filtro mudar
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  if (loading && (!Array.isArray(leads) || leads.length === 0)) {
    return (
      <div className="w-full max-w-6xl mx-auto space-y-4">
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Carregando leads...
          </h3>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">


      {/* Seção de Leads Existentes */}
      <div className="mt-6 bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-primary text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users size={24} className="text-white" />
              <div>
                <h2 className="text-lg font-bold text-white !text-white">Leads Cadastrados</h2>
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
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    // setShowUpload(true);
                  }
                }}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <button
                onClick={handleCreateLead}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium flex items-center gap-1.5 text-white"
              >
                <Plus size={14} className="text-white" />
                Novo Lead
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium flex items-center gap-1.5 text-white"
              >
                <Database size={14} className="text-white" />
                Importar Leads
              </button>
              {selectedLeads.size > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-1.5 bg-primary hover:bg-primary/90 rounded-lg transition-colors text-sm font-medium flex items-center gap-1.5 text-white"
                >
                  <Trash2 size={14} className="text-white" />
                  Excluir ({selectedLeads.size})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        {Array.isArray(leads) && leads.length > 0 && (
          <div className="bg-secondary px-4 py-3 border-b">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">
                  {stats?.total || (Array.isArray(leads) ? leads.length : 0)}
                </div>
                <div className="text-sm text-gray-600">Total de Leads</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {stats?.withEmail || leads.filter(lead =>
                    lead.email && lead.email.trim() !== ''
                  ).length}
                </div>
                <div className="text-sm text-gray-600">Com Email</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {stats?.qualified || leads.filter(lead =>
                    lead.status === 'qualificado'
                  ).length}
                </div>
                <div className="text-sm text-gray-600">Qualificados</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {stats?.new || leads.filter(lead =>
                    lead.status === 'novo'
                  ).length}
                </div>
                <div className="text-sm text-gray-600">Novos</div>
              </div>
            </div>
          </div>
        )}

        {/* Barra de Busca */}
        <div className="p-3 bg-gray-50 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Buscar leads por nome, email, empresa..."
              className="w-full pl-10 pr-4 py-2 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {paginatedLeads.length > 0 ? (
          <>
            {/* Cabeçalhos específicos das colunas desejadas */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                      <input
                        type="checkbox"
                        checked={paginatedLeads.length > 0 && selectedLeads.size === paginatedLeads.length}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                    </th>
                    {['nome', 'telefone', 'email', 'cnpj', 'origem', 'status_agendamento', 'created_at'].map((header, index) => (
                      <th
                        key={index}
                        className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {header === 'created_at' ? 'Data' :
                          header === 'status_agendamento' ? 'Agendado' :
                            header === 'status_negociacao' ? 'Negociação' :
                              header === 'etapa_funil' ? 'Etapa' :
                                header === 'erp_atual' ? 'ERP Atual' :
                                  header === 'observacao' ? 'Observação' :
                                    header.charAt(0).toUpperCase() + header.slice(1)}
                      </th>
                    ))}
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedLeads.map((lead, rowIndex) => (
                    <tr key={lead.id || rowIndex} className="hover:bg-gray-50">
                      <td className="px-3 py-2 whitespace-nowrap text-sm">
                        <input
                          type="checkbox"
                          checked={selectedLeads.has(lead.id || '')}
                          onChange={() => handleSelectLead(lead.id || '')}
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                        />
                      </td>
                      {['nome', 'telefone', 'email', 'cnpj', 'origem', 'status_agendamento', 'created_at'].map((header, colIndex) => (
                        <td
                          key={colIndex}
                          className="px-3 py-2 whitespace-nowrap text-sm text-gray-700"
                        >
                          {(() => {
                            const value = lead[header];
                            if (value === null || value === undefined) return '-';

                            // Tratar booleanos
                            if (typeof value === 'boolean') {
                              return value ? 'Sim' : 'Não';
                            }

                            // Tratar objetos
                            if (typeof value === 'object' && value !== null) {
                              // Se for um objeto, tentar extrair o nome primeiro, depois id
                              return value.nome || value.id || '-';
                            }

                            // Tratar datas
                            if (header === 'created_at' && typeof value === 'string') {
                              try {
                                const date = new Date(value);
                                // Formatação consistente entre servidor e cliente
                                const day = date.getDate().toString().padStart(2, '0');
                                const month = (date.getMonth() + 1).toString().padStart(2, '0');
                                const year = date.getFullYear();
                                return `${day}/${month}/${year}`;
                              } catch {
                                return value;
                              }
                            }

                            return value;
                          })()}
                        </td>
                      ))}
                      <td className="px-3 py-2 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEditLead(lead)}
                            className="p-1 text-primary hover:text-primary/70 hover:bg-primary/10 rounded transition-colors"
                            title="Editar lead"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteLead(lead)}
                            className="p-1 text-primary hover:text-primary/70 hover:bg-primary/10 rounded transition-colors"
                            title="Excluir lead"
                          >
                            <Trash2 size={14} />
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-700">
                      Mostrando {startIndex + 1} a {Math.min(endIndex, totalItems)} de {totalItems} resultados
                    </span>
                    <div className="flex items-center space-x-2 ml-4">
                      <span className="text-sm text-gray-700">Itens por página:</span>
                      <select
                        className="border border-gray-300 rounded px-2 py-1 text-sm"
                        value={itemsPerPage}
                        onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                      >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>

                    {/* Números das páginas */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNumber;
                      if (totalPages <= 5) {
                        pageNumber = i + 1;
                      } else if (currentPage <= 3) {
                        pageNumber = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNumber = totalPages - 4 + i;
                      } else {
                        pageNumber = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNumber}
                          onClick={() => handlePageChange(pageNumber)}
                          className={`px-3 py-1 text-sm border rounded-md ${currentPage === pageNumber
                            ? 'bg-primary text-white border-primary'
                            : 'border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Próximo
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-8 text-center">
            <Database className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-base font-medium text-gray-900 mb-2">
              {searchTerm ? 'Nenhum lead encontrado' : 'Nenhum lead cadastrado'}
            </h3>
            <p className="text-gray-500 mb-4 text-sm">
              {searchTerm
                ? 'Tente ajustar os termos de busca ou limpar o filtro.'
                : 'Comece importando leads de um arquivo CSV ou Excel.'}
            </p>
            {!searchTerm && (
              <button
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                onClick={() => fileInputRef.current?.click()}
              >
                Importar Leads
              </button>
            )}
            {searchTerm && (
              <button
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                onClick={() => setSearchTerm('')}
              >
                Limpar Filtro
              </button>
            )}
          </div>
        )}

        {/* Informações de Filtro */}
        {searchTerm && Array.isArray(leads) && leads.length > 0 && (
          <div className="bg-secondary px-4 py-2 border-t">
            <div className="text-center">
              <p className="text-xs text-gray-600">
                Mostrando {filteredLeads.length} de {leads.length} leads para "{searchTerm}"
              </p>
            </div>
          </div>
        )}
      </div>



      {/* Modal de Edição */}
      {showEditModal && editingLead && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 text-gray-700"
          onClick={() => {
            setShowEditModal(false);
            setEditingLead(null);
            setIsCreatingLead(false);
          }}
        >
          <div
            className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base text-gray-500 font-semibold mb-3">
                {isCreatingLead ? 'Criar Lead' : 'Editar Lead'}
              </h3>
            </div>
            <EditLeadForm
              lead={editingLead}
              onSave={handleUpdateLead}
              onCancel={() => {
                setShowEditModal(false);
                setEditingLead(null);
                setIsCreatingLead(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteModal && deletingLead && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 text-gray-700"
          onClick={() => {
            setShowDeleteModal(false);
            setDeletingLead(null);
          }}
        >
          <div
            className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <h3 className="text-base font-semibold mb-3 text-primary">Confirmar Exclusão</h3>
              <p className="text-gray-700 mb-4 text-sm">
                Tem certeza que deseja excluir o lead <strong>{deletingLead.nome}</strong>?<br />
                <span className="text-xs text-gray-500">Esta ação não pode ser desfeita.</span>
              </p>
              <div className="flex justify-end gap-2">
                <button
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletingLead(null);
                  }}
                >
                  Cancelar
                </button>
                <button
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                  onClick={confirmDeleteLead}
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Mapeamento de Campos */}
      {showMappingModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={handleCancelMapping}
        >
          <div
            className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Mapear Campos da Planilha</h2>
              <div className="text-sm text-gray-600">
                {fileData.length} registros encontrados
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Formulário de Mapeamento */}
              <div className="lg:col-span-2">
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h3 className="text-lg font-semibold mb-2 text-gray-800">Colunas da Planilha</h3>
                  <div className="flex flex-wrap gap-2">
                    {fileHeaders.map(header => (
                      <span key={header} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                        {header}
                      </span>
                    ))}
                  </div>
                </div>

                <h3 className="text-lg font-semibold mb-4 text-gray-800">Mapeamento de Campos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-500">
                  {/* Campo Nome */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                      Nome *
                    </label>
                    <select
                      value={fieldMapping['nome'] || ''}
                      onChange={(e) => handleFieldMappingChange('nome', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="">Selecione uma coluna</option>
                      {fileHeaders.map(header => (
                        <option key={header} value={header}>{header}</option>
                      ))}
                    </select>
                    {fieldMapping['nome'] && (
                      <div className="mt-2 text-xs text-green-600">
                        ✓ Mapeado para: {fieldMapping['nome']}
                      </div>
                    )}
                  </div>

                  {/* Campo Email */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                      Email
                    </label>
                    <select
                      value={fieldMapping['email'] || ''}
                      onChange={(e) => handleFieldMappingChange('email', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="">Selecione uma coluna</option>
                      {fileHeaders.map(header => (
                        <option key={header} value={header}>{header}</option>
                      ))}
                    </select>
                    {fieldMapping['email'] && (
                      <div className="mt-2 text-xs text-green-600">
                        ✓ Mapeado para: {fieldMapping['email']}
                      </div>
                    )}
                  </div>

                  {/* Campo Telefone */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                      Telefone *
                    </label>
                    <select
                      value={fieldMapping['telefone'] || ''}
                      onChange={(e) => handleFieldMappingChange('telefone', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="">Selecione uma coluna</option>
                      {fileHeaders.map(header => (
                        <option key={header} value={header}>{header}</option>
                      ))}
                    </select>
                    {fieldMapping['telefone'] && (
                      <div className="mt-2 text-xs text-green-600">
                        ✓ Mapeado para: {fieldMapping['telefone']}
                      </div>
                    )}
                  </div>

                  {/* Campo Empresa */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                      Empresa
                    </label>
                    <select
                      value={fieldMapping['empresa'] || ''}
                      onChange={(e) => handleFieldMappingChange('empresa', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="">Selecione uma coluna</option>
                      {fileHeaders.map(header => (
                        <option key={header} value={header}>{header}</option>
                      ))}
                    </select>
                    {fieldMapping['empresa'] && (
                      <div className="mt-2 text-xs text-green-600">
                        ✓ Mapeado para: {fieldMapping['empresa']}
                      </div>
                    )}
                  </div>

                  {/* Campo Cargo */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                      Cargo
                    </label>
                    <select
                      value={fieldMapping['cargo'] || ''}
                      onChange={(e) => handleFieldMappingChange('cargo', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="">Selecione uma coluna</option>
                      {fileHeaders.map(header => (
                        <option key={header} value={header}>{header}</option>
                      ))}
                    </select>
                    {fieldMapping['cargo'] && (
                      <div className="mt-2 text-xs text-green-600">
                        ✓ Mapeado para: {fieldMapping['cargo']}
                      </div>
                    )}
                  </div>

                  {/* Campo Contador */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                      Contador
                    </label>
                    <select
                      value={fieldMapping['contador'] || ''}
                      onChange={(e) => handleFieldMappingChange('contador', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="">Selecione uma coluna</option>
                      {fileHeaders.map(header => (
                        <option key={header} value={header}>{header}</option>
                      ))}
                    </select>
                    {fieldMapping['contador'] && (
                      <div className="mt-2 text-xs text-green-600">
                        ✓ Mapeado para: {fieldMapping['contador']}
                      </div>
                    )}
                  </div>

                  {/* Campo Escritório */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                      Escritório
                    </label>
                    <select
                      value={fieldMapping['escritorio'] || ''}
                      onChange={(e) => handleFieldMappingChange('escritorio', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Selecione uma coluna</option>
                      {fileHeaders.map(header => (
                        <option key={header} value={header}>{header}</option>
                      ))}
                    </select>
                    {fieldMapping['escritorio'] && (
                      <div className="mt-2 text-xs text-green-600">
                        ✓ Mapeado para: {fieldMapping['escritorio']}
                      </div>
                    )}
                  </div>

                  {/* Campo Responsável */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                      Responsável
                    </label>
                    <select
                      value={fieldMapping['responsavel'] || ''}
                      onChange={(e) => handleFieldMappingChange('responsavel', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Selecione uma coluna</option>
                      {fileHeaders.map(header => (
                        <option key={header} value={header}>{header}</option>
                      ))}
                    </select>
                    {fieldMapping['responsavel'] && (
                      <div className="mt-2 text-xs text-green-600">
                        ✓ Mapeado para: {fieldMapping['responsavel']}
                      </div>
                    )}
                  </div>

                  {/* Campo CNPJ */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                      CNPJ
                    </label>
                    <select
                      value={fieldMapping['cnpj'] || ''}
                      onChange={(e) => handleFieldMappingChange('cnpj', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Selecione uma coluna</option>
                      {fileHeaders.map(header => (
                        <option key={header} value={header}>{header}</option>
                      ))}
                    </select>
                    {fieldMapping['cnpj'] && (
                      <div className="mt-2 text-xs text-green-600">
                        ✓ Mapeado para: {fieldMapping['cnpj']}
                      </div>
                    )}
                  </div>

                  {/* Campo Segmento */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                      Segmento
                    </label>
                    <select
                      value={fieldMapping['segmento'] || ''}
                      onChange={(e) => handleFieldMappingChange('segmento', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Selecione uma coluna</option>
                      {fileHeaders.map(header => (
                        <option key={header} value={header}>{header}</option>
                      ))}
                    </select>
                    {fieldMapping['segmento'] && (
                      <div className="mt-2 text-xs text-green-600">
                        ✓ Mapeado para: {fieldMapping['segmento']}
                      </div>
                    )}
                  </div>

                  {/* Campo ERP Atual */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                      ERP Atual
                    </label>
                    <select
                      value={fieldMapping['erp_atual'] || ''}
                      onChange={(e) => handleFieldMappingChange('erp_atual', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Selecione uma coluna</option>
                      {fileHeaders.map(header => (
                        <option key={header} value={header}>{header}</option>
                      ))}
                    </select>
                    {fieldMapping['erp_atual'] && (
                      <div className="mt-2 text-xs text-green-600">
                        ✓ Mapeado para: {fieldMapping['erp_atual']}
                      </div>
                    )}
                  </div>

                  {/* Campo Observação */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                      Observação
                    </label>
                    <select
                      value={fieldMapping['observacao'] || ''}
                      onChange={(e) => handleFieldMappingChange('observacao', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Selecione uma coluna</option>
                      {fileHeaders.map(header => (
                        <option key={header} value={header}>{header}</option>
                      ))}
                    </select>
                    {fieldMapping['observacao'] && (
                      <div className="mt-2 text-xs text-green-600">
                        ✓ Mapeado para: {fieldMapping['observacao']}
                      </div>
                    )}
                  </div>

                </div>

                <div className="mt-4 p-3 bg-primary/10 rounded-lg">
                  <div className="flex items-center text-sm text-primary">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                    Campos obrigatórios
                    <span className="w-2 h-2 bg-yellow-500 rounded-full ml-4 mr-2"></span>
                    Campos opcionais
                  </div>
                </div>
              </div>

              {/* Preview dos Dados */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Preview dos Dados</h3>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-140 overflow-y-auto">
                  {fileData.slice(0, 5).map((row, index) => (
                    <div key={index} className="mb-3 p-3 bg-white rounded-md border border-gray-100 shadow-sm">
                      <div className="text-xs font-medium text-gray-500 mb-2">Registro {index + 1}</div>
                      {Object.entries(fieldMapping).map(([leadField, excelColumn]) => {
                        if (excelColumn && row[excelColumn]) {
                          return (
                            <div key={leadField} className="text-sm mb-1">
                              <span className="font-medium text-gray-700">{leadField}:</span>
                              <span className="ml-2 text-gray-600">{String(row[excelColumn])}</span>
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  ))}
                  {fileData.length > 5 && (
                    <div className="text-sm text-gray-500 text-center mt-3 p-2 bg-gray-100 rounded">
                      ... e mais {fileData.length - 5} registros
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                {Object.values(fieldMapping).filter(v => v).length} de {Object.keys(fieldMapping).length} campos mapeados
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleCancelMapping}
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmMapping}
                  disabled={!fieldMapping['nome'] || !fieldMapping['telefone']}
                  className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  Confirmar Importação
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação para Exclusão em Massa */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Confirmar Exclusão
                </h3>
                <p className="text-sm text-gray-500">
                  Tem certeza que deseja excluir {selectedLeads.size} lead(s) selecionado(s)?
                </p>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-800 text-sm">
                <strong>Atenção:</strong> Esta ação não pode ser desfeita. Os leads serão permanentemente removidos do sistema.
              </p>
            </div>

            <div className="flex gap-3 justify-end">
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
                Excluir {selectedLeads.size} Lead(s)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente para editar lead
interface EditLeadFormProps {
  lead: Lead;
  onSave: (data: Partial<Lead>) => void;
  onCancel: () => void;
}

const EditLeadForm: React.FC<EditLeadFormProps> = ({ lead, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Lead>>({
    nome: lead.nome || '',
    email: lead.email || '',
    telefone: lead.telefone || '',
    empresa: lead.empresa || '',
    cargo: lead.cargo || '',
    agendado: lead.status_agendamento || '',
    contador: lead.contador || '',
    escritorio: lead.escritorio || '',
    responsavel: lead.responsavel || '',
    cnpj: lead.cnpj || '',
    observacao: lead.observacao || '',
    segmento: lead.segmento || '',
    erp_atual: lead.erp_atual || ''
  });

  const [errors, setErrors] = useState<{
    nome?: string;
    telefone?: string;
    email?: string;
    cnpj?: string;
  }>({});

  console.log('lead.status_agendamento', lead.status_agendamento);

  // Função para validar nome
  const validateName = (name: string): string | null => {
    if (!name.trim()) {
      return 'Nome é obrigatório';
    }
    return null;
  };

  // Função para validar telefone
  const validatePhone = (phone: string): string | null => {
    if (!phone.trim()) {
      return 'Telefone é obrigatório';
    }

    // Remove todos os caracteres não numéricos
    const cleanPhone = phone.replace(/\D/g, '');

    // Verifica se tem pelo menos 10 dígitos (DDD + número)
    if (cleanPhone.length < 10) {
      return 'Telefone deve ter pelo menos 10 dígitos';
    }

    // Verifica se tem no máximo 11 dígitos (celular com 9)
    if (cleanPhone.length > 11) {
      return 'Telefone deve ter no máximo 11 dígitos';
    }

    return null;
  };

  // Função para validar email
  const validateEmail = (email: string): string | null => {
    if (!email.trim()) {
      return null; // Email não é obrigatório
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Email deve ter um formato válido';
    }

    return null;
  };

  const validateCNPJ = (cnpj: string): string | null => {
    if (!cnpj.trim()) {
      return null; // CNPJ não é obrigatório
    }

    // Remove caracteres não numéricos
    const cleanCNPJ = cnpj.replace(/\D/g, '');

    // Verifica se tem 14 dígitos
    if (cleanCNPJ.length !== 14) {
      return 'CNPJ deve ter 14 dígitos';
    }

    // Verifica se não são todos os dígitos iguais
    if (/^(\d)\1{13}$/.test(cleanCNPJ)) {
      return 'CNPJ inválido';
    }

    // Validação dos dígitos verificadores
    let soma = 0;
    let peso = 2;
    for (let i = 11; i >= 0; i--) {
      soma += parseInt(cleanCNPJ.charAt(i)) * peso;
      peso = peso === 9 ? 2 : peso + 1;
    }
    let digito1 = soma % 11 < 2 ? 0 : 11 - (soma % 11);

    soma = 0;
    peso = 2;
    for (let i = 12; i >= 0; i--) {
      soma += parseInt(cleanCNPJ.charAt(i)) * peso;
      peso = peso === 9 ? 2 : peso + 1;
    }
    let digito2 = soma % 11 < 2 ? 0 : 11 - (soma % 11);

    if (parseInt(cleanCNPJ.charAt(12)) !== digito1 || parseInt(cleanCNPJ.charAt(13)) !== digito2) {
      return 'CNPJ inválido';
    }

    return null;
  };

  React.useEffect(() => {
    // Verificar se estamos no lado do cliente
    if (typeof window === 'undefined') return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onCancel]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validar campos
    const nameError = validateName(formData.nome || '');
    const phoneError = validatePhone(formData.telefone || '');
    const emailError = validateEmail(formData.email || '');
    const cnpjError = validateCNPJ(formData.cnpj || '');

    const newErrors: { nome?: string; telefone?: string; email?: string; cnpj?: string } = {};
    if (nameError) newErrors.nome = nameError;
    if (phoneError) newErrors.telefone = phoneError;
    if (emailError) newErrors.email = emailError;
    if (cnpjError) newErrors.cnpj = cnpjError;

    setErrors(newErrors);

    // Se há erros, não enviar o formulário
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    // Converter status_agendamento de string para boolean
    const processedData = {
      ...formData,
      status_agendamento: formData.status_agendamento === 'true' ? true :
        formData.status_agendamento === 'false' ? false :
          formData.status_agendamento
    };

    onSave(processedData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-1 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Nome *</label>
          <input
            type="text"
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm ${errors.nome ? 'border-red-500' : 'border-gray-300'
              }`}
            value={formData.nome || ''}
            onChange={(e) => handleChange('nome', e.target.value)}
            placeholder="Digite o nome completo"
          />
          {errors.nome && (
            <p className="text-red-500 text-xs mt-1">{errors.nome}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm ${errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
            value={formData.email || ''}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="exemplo@email.com"
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1">{errors.email}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Telefone *</label>
          <input
            type="tel"
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm ${errors.telefone ? 'border-red-500' : 'border-gray-300'
              }`}
            value={formData.telefone || ''}
            onChange={(e) => handleChange('telefone', e.target.value)}
            placeholder="(11) 99999-9999"
          />
          {errors.telefone && (
            <p className="text-red-500 text-xs mt-1">{errors.telefone}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Empresa</label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            value={formData.empresa || ''}
            onChange={(e) => handleChange('empresa', e.target.value)}
            placeholder="Nome da empresa"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Cargo</label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            value={formData.cargo || ''}
            onChange={(e) => handleChange('cargo', e.target.value)}
            placeholder="Cargo ou função"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Agendado</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            value={formData.agendado || false}
            onChange={(e) => handleChange('status_agendamento', e.target.value)}
          >
            <option value="">Selecione o Agendamento</option>
            <option value="true">Sim</option>
            <option value="false">Não</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Contador</label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            value={formData.contador || ''}
            onChange={(e) => handleChange('contador', e.target.value)}
            placeholder="Nome do contador responsável"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Escritório</label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            value={formData.escritorio || ''}
            onChange={(e) => handleChange('escritorio', e.target.value)}
            placeholder="Nome do escritório de contabilidade"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Responsável</label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            value={formData.responsavel || ''}
            onChange={(e) => handleChange('responsavel', e.target.value)}
            placeholder="Responsável pelo lead"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">CNPJ</label>
          <input
            type="text"
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm ${errors.cnpj ? 'border-red-500' : 'border-gray-300'
              }`}
            value={formData.cnpj || ''}
            onChange={(e) => handleChange('cnpj', e.target.value)}
            placeholder="00.000.000/0000-00"
          />
          {errors.cnpj && (
            <p className="text-red-500 text-xs mt-1">{errors.cnpj}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Segmento</label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            value={formData.segmento || ''}
            onChange={(e) => handleChange('segmento', e.target.value)}
            placeholder="Segmento de atuação da empresa"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">ERP Atual</label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            value={formData.erp_atual || ''}
            onChange={(e) => handleChange('erp_atual', e.target.value)}
            placeholder="Sistema ERP utilizado atualmente"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Observação</label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            rows={3}
            value={formData.observacao || ''}
            onChange={(e) => handleChange('observacao', e.target.value)}
            placeholder="Observações sobre o lead..."
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-3">
        <button
          type="button"
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          onClick={onCancel}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          Salvar
        </button>
      </div>
    </form>
  );
};

export default LeadsManager;