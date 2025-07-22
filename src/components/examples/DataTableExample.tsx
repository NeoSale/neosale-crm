'use client';

import React from 'react';
import DataTable, { Column, Action } from '../DataTable';
import {
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PhoneIcon,
} from '@heroicons/react/24/outline';

// Exemplo de interface para Lead
interface Lead {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  status: 'novo' | 'contatado' | 'qualificado' | 'perdido';
  origem: string;
  data_criacao: string;
  valor_potencial?: number;
}

// Dados de exemplo
const sampleLeads: Lead[] = [
  {
    id: 1,
    nome: 'João Silva',
    email: 'joao@email.com',
    telefone: '(11) 99999-9999',
    status: 'novo',
    origem: 'Website',
    data_criacao: '2024-01-15',
    valor_potencial: 5000,
  },
  {
    id: 2,
    nome: 'Maria Santos',
    email: 'maria@email.com',
    telefone: '(11) 88888-8888',
    status: 'contatado',
    origem: 'Facebook',
    data_criacao: '2024-01-14',
    valor_potencial: 3000,
  },
  // Adicione mais dados conforme necessário
];

const DataTableExample: React.FC = () => {
  // Definir colunas da tabela
  const columns: Column<Lead>[] = [
    {
      key: 'nome',
      label: 'Nome',
      sortable: true,
      width: '200px',
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      width: '250px',
    },
    {
      key: 'telefone',
      label: 'Telefone',
      sortable: false,
      width: '150px',
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      width: '120px',
      render: (value: string) => {
        const statusColors = {
          novo: 'bg-blue-100 text-blue-800',
          contatado: 'bg-yellow-100 text-yellow-800',
          qualificado: 'bg-green-100 text-green-800',
          perdido: 'bg-red-100 text-red-800',
        };
        
        return (
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            statusColors[value as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'
          }`}>
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </span>
        );
      },
    },
    {
      key: 'origem',
      label: 'Origem',
      sortable: true,
      width: '120px',
    },
    {
      key: 'data_criacao',
      label: 'Data Criação',
      sortable: true,
      width: '120px',
      render: (value: string) => {
        const date = new Date(value);
        return date.toLocaleDateString('pt-BR');
      },
    },
    {
      key: 'valor_potencial',
      label: 'Valor Potencial',
      sortable: true,
      width: '150px',
      align: 'right',
      render: (value: number) => {
        if (!value) return '-';
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(value);
      },
    },
  ];

  // Definir ações da tabela
  const actions: Action<Lead>[] = [
    {
      label: 'Visualizar',
      icon: <EyeIcon className="h-4 w-4" />,
      onClick: (lead) => {
        console.log('Visualizar lead:', lead);
        // Implementar lógica de visualização
      },
      className: 'text-blue-600 hover:text-blue-800 hover:bg-blue-100',
    },
    {
      label: 'Editar',
      icon: <PencilIcon className="h-4 w-4" />,
      onClick: (lead) => {
        console.log('Editar lead:', lead);
        // Implementar lógica de edição
      },
      className: 'text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100',
    },
    {
      label: 'Ligar',
      icon: <PhoneIcon className="h-4 w-4" />,
      onClick: (lead) => {
        console.log('Ligar para lead:', lead);
        // Implementar lógica de ligação
      },
      className: 'text-green-600 hover:text-green-800 hover:bg-green-100',
      show: (lead) => lead.telefone !== '', // Só mostra se tiver telefone
    },
    {
      label: 'Excluir',
      icon: <TrashIcon className="h-4 w-4" />,
      onClick: (lead) => {
        console.log('Excluir lead:', lead);
        // Implementar lógica de exclusão
      },
      className: 'text-red-600 hover:text-red-800 hover:bg-red-100',
    },
  ];

  const handleRowClick = (lead: Lead) => {
    console.log('Linha clicada:', lead);
    // Implementar ação ao clicar na linha
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Exemplo de DataTable</h1>
      
      <DataTable<Lead>
        data={sampleLeads}
        columns={columns}
        actions={actions}
        searchable={true}
        searchPlaceholder="Buscar leads por nome, email, telefone..."
        searchFields={['nome', 'email', 'telefone', 'origem']}
        sortable={true}
        paginated={true}
        itemsPerPageOptions={[5, 10, 20, 50]}
        defaultItemsPerPage={10}
        loading={false}
        emptyMessage="Nenhum lead encontrado"
        emptyIcon={<PhoneIcon className="h-12 w-12 text-gray-400" />}
        onRowClick={handleRowClick}
        className=""
        headerClassName=""
        rowClassName={(lead) => lead.status === 'perdido' ? 'opacity-60' : ''}
      />
    </div>
  );
};

export default DataTableExample;