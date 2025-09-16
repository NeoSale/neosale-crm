'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { followupApi, DetalheFollowUp } from '../services/followupApi';
import { toast } from 'react-hot-toast';
import { ErrorHandler } from '../utils/error-handler';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowPathIcon,
  CalendarIcon,
  DocumentDuplicateIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { Search } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatPhone, copyPhone } from '../utils/phone-utils';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ptBR } from 'date-fns/locale';
import Modal from './Modal';
import { formatDateTime } from '../utils/date-utils';

// Registrar localização pt-BR para o DatePicker
registerLocale('pt-BR', ptBR);

const PorDiaFollowUpManager: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [detalhes, setDetalhes] = useState<DetalheFollowUp[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState(() => {
    const dateParam = searchParams.get('data');
    return dateParam || new Date().toISOString().split('T')[0];
  });
  const [selectedItem, setSelectedItem] = useState<DetalheFollowUp | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Obter data da URL ao carregar o componente
  useEffect(() => {
    const dataFromUrl = searchParams.get('data');
    if (dataFromUrl) {
      setSelectedDate(dataFromUrl);
    }
  }, [searchParams]);

  const itemsPerPageOptions = [5, 10, 20, 50];

  useEffect(() => {
    if (selectedDate) {
      loadDetalhes();
    }
  }, [selectedDate]);

  const loadDetalhes = async (data?: string) => {
    const dateToLoad = data || selectedDate;
    if (!dateToLoad) return;

    try {
      setLoading(true);
      setError(null);
      const response = await followupApi.getDetalhesPorData(dateToLoad);

      if (response.success) {
        setDetalhes(response.data);
      } else {
        throw new Error('Erro ao carregar detalhes');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      toast.error('Erro ao carregar detalhes do dia');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar detalhes baseado no termo de busca e status
  const filteredDetalhes = useMemo(() => {
    let filtered = detalhes;

    // Filtrar por status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    // Filtrar por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(item => {
        const { date, time } = formatDateTime(item.horario);
        return item.nome_lead.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.telefone_lead.includes(searchTerm) ||
          item.mensagem_enviada.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
          date.includes(searchTerm) ||
          time.includes(searchTerm) ||
          (item.mensagem_erro && item.mensagem_erro.toLowerCase().includes(searchTerm.toLowerCase()));
      });
    }

    return filtered;
  }, [detalhes, searchTerm, statusFilter]);

  // Reset da página quando o termo de busca ou status muda
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // Paginação
  const totalPages = Math.ceil(filteredDetalhes.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredDetalhes.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredDetalhes, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    if (totalPages === 0) {
      setCurrentPage(1);
      return;
    }
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setCurrentPage(1);
  };

  const getStatusBadge = (status: string) => {
    if (status === 'sucesso') {
      return 'bg-green-100 text-green-800';
    }
    return 'bg-red-100 text-red-800';
  };

  const getStatusText = (status: string) => {
    return status === 'sucesso' ? 'Sucesso' : 'Erro';
  };

  // Calcular estatísticas
  const stats = useMemo(() => {
    const total = filteredDetalhes.length;
    const sucessos = filteredDetalhes.filter(item => item.status === 'sucesso').length;
    const erros = filteredDetalhes.filter(item => item.status === 'erro').length;
    const percentualSucesso = total > 0 ? ((sucessos / total) * 100).toFixed(1) : '0';

    return { total, sucessos, erros, percentualSucesso };
  }, [filteredDetalhes]);

  const parseBackendDate = (dateString: string) => {
    if (!dateString) return null;
    const [year, month, day] = dateString.split('-');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  };

  const openModal = (item: DetalheFollowUp) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedItem(null);
    setIsModalOpen(false);
  };

  const DetailModal = ({ item, isOpen, onClose }: { item: DetalheFollowUp | null; isOpen: boolean; onClose: () => void }) => {
    if (!item) return null;

    const { date, time } = formatDateTime(item.horario);

    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Detalhes da Mensagem"
        size="2xl"
      >
        <div className="space-y-6">
          {/* Informações do Lead */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide flex items-center gap-2">
              <InformationCircleIcon className="h-4 w-4" />
              Informações do Lead
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Nome</label>
                <p className="text-sm font-medium text-gray-900 mt-1">{item.nome_lead}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Telefone</label>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm font-medium text-gray-900">{formatPhone(item.telefone_lead)}</p>
                  <button
                    onClick={() => copyPhone(item.telefone_lead)}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Copiar telefone"
                  >
                    <DocumentDuplicateIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Informações da Mensagem */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Detalhes da Mensagem</h4>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Data</label>
                  <p className="text-sm font-medium text-gray-900 mt-1">{date}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Horário</label>
                  <p className="text-sm font-medium text-gray-900 mt-1">{time}</p>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</label>
                  <div className="mt-1">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(item.status)}`}>
                      {getStatusText(item.status)}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Mensagem Enviada</label>
                <div className="mt-1 p-3 bg-white border border-gray-200 rounded-md">
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{item.mensagem_enviada}</p>
                </div>
              </div>
              {item.mensagem_erro && (
                <div>
                  <label className="text-xs font-medium text-red-500 uppercase tracking-wide">Mensagem de Erro</label>
                  <div className="mt-1 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-700 whitespace-pre-wrap">{ErrorHandler.handleError(item.mensagem_erro)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Fechar
          </button>
        </div>
      </Modal>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Erro ao carregar dados</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
            <div className="ml-auto">
              <button
                onClick={() => loadDetalhes()}
                className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Seção de Detalhes por Dia */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-primary text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CalendarIcon className="h-6 w-6 text-white" />
              <div>
                <h2 className="text-lg font-bold !text-white">Follow-up por Dia</h2>
                <p className="text-sm text-white/80">Detalhes das mensagens enviadas</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.back()}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium flex items-center gap-1.5 text-white"
              >
                <ChevronLeftIcon className="h-3.5 w-3.5 text-white" />
                Voltar
              </button>
              <button
                onClick={() => loadDetalhes()}
                disabled={loading}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium flex items-center gap-1.5 text-white"
              >
                <ArrowPathIcon className={`h-3.5 w-3.5 text-white ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="bg-secondary px-4 py-3 border-b">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">
                {stats.total}
              </div>
              <div className="text-sm text-gray-600">Total de Mensagens</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {stats.sucessos}
              </div>
              <div className="text-sm text-gray-600">Sucessos</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {stats.erros}
              </div>
              <div className="text-sm text-gray-600">Erros</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {stats.percentualSucesso}%
              </div>
              <div className="text-sm text-gray-600">Taxa de Sucesso</div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="p-3 bg-gray-50 border-b">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Campo de Data */}
            <div className="flex items-center gap-2">
              <div className="relative flex items-center">
                <DatePicker
                  selected={selectedDate && typeof selectedDate === 'string' ? parseBackendDate(selectedDate) : null}
                  onChange={(date: Date | null) => {
                    if (date) {
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      const day = String(date.getDate()).padStart(2, '0');
                      const formattedDate = `${year}-${month}-${day}`;
                      handleDateChange(formattedDate);
                    }
                  }}
                  dateFormat="dd/MM/yyyy"
                  locale="pt-BR"
                  placeholderText="dd/mm/aaaa"
                  className="border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm focus:ring-2 focus:ring-primary focus:border-transparent w-32"
                  wrapperClassName="relative"
                  showPopperArrow={false}
                  popperPlacement="bottom-start"
                />
                <CalendarIcon className="h-4 w-4 text-gray-400 absolute right-3 pointer-events-none" />
              </div>
            </div>

            {/* Filtro de Status */}
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">Todos os Status</option>
                <option value="sucesso">Sucesso</option>
                <option value="erro">Erro</option>
              </select>
            </div>

            {/* Barra de Busca */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" width={16} height={16} />
              <input
                type="text"
                placeholder="Buscar por nome, telefone, mensagem, status..."
                className="w-full pl-10 pr-4 py-2 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : filteredDetalhes.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center m-4">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">{searchTerm ? 'Nenhum resultado encontrado' : 'Nenhuma mensagem encontrada'}</h3>
            <p className="mt-1 text-sm text-gray-500">{searchTerm ? 'Tente ajustar os termos de busca.' : 'Não há mensagens para a data selecionada.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lead
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Telefone
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Horário
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mensagem
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Erro
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedData.map((item, index) => {
                  const { date, time } = formatDateTime(item.horario, true);
                  return (
                    <tr
                      key={`${item.id_lead}-${index}`}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => openModal(item)}
                      title="Clique para ver detalhes completos"
                    >
                      <td className="px-3 py-2 text-sm font-medium text-gray-900 max-w-xs">
                        <div className="truncate" title={item.nome_lead}>
                          {item.nome_lead}
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">
                        <div className="flex items-center gap-2">
                          <span>{formatPhone(item.telefone_lead)}</span>
                          {item.telefone_lead && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyPhone(item.telefone_lead);
                              }}
                              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                              title="Copiar telefone"
                            >
                              <DocumentDuplicateIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">
                        <div className="flex items-center gap-1">
                          <span>{time}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(item.status)}`}>
                          {getStatusText(item.status)}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-700 max-w-xs">
                        <div className="truncate" title={item.mensagem_enviada}>
                          {item.mensagem_enviada}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-700 max-w-xs">
                        {item.mensagem_erro ? (
                          <div className="truncate text-red-600" title={ErrorHandler.handleError(item.mensagem_erro)}>
                            {ErrorHandler.handleError(item.mensagem_erro)}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginação */}
        {filteredDetalhes.length > 0 && totalPages > 0 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6 text-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">
                  Mostrando {((currentPage - 1) * itemsPerPage) + 1} a{' '}
                  {Math.min(currentPage * itemsPerPage, filteredDetalhes.length)} de{' '}
                  {filteredDetalhes.length} resultados
                </span>
                <div className="flex items-center space-x-2 ml-4">
                  <span className="text-sm text-gray-700">Itens por página:</span>
                  <select
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                    value={itemsPerPage}
                    onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                  >
                    {itemsPerPageOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                  Anterior
                </button>

                {/* Números das páginas */}
                {totalPages > 1 && Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
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

                  // Verificação de segurança
                  if (pageNumber < 1 || pageNumber > totalPages) {
                    return null;
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
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  Próximo
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Detalhes */}
      <DetailModal
        item={selectedItem}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </div>
  );
};

export default PorDiaFollowUpManager;