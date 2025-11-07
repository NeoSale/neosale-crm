'use client';

import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    ArrowPathIcon,
    DocumentTextIcon,
    MagnifyingGlassIcon,
    ArrowDownTrayIcon,
    ChevronDownIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import { Search } from 'lucide-react';
import { documentosApi, Documento } from '../services/documentosApi';
import { baseApi, Base } from '../services/baseApi';
import Modal from './Modal';
import ConfirmModal from './ConfirmModal';
import { Table, TableColumn, TableActionButton, TableText, TableBadge } from './Table';

const DocumentosConhecimento: React.FC = () => {
    const [documentos, setDocumentos] = useState<Documento[]>([]);
    const [bases, setBases] = useState<Base[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [loadingDocumentos, setLoadingDocumentos] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingDocumento, setEditingDocumento] = useState<Documento | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; id: string | null }>({ show: false, id: null });
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    const [formData, setFormData] = useState<Partial<Documento>>({
        nome: '',
        descricao: '',
        nome_arquivo: '',
        base_id: [],
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [selectedBases, setSelectedBases] = useState<string[]>([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadDocumentos();
        loadBases();
    }, [currentPage, itemsPerPage, searchTerm]);

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

    const loadDocumentos = async (showLoadingState = true) => {
        if (showLoadingState) {
            setLoading(true);
        } else {
            setLoadingDocumentos(true);
        }
        try {
            const response = await documentosApi.getDocumentos({
                page: currentPage,
                limit: itemsPerPage,
                search: searchTerm || undefined,
            });
            
            if (response.success && response.data) {
                setDocumentos(response.data.documentos || []);
                if (response.data.pagination) {
                    setTotalPages(response.data.pagination.totalPages);
                    setTotalItems(response.data.pagination.totalItems);
                }
            }
        } catch (error) {
            console.error('Erro ao carregar documentos:', error);
        } finally {
            if (showLoadingState) {
                setLoading(false);
            } else {
                setLoadingDocumentos(false);
            }
        }
    };

    const loadBases = async () => {
        try {
            const response = await baseApi.getBases({ limit: 100 });
            if (response.success && response.data) {
                setBases(response.data.bases || []);
            }
        } catch (error) {
            console.error('Erro ao carregar bases:', error);
        }
    };

    const convertFileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const base64String = reader.result as string;
                // Remove o prefixo "data:*/*;base64," para enviar apenas o base64
                const base64 = base64String.split(',')[1];
                resolve(base64);
            };
            reader.onerror = (error) => reject(error);
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.nome) {
            toast.error('Por favor, preencha o nome do documento.');
            return;
        }

        if (!selectedBases || selectedBases.length === 0) {
            toast.error('Por favor, selecione pelo menos uma base de conhecimento.');
            return;
        }

        if (!editingDocumento && !selectedFile) {
            toast.error('Por favor, selecione um arquivo.');
            return;
        }

        setSubmitting(true);

        try {
            let dataToSend = { ...formData, base_id: selectedBases };

            // Se houver um arquivo selecionado, converte para base64
            if (selectedFile) {
                const base64 = await convertFileToBase64(selectedFile);
                dataToSend = {
                    ...dataToSend,
                    base64: base64,
                };
            }

            if (editingDocumento?.id) {
                await documentosApi.updateDocumento(editingDocumento.id, dataToSend);
            } else {
                await documentosApi.createDocumento(dataToSend as Omit<Documento, 'id'>);
            }
            loadDocumentos(false);
            resetForm();
        } catch (error) {
            console.error('Erro ao salvar documento:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (documento: Documento) => {
        const baseIds = Array.isArray(documento.base_id) ? documento.base_id : documento.base_id ? [documento.base_id] : [];
        setFormData({
            nome: documento.nome,
            descricao: documento.descricao,
            nome_arquivo: documento.nome_arquivo,
            base_id: baseIds,
        });
        setSelectedBases(baseIds);
        setEditingDocumento(documento);
        setShowModal(true);
    };

    const handleDelete = (id: string) => {
        setDeleteConfirm({ show: true, id });
    };

    const confirmDelete = async () => {
        if (deleteConfirm.id) {
            setDeleting(true);
            try {
                await documentosApi.deleteDocumento(deleteConfirm.id);
                loadDocumentos(false);
                setDeleteConfirm({ show: false, id: null });
            } catch (error) {
                console.error('Erro ao deletar documento:', error);
            } finally {
                setDeleting(false);
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
            nome_arquivo: '',
            base_id: [],
        });
        setSelectedBases([]);
        setSelectedFile(null);
        setEditingDocumento(null);
        setShowModal(false);
        setIsDropdownOpen(false);
    };

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

    const getSelectedBasesNames = () => {
        return selectedBases.map(id => {
            const base = bases.find(b => b.id === id);
            return base?.nome || id;
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setFormData({ ...formData, nome_arquivo: file.name });
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const file = e.dataTransfer.files?.[0];
        if (file) {
            const allowedExtensions = ['.pdf', '.csv', '.json', '.txt', '.ppt', '.pptx', '.doc', '.docx', '.xls', '.xlsx'];
            const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
            
            if (allowedExtensions.includes(fileExtension)) {
                setSelectedFile(file);
                setFormData({ ...formData, nome_arquivo: file.name });
            } else {
                toast.error('Formato de arquivo não suportado. Use: PDF, CSV, JSON, Text, PowerPoint, Word ou Excel.');
            }
        }
    };

    const handleDownload = async (documento: Documento) => {
        try {
            if (!documento.id) {
                toast.error('ID do documento não encontrado.');
                return;
            }

            // Buscar o documento completo com o base64
            const response = await documentosApi.getDocumentoById(documento.id);
            
            if (!response.success || !response.data || !response.data.base64) {
                toast.error('Arquivo não disponível para download.');
                return;
            }

            const base64 = response.data.base64;
            const fileName = response.data.nome_arquivo || 'documento';

            // Detectar o tipo MIME baseado na extensão do arquivo
            const extension = fileName.split('.').pop()?.toLowerCase();
            const mimeTypes: Record<string, string> = {
                'pdf': 'application/pdf',
                'csv': 'text/csv',
                'json': 'application/json',
                'txt': 'text/plain',
                'ppt': 'application/vnd.ms-powerpoint',
                'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'doc': 'application/msword',
                'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'xls': 'application/vnd.ms-excel',
                'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            };
            const mimeType = mimeTypes[extension || ''] || 'application/octet-stream';

            // Converter base64 para blob
            const byteCharacters = atob(base64);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: mimeType });

            // Criar link de download
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success('Download iniciado!');
        } catch (error) {
            console.error('Erro ao baixar arquivo:', error);
            toast.error('Erro ao baixar o arquivo.');
        }
    };

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

    const getBaseName = (baseId?: string | string[]) => {
        if (!baseId) return '-';
        if (Array.isArray(baseId)) {
            if (baseId.length === 0) return '-';
            const baseNames = baseId.map(id => {
                const base = bases.find(b => b.id === id);
                return base?.nome;
            });
            return baseNames.join(', ');
        }
        const base = bases.find(b => b.id === baseId);
        return base?.nome || '-';
    };

    if (loading && documentos.length === 0) {
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
                            <DocumentTextIcon className="h-8 w-8 text-white" />
                            <div>
                                <h2 className="text-lg font-bold text-white !text-white">Documentos</h2>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => loadDocumentos(false)}
                                disabled={loading || loadingDocumentos}
                                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium flex items-center gap-1.5 text-white"
                            >
                                <ArrowPathIcon className={`h-4 w-4 ${(loading || loadingDocumentos) ? 'animate-spin' : ''}`} />
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
                                Novo Documento
                            </button>
                        </div>
                    </div>
                </div>

                {/* Estatísticas */}
                {/* {documentos.length > 0 && (
                    <div className="p-6 border-b border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <div className="text-2xl font-bold text-blue-600">
                                    {totalItems}
                                </div>
                                <div className="text-sm text-gray-600">Total de Documentos</div>
                            </div>
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <div className="text-2xl font-bold text-blue-600">
                                    {documentos.length}
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
                            placeholder="Buscar documentos..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Tabela de Documentos */}
                <div className="overflow-x-auto relative">
                    {loadingDocumentos && (
                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                            <div className="flex items-center space-x-2">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                <span className="text-sm text-gray-600">Atualizando documentos...</span>
                            </div>
                        </div>
                    )}
                    {documentos.length === 0 ? (
                        <div className="text-center py-12">
                            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">
                                {searchTerm ? 'Nenhum documento encontrado' : 'Nenhum documento cadastrado'}
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                {searchTerm ? 'Tente ajustar os filtros de busca.' : 'Comece criando seu primeiro documento.'}
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
                                        Novo Documento
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
                                    render: (doc) => <TableText>{doc.nome}</TableText>,
                                },
                                {
                                    key: 'arquivo',
                                    header: 'Arquivo',
                                    render: (doc) => <TableText>{doc.nome_arquivo}</TableText>,
                                },
                                {
                                    key: 'base',
                                    header: 'Base',
                                    render: (doc) => (
                                        <TableBadge variant="purple">
                                            {getBaseName(doc.base_id)}
                                        </TableBadge>
                                    ),
                                },
                                {
                                    key: 'descricao',
                                    header: 'Descrição',
                                    render: (doc) => (
                                        <TableText truncate maxWidth="max-w-md">
                                            {doc.descricao || '-'}
                                        </TableText>
                                    ),
                                },
                                {
                                    key: 'created_at',
                                    header: 'Criado em',
                                    render: (doc) => (
                                        <TableText>
                                            <span className="text-gray-500">{formatDate(doc.created_at)}</span>
                                        </TableText>
                                    ),
                                },
                                {
                                    key: 'acoes',
                                    header: 'Ações',
                                    width: 'w-28',
                                    render: (doc) => (
                                        <div className="flex items-center gap-0.5">
                                            <TableActionButton
                                                onClick={() => handleDownload(doc)}
                                                icon={<ArrowDownTrayIcon className="h-4 w-4" />}
                                                title="Baixar arquivo"
                                                variant="primary"
                                            />
                                            <TableActionButton
                                                onClick={() => handleDelete(doc.id!)}
                                                icon={<TrashIcon className="h-4 w-4" />}
                                                title="Excluir"
                                                variant="danger"
                                            />
                                        </div>
                                    ),
                                },
                            ]}
                            data={documentos}
                            keyExtractor={(doc) => doc.id || ''}
                            emptyMessage="Nenhum documento encontrado"
                            compact
                        />
                    )}
                </div>

                {/* Pagination */}
                {documentos.length > 0 && (
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

            {/* Modal para criar/editar documento */}
            <Modal
                isOpen={showModal}
                onClose={resetForm}
                title={editingDocumento ? 'Editar Documento' : 'Novo Documento'}
                size="lg"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nome do Documento *
                        </label>
                        <input
                            type="text"
                            value={formData.nome}
                            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                            placeholder="Digite o nome do documento"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Carregar Arquivo {!editingDocumento && '*'}
                        </label>
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
                                isDragging
                                    ? 'border-primary bg-primary/5'
                                    : 'border-gray-300 hover:border-gray-400'
                            }`}
                        >
                            <input
                                type="file"
                                id="file-upload"
                                onChange={handleFileChange}
                                accept=".pdf,.csv,.json,.txt,.ppt,.pptx,.doc,.docx,.xls,.xlsx"
                                className="hidden"
                            />
                            <label
                                htmlFor="file-upload"
                                className="cursor-pointer flex flex-col items-center justify-center"
                            >
                                <DocumentTextIcon className="h-12 w-12 text-gray-400 mb-2" />
                                <p className="text-sm text-gray-600 text-center">
                                    <span className="font-medium text-primary">Clique para selecionar</span> ou arraste o arquivo aqui
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    PDF, CSV, JSON, Text, PowerPoint, Word, Excel
                                </p>
                            </label>
                        </div>
                        {selectedFile && (
                            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                                <p className="text-sm text-green-700 flex items-center gap-2">
                                    <DocumentTextIcon className="h-4 w-4" />
                                    <span className="font-medium">Arquivo selecionado:</span> {selectedFile.name}
                                </p>
                            </div>
                        )}
                        {editingDocumento && formData.nome_arquivo && !selectedFile && (
                            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-sm text-blue-700 flex items-center gap-2">
                                    <DocumentTextIcon className="h-4 w-4" />
                                    <span className="font-medium">Arquivo atual:</span> {formData.nome_arquivo}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="relative" ref={dropdownRef}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Bases de Conhecimento *
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

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Descrição
                        </label>
                        <textarea
                            value={formData.descricao}
                            onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm h-24"
                            placeholder="Descrição do documento"
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
                                    ? (editingDocumento ? 'Atualizando...' : 'Criando...')
                                    : (editingDocumento ? 'Atualizar' : 'Criar Documento')
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
                title="Excluir Documento"
                message="Tem certeza que deseja excluir este documento? Esta ação não pode ser desfeita."
                confirmText="Excluir"
                cancelText="Cancelar"
                type="danger"
                isLoading={deleting}
            />
        </div>
    );
};

export default DocumentosConhecimento;
