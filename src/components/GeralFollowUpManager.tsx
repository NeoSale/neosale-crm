'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { followupApi, EstatisticasPorDia } from '../services/followupApi';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowPathIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { Search } from 'lucide-react';

const GeralFollowUpManager: React.FC = () => {
  const router = useRouter();
  const [estatisticas, setEstatisticas] = useState<EstatisticasPorDia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const itemsPerPageOptions = [5, 10, 20, 50];

  useEffect(() => {
    loadEstatisticas();
  }, []);

  const loadEstatisticas = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await followupApi.getEstatisticasPorDia();

      if (response.success) {
        setEstatisticas(response.data);
      } else {
        throw new Error('Erro ao carregar estatísticas');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      // O toast já é exibido pela API service, não precisamos duplicar
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    // Evitar problemas de timezone ao criar a data
    const [year, month, day] = dateString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const calculatePercentage = (sucesso: number, total: number) => {
    if (total === 0) return 0;
    return ((sucesso / total) * 100).toFixed(1);
  };

  // Filtrar estatísticas baseado no termo de busca
  const filteredEstatisticas = useMemo(() => {
    if (!searchTerm) return estatisticas;
    return estatisticas.filter(item => {
      const dateStr = formatDate(item.data);
      return dateStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.qtd_sucesso.toString().includes(searchTerm) ||
        item.qtd_erro.toString().includes(searchTerm) ||
        item.total.toString().includes(searchTerm);
    });
  }, [estatisticas, searchTerm]);

  // Reset da página quando o termo de busca muda
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Paginação
  const totalPages = Math.ceil(filteredEstatisticas.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredEstatisticas.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredEstatisticas, currentPage, itemsPerPage]);

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

  if (loading && estatisticas.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
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
                onClick={loadEstatisticas}
                className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Seção de Relatórios */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-primary text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ChartBarIcon className="h-6 w-6 text-white" />
              <div>
                <h2 className="text-lg font-bold !text-white">Relatórios de Follow-up</h2>
                <p className="text-sm text-white/80">Estatísticas de follow-up por dia</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadEstatisticas}
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
        {estatisticas.length > 0 && (
          <div className="bg-secondary px-4 py-3 border-b">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">
                  {estatisticas.length.toLocaleString('pt-BR')}
                </div>
                <div className="text-sm text-gray-600">Total de Dias</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {estatisticas.reduce((acc, item) => acc + item.qtd_sucesso, 0).toLocaleString('pt-BR')}
                </div>
                <div className="text-sm text-gray-600">Total Sucessos</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {estatisticas.reduce((acc, item) => acc + item.qtd_erro, 0).toLocaleString('pt-BR')}
                </div>
                <div className="text-sm text-gray-600">Total Erros</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {estatisticas.reduce((acc, item) => acc + item.total, 0).toLocaleString('pt-BR')}
                </div>
                <div className="text-sm text-gray-600">Total Geral</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {(() => {
                    const totalSucesso = estatisticas.reduce((acc, item) => acc + item.qtd_sucesso, 0);
                    const totalGeral = estatisticas.reduce((acc, item) => acc + item.total, 0);
                    const taxa = totalGeral > 0 ? ((totalSucesso / totalGeral) * 100) : 0;
                    return taxa.toFixed(1) + '%';
                  })()}
                </div>
                <div className="text-sm text-gray-600">Taxa de Sucesso</div>
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
              placeholder="Buscar por data, sucessos, erros ou total..."
              className="w-full pl-10 pr-4 py-2 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {filteredEstatisticas.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center m-4">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">{searchTerm ? 'Nenhum resultado encontrado' : 'Nenhum dado encontrado'}</h3>
            <p className="mt-1 text-sm text-gray-500">{searchTerm ? 'Tente ajustar os termos de busca.' : 'Não há estatísticas de follow-up disponíveis.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sucessos
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Erros
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Taxa de Sucesso
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedData.map((item, index) => (
                  <tr 
                    key={index} 
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/followup/relatorio/por-dia?data=${item.data}`)}
                    title="Clique para ver detalhes do dia"
                  >
                    <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatDate(item.data)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {item.qtd_sucesso}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {item.qtd_erro}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {item.total}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">
                      <div className="flex items-center">
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>{calculatePercentage(item.qtd_sucesso, item.total)}%</span>
                          </div>
                          <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${calculatePercentage(item.qtd_sucesso, item.total)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginação */}
        {filteredEstatisticas.length > 0 && totalPages > 0 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6 text-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">
                  Mostrando {((currentPage - 1) * itemsPerPage) + 1} a{' '}
                  {Math.min(currentPage * itemsPerPage, filteredEstatisticas.length)} de{' '}
                  {filteredEstatisticas.length} resultados
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

    </div>
  );
};

export default GeralFollowUpManager;