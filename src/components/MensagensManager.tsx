'use client';

import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  PaperAirplaneIcon,
  DocumentDuplicateIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { Search } from 'lucide-react';
import { mensagensApi, Mensagem, MensagemForm } from '../services/mensagensApi';
import Modal from './Modal';
import ConfirmModal from './ConfirmModal';

interface MensagensManagerProps {}

const MensagensManager: React.FC<MensagensManagerProps> = () => {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingMensagem, setEditingMensagem] = useState<Mensagem | null>(null);
  const [viewingMensagem, setViewingMensagem] = useState<Mensagem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; id: string | null }>({ show: false, id: null });
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState<MensagemForm>({
    nome: '',
    intervalo_numero: 1,
    intervalo_tipo: 'minutos',
    texto_mensagem: ''
  });
  
  // Estados para paginação
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  useEffect(() => {
    loadMensagens();
  }, []);

  // Resetar página quando filtro mudar
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  const loadMensagens = async () => {
    setLoading(true);
    try {
      const response = await mensagensApi.getMensagens();
      if (response.success && response.data) {
        setMensagens(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    } finally {
      setLoading(false);
    }
  };





  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let response;
      if (editingMensagem) {
        response = await mensagensApi.updateMensagem(editingMensagem.id, formData);
      } else {
        response = await mensagensApi.createMensagem(formData);
      }
      
      if (response.success) {
        loadMensagens();
        resetForm();
      }
    } catch (error) {
      console.error('Erro ao salvar mensagem:', error);
    }
  };

  const handleEdit = (mensagem: Mensagem) => {
    setFormData({
      nome: mensagem.nome || '',
      intervalo_numero: mensagem.intervalo_numero,
      intervalo_tipo: mensagem.intervalo_tipo,
      texto_mensagem: mensagem.texto_mensagem
    });
    setEditingMensagem(mensagem);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    setDeleteConfirm({ show: true, id });
  };

  const confirmDelete = async () => {
    if (deleteConfirm.id) {
      const response = await mensagensApi.deleteMensagem(deleteConfirm.id);
      if (response.success) {
        loadMensagens();
      }
    }
    setDeleteConfirm({ show: false, id: null });
  };

  const cancelDelete = () => {
    setDeleteConfirm({ show: false, id: null });
  };



  const handleDuplicar = async (id: string) => {
    await mensagensApi.duplicarMensagem(id);
    loadMensagens();
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      intervalo_numero: 1,
      intervalo_tipo: 'minutos',
      texto_mensagem: ''
    });
    setEditingMensagem(null);
    setShowModal(false);
  };



  if (loading && mensagens.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Filtrar mensagens baseado no termo de busca
  const filteredMensagens = mensagens.filter(mensagem => {
    if (!searchTerm) return true;
    return Object.values(mensagem).some(value =>
      value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Cálculos de paginação
  const totalPages = Math.ceil(filteredMensagens.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentMensagens = filteredMensagens.slice(startIndex, endIndex);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
      {/* Seção de Mensagens */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-primary text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <PaperAirplaneIcon className="h-6 w-6" />
              <div>
                <h2 className="text-lg font-bold">Mensagens Cadastradas</h2>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadMensagens}
                disabled={loading}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium flex items-center gap-1.5"
              >
                <ArrowPathIcon className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium flex items-center gap-1.5"
              >
                <PlusIcon className="h-3.5 w-3.5" />
                Nova Mensagem
              </button>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        {mensagens.length > 0 && (
          <div className="bg-secondary px-4 py-3 border-b">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">
                  {mensagens.length}
                </div>
                <div className="text-sm text-gray-600">Total de Mensagens</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {mensagens.filter(m => m.intervalo_tipo === 'minutos').length}
                </div>
                <div className="text-sm text-gray-600">Em Minutos</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {mensagens.filter(m => m.intervalo_tipo === 'horas').length}
                </div>
                <div className="text-sm text-gray-600">Em Horas</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {mensagens.filter(m => m.intervalo_tipo === 'dias').length}
                </div>
                <div className="text-sm text-gray-600">Em Dias</div>
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
              placeholder="Buscar mensagens por nome, tipo, intervalo ou texto..."
              className="w-full pl-10 pr-4 py-2 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        {currentMensagens.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {['nome', 'intervalo_tipo', 'intervalo_numero', 'texto_mensagem'].map((header, index) => (
                      <th
                        key={index}
                        className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {header === 'nome' ? 'Nome' :
                          header === 'intervalo_tipo' ? 'Tipo Intervalo' :
                            header === 'intervalo_numero' ? 'Intervalo' :
                              header === 'texto_mensagem' ? 'Mensagem' :
                                header.charAt(0).toUpperCase() + header.slice(1)}
                      </th>
                    ))}
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentMensagens.map((mensagem, rowIndex) => (
                    <tr key={mensagem.id || rowIndex} className="hover:bg-gray-50">
                      {['nome', 'intervalo_tipo', 'intervalo_numero', 'texto_mensagem'].map((header, colIndex) => (
                        <td
                          key={colIndex}
                          className="px-3 py-2 whitespace-nowrap text-sm text-gray-700"
                        >
                          {(() => {
                            const value = mensagem[header as keyof Mensagem];
                            if (value === null || value === undefined) return '-';

                            // Tratar campo nome
                            if (header === 'nome') {
                              return value || 'Sem nome';
                            }

                            // Tratar tipo de intervalo
                            if (header === 'intervalo_tipo') {
                              return typeof value === 'string' ? value.charAt(0).toUpperCase() + value.slice(1) : value;
                            }

                            // Tratar mensagem (truncar se muito longa)
                            if (header === 'texto_mensagem') {
                              return typeof value === 'string' && value.length > 50 
                                ? value.substring(0, 50) + '...' 
                                : value;
                            }

                            return value;
                          })()}
                        </td>
                      ))}
                      <td className="px-3 py-2 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setViewingMensagem(mensagem)}
                            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded transition-colors"
                            title="Visualizar mensagem"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(mensagem)}
                            className="p-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 rounded transition-colors"
                            title="Editar mensagem"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDuplicar(mensagem.id)}
                            className="p-1 text-green-600 hover:text-green-800 hover:bg-green-100 rounded transition-colors"
                            title="Duplicar mensagem"
                          >
                            <DocumentDuplicateIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(mensagem.id)}
                            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors"
                            title="Excluir mensagem"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Controles de Paginação */}
            {filteredMensagens.length > 0 && (
              <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6 text-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-700">
                      Mostrando {startIndex + 1} a {Math.min(endIndex, filteredMensagens.length)} de {filteredMensagens.length} resultados
                    </span>
                    <div className="flex items-center space-x-2 ml-4">
                      <span className="text-sm text-gray-700">Itens por página:</span>
                      <select
                        className="border border-gray-300 rounded px-2 py-1 text-sm"
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
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
                          onClick={() => setCurrentPage(pageNumber)}
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
                      onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
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
            <PaperAirplaneIcon className="mx-auto text-gray-400 mb-4 h-12 w-12" />
            <h3 className="text-base font-medium text-gray-900 mb-2">
              {searchTerm ? 'Nenhuma mensagem encontrada' : 'Nenhuma mensagem cadastrada'}
            </h3>
            <p className="text-gray-500 mb-4 text-sm">
              {searchTerm
                ? 'Tente ajustar os termos de busca ou limpar o filtro.'
                : 'Comece criando uma nova mensagem.'}
            </p>
            {!searchTerm && (
              <button
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium"
                onClick={() => setShowModal(true)}
              >
                Nova Mensagem
              </button>
            )}
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
        {searchTerm && mensagens.length > 0 && (
          <div className="bg-secondary px-4 py-2 border-t">
            <div className="text-center">
              <p className="text-xs text-gray-600">
                Mostrando {filteredMensagens.length} de {mensagens.length} mensagens para "{searchTerm}"
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Criação/Edição */}
      <Modal
        isOpen={showModal}
        onClose={resetForm}
        title={editingMensagem ? 'Editar Mensagem' : 'Nova Mensagem'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome
            </label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nome da mensagem (opcional)"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Intervalo
            </label>
            <select
              value={formData.intervalo_tipo}
              onChange={(e) => setFormData({ ...formData, intervalo_tipo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="minutos">Minutos</option>
              <option value="horas">Horas</option>
              <option value="dias">Dias</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Intervalo
            </label>
            <input
              type="number"
              min="1"
              value={formData.intervalo_numero}
              onChange={(e) => setFormData({ ...formData, intervalo_numero: parseInt(e.target.value) || 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Número do intervalo"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mensagem
            </label>
            <textarea
              value={formData.texto_mensagem}
              onChange={(e) => setFormData({ ...formData, texto_mensagem: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Digite o texto da mensagem..."
              required
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {editingMensagem ? 'Atualizar' : 'Criar'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal de Visualização */}
      <Modal
        isOpen={!!viewingMensagem}
        onClose={() => setViewingMensagem(null)}
        title="Visualizar Mensagem"
        size="lg"
      >
        {viewingMensagem && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome
              </label>
              <p className="text-sm text-gray-900">{viewingMensagem.nome || 'Sem nome'}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Intervalo
              </label>
              <p className="text-sm text-gray-900 capitalize">
                {viewingMensagem.intervalo_tipo}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Intervalo
              </label>
              <p className="text-sm text-gray-900">
                {viewingMensagem.intervalo_numero}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mensagem
              </label>
              <div className="text-sm text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded-md">
                {viewingMensagem.texto_mensagem}
              </div>
            </div>
            
            {viewingMensagem.enviada && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status de Envio
                </label>
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                  Enviada
                </span>
              </div>
            )}
            
            {viewingMensagem.data_hora_envio && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data/Hora do Envio
                </label>
                <p className="text-sm text-gray-900">
                  {(() => {
                    const date = new Date(viewingMensagem.data_hora_envio);
                    const day = date.getDate().toString().padStart(2, '0');
                    const month = (date.getMonth() + 1).toString().padStart(2, '0');
                    const year = date.getFullYear();
                    const hours = date.getHours().toString().padStart(2, '0');
                    const minutes = date.getMinutes().toString().padStart(2, '0');
                    return `${day}/${month}/${year} ${hours}:${minutes}`;
                  })()} 
                </p>
              </div>
            )}
            
            <div className="flex justify-end pt-4">
              <button
                onClick={() => setViewingMensagem(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmModal
        isOpen={deleteConfirm.show}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Confirmar Exclusão"
        message="Tem certeza que deseja deletar esta mensagem? Esta ação não pode ser desfeita."
        confirmText="Deletar"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  );
};

export default MensagensManager;