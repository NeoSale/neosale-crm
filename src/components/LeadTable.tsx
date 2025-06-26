'use client';

import React from 'react';
import { Users, Eye } from 'lucide-react';

interface Lead {
  [key: string]: any;
}

interface LeadTableProps {
  leads: Lead[];
}

const LeadTable: React.FC<LeadTableProps> = ({ leads }) => {
  if (leads.length === 0) {
    return null;
  }

  // Pega as chaves do primeiro objeto para usar como cabeçalhos
  const headers = Object.keys(leads[0]);
  
  // Limita a exibição a 10 leads para preview
  const previewLeads = leads.slice(0, 10);
  const hasMoreLeads = leads.length > 10;

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="bg-primary text-white p-6">
        <div className="flex items-center gap-3">
          <Users size={24} />
          <div>
            <h2 className="text-xl font-bold">Preview dos Leads</h2>
            <p className="text-primary-100 text-sm">
              {leads.length} leads encontrados
              {hasMoreLeads && ` (mostrando os primeiros 10)`}
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {headers.map((header, index) => (
                <th
                  key={index}
                  className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {previewLeads.map((lead, rowIndex) => (
              <tr
                key={rowIndex}
                className="hover:bg-gray-50 transition-colors"
              >
                {headers.map((header, colIndex) => (
                  <td
                    key={colIndex}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                  >
                    {lead[header] || '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasMoreLeads && (
        <div className="bg-gray-50 px-6 py-4 border-t">
          <div className="flex items-center justify-center gap-2 text-gray-600">
            <Eye size={16} />
            <span className="text-sm">
              E mais {leads.length - 10} leads...
            </span>
          </div>
        </div>
      )}

      <div className="bg-secondary px-6 py-4 border-t">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-primary">{leads.length}</div>
            <div className="text-sm text-gray-600">Total de Leads</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">{headers.length}</div>
            <div className="text-sm text-gray-600">Campos Detectados</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {leads.filter(lead => 
                Object.values(lead).some(value => 
                  typeof value === 'string' && 
                  value.includes('@')
                )
              ).length}
            </div>
            <div className="text-sm text-gray-600">Com Email</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadTable;