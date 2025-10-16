'use client';

import React, { ReactNode } from 'react';

export interface TableColumn<T> {
  key: string;
  header: string;
  width?: string; // ex: 'w-8', 'w-16', 'min-w-[120px]'
  align?: 'left' | 'center' | 'right';
  render?: (item: T, index: number) => ReactNode;
  sortable?: boolean;
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  keyExtractor: (item: T, index: number) => string;
  onRowClick?: (item: T) => void;
  selectable?: boolean;
  selectedItems?: Set<string>;
  onSelectItem?: (key: string) => void;
  onSelectAll?: () => void;
  loading?: boolean;
  emptyMessage?: string;
  compact?: boolean; // Modo compacto (menor espaçamento)
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  selectable = false,
  selectedItems = new Set(),
  onSelectItem,
  onSelectAll,
  loading = false,
  emptyMessage = 'Nenhum item encontrado',
  compact = true,
}: TableProps<T>) {
  const paddingClass = compact ? 'px-2 py-2' : 'px-3 py-3';
  const textSizeClass = compact ? 'text-xs' : 'text-sm';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-gray-500 text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full table-auto">
        <thead className="bg-gray-50">
          <tr>
            {selectable && (
              <th className={`${paddingClass} text-left ${textSizeClass} font-medium text-gray-500 uppercase w-8`}>
                <input
                  type="checkbox"
                  checked={data.length > 0 && selectedItems.size === data.length}
                  onChange={onSelectAll}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
              </th>
            )}
            {columns.map((column) => (
              <th
                key={column.key}
                className={`${paddingClass} text-${column.align || 'left'} ${textSizeClass} font-medium text-gray-500 uppercase ${column.width || ''}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((item, index) => {
            const itemKey = keyExtractor(item, index);
            const isSelected = selectedItems.has(itemKey);

            return (
              <tr
                key={itemKey}
                onClick={() => onRowClick?.(item)}
                className={`hover:bg-gray-50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
              >
                {selectable && (
                  <td className={`${paddingClass} whitespace-nowrap`}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onSelectItem?.(itemKey)}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  </td>
                )}
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`${paddingClass} whitespace-nowrap ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left'}`}
                  >
                    {column.render ? (
                      column.render(item, index)
                    ) : (
                      <span className={textSizeClass}>
                        {(item as any)[column.key] || '-'}
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Componentes auxiliares para uso comum em tabelas

export const TableBadge: React.FC<{
  children: ReactNode;
  variant?: 'blue' | 'green' | 'purple' | 'red' | 'yellow' | 'gray';
  compact?: boolean;
}> = ({ children, variant = 'blue', compact = true }) => {
  const colors = {
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    purple: 'bg-purple-100 text-purple-800',
    red: 'bg-red-100 text-red-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    gray: 'bg-gray-100 text-gray-600',
  };

  const paddingClass = compact ? 'px-1.5 py-0.5' : 'px-2.5 py-0.5';

  return (
    <span className={`inline-flex items-center ${paddingClass} rounded text-xs font-medium ${colors[variant]}`}>
      {children}
    </span>
  );
};

export const TableToggle: React.FC<{
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  color?: string;
  compact?: boolean;
  title?: string;
}> = ({ checked, onChange, disabled = false, color = 'bg-primary', compact = true, title }) => {
  const sizeClass = compact ? 'h-4 w-8' : 'h-5 w-9';
  const ballSizeClass = compact ? 'h-2.5 w-2.5' : 'h-3 w-3';
  const translateClass = compact
    ? checked ? 'translate-x-4' : 'translate-x-0.5'
    : checked ? 'translate-x-5' : 'translate-x-1';

  return (
    <button
      onClick={onChange}
      disabled={disabled}
      title={title}
      className={`relative inline-flex ${sizeClass} items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
        checked ? color : 'bg-gray-300'
      }`}
    >
      <span className={`inline-block ${ballSizeClass} transform rounded-full bg-white transition-transform ${translateClass}`} />
    </button>
  );
};

export const TableActionButton: React.FC<{
  onClick: () => void;
  icon: ReactNode;
  title?: string;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'default' | 'danger' | 'primary';
}> = ({ onClick, icon, title, disabled = false, loading = false, variant = 'default' }) => {
  const variantClasses = {
    default: 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-primary',
    danger: 'border-red-300 text-red-700 bg-white hover:bg-red-50 focus:ring-red-500',
    primary: 'border-primary text-primary bg-white hover:bg-primary/10 focus:ring-primary',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      title={title}
      className={`inline-flex items-center px-3 py-1.5 border text-xs font-medium rounded focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${variantClasses[variant]}`}
    >
      {loading ? (
        <div className="w-4 h-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      ) : (
        icon
      )}
    </button>
  );
};

export const TableText: React.FC<{
  children: ReactNode;
  truncate?: boolean;
  maxWidth?: string;
  title?: string;
  compact?: boolean;
}> = ({ children, truncate = false, maxWidth, title, compact = true }) => {
  const textSizeClass = compact ? 'text-xs' : 'text-sm';

  if (truncate) {
    return (
      <div className={maxWidth || 'max-w-[200px]'}>
        <div className={`${textSizeClass} text-gray-900 truncate`} title={title || String(children)}>
          {children}
        </div>
      </div>
    );
  }

  return <span className={`${textSizeClass} text-gray-900`}>{children}</span>;
};

export default Table;
