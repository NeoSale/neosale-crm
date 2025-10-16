'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { Search, Database } from 'lucide-react';
import { baseApi, Base } from '../services/baseApi';
import Modal from './Modal';
import ConfirmModal from './ConfirmModal';
import { Table, TableColumn, TableText, TableActionButton } from './Table';

const BaseConhecimento: React.FC = () => {
    const [bases, setBases] = useState<Base[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [loadingBases, setLoadingBases] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingBase, setEditingBase] = useState<Base | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; id: string | null }>({ show: false, id: null });
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    const [formData, setFormData] = useState<Partial<Base>>({
        nome: '',
        descricao: '',
    });

    useEffect(() => {
        loadBases();
    }, [currentPage, itemsPerPage, searchTerm]);

    const loadBases = async (showLoadingState = true) => {
        if (showLoadingState) {
            setLoading(true);
        } else {
            setLoadingBases(true);
        }
        try {
            const response = await baseApi.getBases({
                page: currentPage,
                limit: itemsPerPage,
                search: searchTerm || undefined,
            });
            
            if (response.success && response.data) {
                setBases(response.data.bases || []);
                if (response.data.pagination) {
                    setTotalPages(response.data.pagination.totalPages);
                    setTotalItems(response.data.pagination.total);
                }
            }
        } catch (error) {
            console.error('Erro ao carregar bases:', error);
        } finally {
            if (showLoadingState) {
                setLoading(false);
            } else {
                setLoadingBases(false);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.nome) {
            toast.error('Por favor, preencha o nome da base.');
            return;
        }

        setSubmitting(true);

        try {
            if (editingBase?.id) {
                await baseApi.updateBase(editingBase.id, formData);
            } else {
                await baseApi.createBase(formData as Omit<Base, 'id'>);
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
        setFormData({
            nome: base.nome,
            descricao: base.descricao,
        });
        setEditingBase(base);
        setShowModal(true);
    };

    const handleDelete = (id: string) => {
        setDeleteConfirm({ show: true, id });
    };

    const confirmDelete = async () => {
        if (deleteConfirm.id) {
            try {
                await baseApi.deleteBase(deleteConfirm.id);
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
        setFormData({
            nome: '',
            descricao: '',
        });
        setEditingBase(null);
        setShowModal(false);
    };

    // Definição das colunas da tabela
    const columns: TableColumn<Base>[] = [
        {
            key: 'nome',
            header: 'Nome',
            render: (base) => <TableText>{base.nome}</TableText>,
        },
        {
            key: 'descricao',
            header: 'Descrição',
            render: (base) => <TableText truncate maxWidth="max-w-md">{base.descricao || '-'}</TableText>,
        },
        {
            key: 'created_at',
            header: 'Criado em',
            render: (base) => <TableText>{formatDate(base.created_at)}</TableText>,
        },
        {
            key: 'acoes',
            header: 'Ações',
            render: (base) => (
                <div className="flex items-center space-x-2">
                    <TableActionButton
                        onClick={() => handleEdit(base)}
                        icon={<PencilIcon className="h-4 w-4" />}
                        title="Editar"
                        variant="primary"
                    />
                    <TableActionButton
                        onClick={() => handleDelete(base.id!)}
                        icon={<TrashIcon className="h-4 w-4" />}
                        title="Excluir"
                        variant="danger"
                    />
                </div>
            ),
        },
    ];

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading && bases.length === 0) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-primary text-white p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Database className="h-8 w-8 text-white" />
                            <div>
                                <h2 className="text-lg font-bold text-white !text-white">Base de Conhecimento</h2>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => loadBases(false)}
                                disabled={loading || loadingBases}
                                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium flex items-center gap-1.5 text-white"
                            >
                                <ArrowPathIcon className={`h-4 w-4 ${(loading || loadingBases) ? 'animate-spin' : ''}`} />
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

                {/* Estatísticas */}
                {/* {bases.length > 0 && (
                    <div className="p-6 border-b border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <div className="text-2xl font-bold text-blue-600">
                                    {totalItems}
                                </div>
                                <div className="text-sm text-gray-600">Total de Bases</div>
                            </div>
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <div className="text-2xl font-bold text-blue-600">
                                    {bases.length}
                                </div>
                                <div className="text-sm text-gray-600">Nesta Página</div>
                            </div>
                        </div>
                    </div>
                )} */}

                {/* Barra de Busca */}
                <div className="p-3 bg-gray-50 border-b">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" width={16} height={16} />
                        <input
                            type="text"
                            placeholder="Buscar bases..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Tabela de Bases */}
                <div className="overflow-x-auto relative">
                    {loadingBases && (
                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                            <div className="flex items-center space-x-2">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                <span className="text-sm text-gray-600">Atualizando bases...</span>
                            </div>
                        </div>
                    )}
                    {bases.length === 0 ? (
                        <div className="text-center py-12">
                            <Database className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">
                                {searchTerm ? 'Nenhuma base encontrada' : 'Nenhuma base cadastrada'}
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                {searchTerm ? 'Tente ajustar os filtros de busca.' : 'Comece criando sua primeira base de conhecimento.'}
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
                            columns={columns}
                            data={bases}
                            keyExtractor={(base) => base.id!}
                            loading={loading}
                            emptyMessage={searchTerm ? 'Nenhum resultado encontrado' : 'Nenhuma base encontrada'}
                            compact={false}
                        />
                    )}
                </div>

                {/* Pagination */}
                {bases.length > 0 && (
                    <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <p className="text-sm text-gray-700">
                                    Mostrando <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> a{' '}
                                    <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalItems)}</span> de{' '}
                                    <span className="font-medium">{totalItems}</span> resultados
                                </p>
                                <select
                                    value={itemsPerPage}
                                    onChange={(e) => {
                                        setItemsPerPage(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                    className="ml-4 text-sm border border-gray-300 rounded px-2 py-1"
                                >
                                    <option value={5}>5 por página</option>
                                    <option value={10}>10 por página</option>
                                    <option value={20}>20 por página</option>
                                    <option value={50}>50 por página</option>
                                </select>
                            </div>
                            <div className="flex space-x-1">
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
                                            onClick={() => setCurrentPage(pageNumber)}
                                            className={`px-3 py-1 text-sm border rounded-md ${currentPage === pageNumber
                                                ? 'bg-primary text-white border-primary'
                                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            {pageNumber}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal para criar/editar base */}
            <Modal
                isOpen={showModal}
                onClose={resetForm}
                title={editingBase ? 'Editar Base' : 'Nova Base'}
                size="lg"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nome da Base *
                        </label>
                        <input
                            type="text"
                            value={formData.nome}
                            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                            placeholder="Digite o nome da base"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Descrição
                        </label>
                        <textarea
                            value={formData.descricao}
                            onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm h-24"
                            placeholder="Descrição da base de conhecimento"
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
                            className={`px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md flex items-center justify-center space-x-2 ${submitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary'
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

            {/* Modal de confirmação de exclusão */}
            <ConfirmModal
                isOpen={deleteConfirm.show}
                onConfirm={confirmDelete}
                onClose={cancelDelete}
                title="Excluir Base"
                message="Tem certeza que deseja excluir esta base? Esta ação não pode ser desfeita."
                confirmText="Excluir"
                cancelText="Cancelar"
                type="danger"
            />
        </div>
    );
};

export default BaseConhecimento;
