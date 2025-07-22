'use client';

import React, { useState, useMemo } from 'react';
import {
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { Search } from 'lucide-react';

export interface Column<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface Action<T> {
  label: string;
  icon?: React.ReactNode;
  onClick: (row: T, index: number) => void;
  className?: string;
  show?: (row: T) => boolean;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  actions?: Action<T>[];
  searchable?: boolean;
  searchPlaceholder?: string;
  searchFields?: (keyof T)[];
  sortable?: boolean;
  paginated?: boolean;
  itemsPerPageOptions?: number[];
  defaultItemsPerPage?: number;
  loading?: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  className?: string;
  headerClassName?: string;
  rowClassName?: string | ((row: T, index: number) => string);
  onRowClick?: (row: T, index: number) => void;
}

function DataTable<T extends Record<string, any>>({
  data,
  columns,
  actions = [],
  searchable = true,
  searchPlaceholder = "Buscar...",
  searchFields,
  sortable = true,
  paginated = true,
  itemsPerPageOptions = [5, 10, 20, 50],
  defaultItemsPerPage = 10,
  loading = false,
  emptyMessage = "Nenhum item encontrado",
  emptyIcon,
  className = "",
  headerClassName = "",
  rowClassName = "",
  onRowClick,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T | string;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultItemsPerPage);

  // Função para obter valor aninhado
  const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  // Filtrar dados baseado na busca
  const filteredData = useMemo(() => {
    if (!searchable || !searchTerm) return data;

    return data.filter((item) => {
      const fieldsToSearch = searchFields || Object.keys(item) as (keyof T)[];
      
      return fieldsToSearch.some((field) => {
        const value = getNestedValue(item, field as string);
        return value?.toString().toLowerCase().includes(searchTerm.toLowerCase());
      });
    });
  }, [data, searchTerm, searchFields, searchable]);

  // Ordenar dados
  const sortedData = useMemo(() => {
    if (!sortable || !sortConfig) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = getNestedValue(a, sortConfig.key as string);
      const bValue = getNestedValue(b, sortConfig.key as string);

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredData, sortConfig, sortable]);

  // Paginação
  const paginatedData = useMemo(() => {
    if (!paginated) return sortedData;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, itemsPerPage, paginated]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  // Função para ordenação
  const handleSort = (key: keyof T | string) => {
    if (!sortable) return;

    setSortConfig((current) => {
      if (current?.key === key) {
        return {
          key,
          direction: current.direction === 'asc' ? 'desc' : 'asc',
        };
      }
      return { key, direction: 'asc' };
    });
  };

  // Função para mudança de página
  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Função para mudança de itens por página
  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  // Renderizar célula
  const renderCell = (column: Column<T>, row: T, index: number) => {
    if (column.render) {
      return column.render(getNestedValue(row, column.key as string), row, index);
    }

    const value = getNestedValue(row, column.key as string);
    if (value === null || value === undefined) return '-';
    return value.toString();
  };

  // Renderizar ações
  const renderActions = (row: T, index: number) => {
    const visibleActions = actions.filter(action => 
      !action.show || action.show(row)
    );

    if (visibleActions.length === 0) return null;

    return (
      <div className="flex items-center gap-1">
        {visibleActions.map((action, actionIndex) => (
          <button
            key={actionIndex}
            onClick={(e) => {
              e.stopPropagation();
              action.onClick(row, index);
            }}
            className={`p-1 rounded transition-colors ${
              action.className || 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
            title={action.label}
          >
            {action.icon}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${className}`}>
      {/* Barra de Busca */}
      {searchable && (
        <div className="p-3 bg-gray-50 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" width={16} height={16} />
            <input
              type="text"
              placeholder={searchPlaceholder}
              className="w-full pl-10 pr-4 py-2 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Tabela */}
      {loading ? (
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-gray-500 mt-2">Carregando...</p>
        </div>
      ) : paginatedData.length > 0 ? (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`bg-gray-50 ${headerClassName}`}>
                <tr>
                  {columns.map((column, index) => (
                    <th
                      key={index}
                      className={`px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                        column.sortable !== false && sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                      } ${
                        column.align === 'center' ? 'text-center' :
                        column.align === 'right' ? 'text-right' : 'text-left'
                      }`}
                      style={{ width: column.width }}
                      onClick={() => column.sortable !== false && handleSort(column.key)}
                    >
                      <div className="flex items-center gap-1">
                        {column.label}
                        {column.sortable !== false && sortable && sortConfig?.key === column.key && (
                          sortConfig.direction === 'asc' ? (
                            <ChevronUpIcon className="h-3 w-3" />
                          ) : (
                            <ChevronDownIcon className="h-3 w-3" />
                          )
                        )}
                      </div>
                    </th>
                  ))}
                  {actions.length > 0 && (
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedData.map((row, rowIndex) => {
                  const rowClass = typeof rowClassName === 'function' 
                    ? rowClassName(row, rowIndex) 
                    : rowClassName;
                  
                  return (
                    <tr
                      key={rowIndex}
                      className={`hover:bg-gray-50 ${
                        onRowClick ? 'cursor-pointer' : ''
                      } ${rowClass}`}
                      onClick={() => onRowClick?.(row, rowIndex)}
                    >
                      {columns.map((column, colIndex) => (
                        <td
                          key={colIndex}
                          className={`px-3 py-2 whitespace-nowrap text-sm text-gray-700 ${
                            column.align === 'center' ? 'text-center' :
                            column.align === 'right' ? 'text-right' : 'text-left'
                          }`}
                        >
                          {renderCell(column, row, rowIndex)}
                        </td>
                      ))}
                      {actions.length > 0 && (
                        <td className="px-3 py-2 whitespace-nowrap text-sm">
                          {renderActions(row, rowIndex)}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {paginated && sortedData.length > 0 && (
            <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6 text-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">
                    Mostrando {((currentPage - 1) * itemsPerPage) + 1} a{' '}
                    {Math.min(currentPage * itemsPerPage, sortedData.length)} de{' '}
                    {sortedData.length} resultados
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
                        className={`px-3 py-1 text-sm border rounded-md ${
                          currentPage === pageNumber
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
        </>
      ) : (
        <div className="p-8 text-center">
          {emptyIcon && <div className="mx-auto mb-4">{emptyIcon}</div>}
          <h3 className="text-base font-medium text-gray-900 mb-2">
            {searchTerm ? 'Nenhum resultado encontrado' : emptyMessage}
          </h3>
          <p className="text-gray-500 mb-4 text-sm">
            {searchTerm
              ? 'Tente ajustar os termos de busca ou limpar o filtro.'
              : 'Não há itens para exibir no momento.'}
          </p>
          {searchTerm && (
            <button
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
              onClick={() => setSearchTerm('')}
            >
              Limpar Filtro
            </button>
          )}
        </div>
      )}

      {/* Informações de Filtro */}
      {searchTerm && sortedData.length > 0 && (
        <div className="bg-secondary px-4 py-2 border-t">
          <div className="text-center">
            <p className="text-xs text-gray-600">
              Mostrando {sortedData.length} de {data.length} itens para "{searchTerm}"
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;