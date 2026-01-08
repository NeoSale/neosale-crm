'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    ArrowPathIcon,
    BuildingOfficeIcon,
} from '@heroicons/react/24/outline';
import { Search } from 'lucide-react';
import {
    baseApi,
    Base,
} from '../services/baseApi';

import Modal from './Modal';
import ConfirmModal from './ConfirmModal';
import { clientesApi, Cliente } from '@/services/clientesApi';
import { Table, TableColumn, TableActionButton, TableText } from './Table';
import { useCliente } from '@/contexts/ClienteContext';

const BaseManager: React.FC = () => {
    const { selectedClienteId } = useCliente();
    const [bases, setBases] = useState<Base[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingBase, setEditingBase] = useState<Base | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; id: string | null }>({ show: false, id: null });
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [clientes, setClientes] = useState<Cliente[]>([]);

    // Estado local para o formulário
    const [localFormData, setLocalFormData] = useState<Base>({
        id: '',
        nome: '',
        descricao: '',
        cliente_id: '',
    });

    useEffect(() => {
        loadBases();
        loadClientes();
    }, []);

    const loadBases = async (showLoadingState = true) => {
        if (!selectedClienteId) return;
        
        if (showLoadingState) {
            setLoading(true);
        }
        try {
            const response = await baseApi.getBases(undefined, selectedClienteId);
            if (response.success && response.data) {
                const sortedBases = [...response.data.bases].sort((a, b) => {
                    const dateA = a.created_at || '';
                    const dateB = b.created_at || '';
                    return dateB.localeCompare(dateA); // Mais recentes primeiro
                });
                setBases(sortedBases);
            }
        } catch (error) {
            console.error('Erro ao carregar bases:', error);
        } finally {
            if (showLoadingState) {
                setLoading(false);
            }
        }
    };

    const loadClientes = async () => {
        try {
            const response = await clientesApi.getClientes();
            if (response.success && response.data) {
                setClientes(Array.isArray(response.data) ? response.data : []);
            }
        } catch (error) {
            console.error('Erro ao carregar clientes:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validações obrigatórias
        if (!localFormData.nome?.trim()) {
            toast.error('Por favor, informe o nome da base.');
            return;
        }

        setSubmitting(true);

        try {
            if (editingBase) {
                await baseApi.updateBase(editingBase.id!, {
                    nome: localFormData.nome,
                    descricao: localFormData.descricao,
                    cliente_id: localFormData.cliente_id
                }, localFormData.cliente_id);
                toast.success('Base atualizada com sucesso!');
            } else {
                await baseApi.createBase({
                    nome: localFormData.nome,
                    descricao: localFormData.descricao,
                    cliente_id: localFormData.cliente_id
                }, localFormData.cliente_id);
                toast.success('Base criada com sucesso!');
            }
            loadBases(false);
            resetForm();
        } catch (error) {
            console.error('Erro ao salvar base:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (base: Base) => {
        setLocalFormData({
            nome: base.nome,
            descricao: base.descricao || '',
            cliente_id: base.cliente_id,
        });
        setEditingBase(base);
        setShowModal(true);
    };

    const handleDelete = (id: string) => {
        setDeleteConfirm({ show: true, id });
    };

    const confirmDelete = async () => {
        if (deleteConfirm.id && selectedClienteId) {
            try {
                await baseApi.deleteBase(deleteConfirm.id, selectedClienteId);
                toast.success('Base deletada com sucesso!');
                loadBases(false);
                setDeleteConfirm({ show: false, id: null });
            } catch (error) {
                console.error('Erro ao deletar base:', error);
            }
        }
    };

    const cancelDelete = () => {
        setDeleteConfirm({ show: false, id: null });
    };

    const resetForm = () => {
        setLocalFormData({
            nome: '',
            descricao: '',
            cliente_id: '',
        });
        setEditingBase(null);
        setShowModal(false);
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return 'Data inválida';
        }
    };

    // Filtrar bases baseado no termo de busca
    const filteredBases = bases.filter(base =>
        base.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        base.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        base.cliente_id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Paginação
    const totalPages = Math.ceil(filteredBases.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentBases = filteredBases.slice(startIndex, startIndex + itemsPerPage);

    // Resetar página quando filtro mudar
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const getClienteNome = (clienteId: string) => {
        const cliente = clientes.find(c => c.id === clienteId);
        return cliente?.nome || 'Cliente não encontrado';
    };

    return (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : (
                <>
                    {/* Cabeçalho */}
                    <div className="bg-gradient-to-r from-primary to-primary-dark">
                        <div className="px-6 py-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-xl font-semibold text-white">Gerenciamento de Bases</h1>
                                    <p className="text-white/80 text-sm mt-1">
                                        Gerencie as bases de dados do sistema
                                    </p>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <button
                                        onClick={() => loadBases()}
                                        className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium flex items-center gap-1.5 text-white"
                                    >
                                        <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                                        Atualizar
                                    </button>
                                    <button
                                        onClick={() => {
                                            resetForm();
                                            setShowModal(true);
                                        }}
                                        className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium flex items-center gap-1.5 text-white"
                                    >
                                        <PlusIcon className="h-4 w-4" />
                                        Nova Base
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Estatísticas */}
                    {bases.length > 0 && (
                        <div className="p-6 border-b border-gray-200">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <div className="text-2xl font-bold text-blue-600">
                                        {bases.length}
                                    </div>
                                    <div className="text-sm text-gray-600">Total de Bases</div>
                                </div>
                                <div className="bg-green-50 p-4 rounded-lg">
                                    <div className="text-2xl font-bold text-green-600">
                                        {new Set(bases.map(b => b.cliente_id)).size}
                                    </div>
                                    <div className="text-sm text-gray-600">Clientes Únicos</div>
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
                                placeholder="Buscar bases..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Tabela de Bases */}
                    <div className="overflow-x-auto">
                        {currentBases.length === 0 ? (
                            <div className="text-center py-12">
                                <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">
                                    {searchTerm ? 'Nenhuma base encontrada' : 'Nenhuma base cadastrada'}
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    {searchTerm ? 'Tente ajustar os filtros de busca.' : 'Comece criando sua primeira base.'}
                                </p>
                                {!searchTerm && (
                                    <div className="mt-6">
                                        <button
                                            onClick={() => {
                                                resetForm();
                                                setShowModal(true);
                                            }}
                                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90"
                                        >
                                            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                                            Nova Base
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Table
                                columns={[
                                    {
                                        key: 'nome',
                                        header: 'Nome',
                                        render: (base) => <TableText>{base.nome}</TableText>,
                                    },
                                    {
                                        key: 'descricao',
                                        header: 'Descrição',
                                        render: (base) => (
                                            <TableText truncate maxWidth="max-w-xs">
                                                {base.descricao || 'Sem descrição'}
                                            </TableText>
                                        ),
                                    },
                                    {
                                        key: 'cliente',
                                        header: 'Cliente',
                                        render: (base) => <TableText>{getClienteNome(base.cliente_id)}</TableText>,
                                    },
                                    {
                                        key: 'created_at',
                                        header: 'Criado em',
                                        render: (base) => (
                                            <TableText>
                                                <span className="text-gray-500">{formatDate(base.created_at || '')}</span>
                                            </TableText>
                                        ),
                                    },
                                    {
                                        key: 'acoes',
                                        header: 'Ações',
                                        width: 'w-20',
                                        align: 'right',
                                        render: (base) => (
                                            <div className="flex items-center gap-0.5 justify-end">
                                                <TableActionButton
                                                    onClick={() => handleEdit(base)}
                                                    icon={<PencilIcon className="h-4 w-4" />}
                                                    title="Editar base"
                                                />
                                                <button
                                                    onClick={() => handleDelete(base.id!)}
                                                    className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                                    title="Deletar base"
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ),
                                    },
                                ]}
                                data={currentBases}
                                keyExtractor={(base, index) => base.id || `base-${index}`}
                                emptyMessage="Nenhuma base encontrada"
                                compact
                            />
                        )}
                    </div>

                    {/* Paginação */}
                    {totalPages > 1 && (
                        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-700">
                                    Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredBases.length)} de {filteredBases.length} resultados
                                </span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                >
                                    Anterior
                                </button>
                                <span className="text-sm text-gray-700">
                                    Página {currentPage} de {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                >
                                    Próxima
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Modal de Formulário */}
            <Modal
                isOpen={showModal}
                onClose={resetForm}
                title={editingBase ? 'Editar Base' : 'Nova Base'}
                size="md"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Nome */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nome da Base *
                        </label>
                        <input
                            type="text"
                            value={localFormData.nome || ''}
                            onChange={(e) => setLocalFormData({ ...localFormData, nome: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                            placeholder="Digite o nome da base"
                            required
                        />
                    </div>

                    {/* Descrição */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Descrição
                        </label>
                        <textarea
                            value={localFormData.descricao || ''}
                            onChange={(e) => setLocalFormData({ ...localFormData, descricao: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm h-24"
                            placeholder="Digite uma descrição para a base (opcional)"
                        />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={resetForm}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className={`px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md flex items-center justify-center space-x-2 ${
                                submitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary'
                            }`}
                        >
                            {submitting && (
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            )}
                            <span>
                                {submitting
                                    ? (editingBase ? 'Atualizando...' : 'Criando...')
                                    : (editingBase ? 'Atualizar' : 'Criar Base')
                                }
                            </span>
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Modal de Confirmação de Exclusão */}
            <ConfirmModal
                isOpen={deleteConfirm.show}
                onClose={cancelDelete}
                onConfirm={confirmDelete}
                title="Confirmar Exclusão"
                message="Tem certeza que deseja deletar esta base? Esta ação não pode ser desfeita."
                confirmText="Deletar"
                cancelText="Cancelar"
                type="danger"
            />
        </div>
    );
};

export default BaseManager;