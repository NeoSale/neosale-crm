'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowPathIcon,
  QrCodeIcon,
  PhoneIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  LinkIcon,
  PowerIcon,
} from '@heroicons/react/24/outline';
import { Search } from 'lucide-react';
import {
  evolutionApi,
  EvolutionInstance,
  EvolutionInstanceData,
  CreateInstanceRequest,
  UpdateInstanceRequest,
  QRCodeResponse,
} from '../services/evolutionApi';
import Modal from './Modal';
import ConfirmModal from './ConfirmModal';

const WhatsAppIntegration: React.FC = () => {
  const [instances, setInstances] = useState<EvolutionInstance[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingInstance, setEditingInstance] = useState<EvolutionInstanceData | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; id: string | null }>({ show: false, id: null });
  const [qrCodeModal, setQrCodeModal] = useState<{ show: boolean; data: QRCodeResponse | null; instanceName: string | null }>({ show: false, data: null, instanceName: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [formData, setFormData] = useState<CreateInstanceRequest>({
    instanceName: '',
    qrcode: true,
    integration: 'WHATSAPP-BAILEYS',
    rejectCall: false,
    msgCall: '',
    groupsIgnore: false,
    alwaysOnline: false,
    readMessages: false,
    readStatus: false,
    syncFullHistory: false,
    webhook: {
      url: '',
      byEvents: false,
      base64: true,
      events: ['MESSAGES_UPSERT'],
    },
  });
  const [webhookEnabled, setWebhookEnabled] = useState(false);

  useEffect(() => {
    loadInstances();
  }, []);

  const loadInstances = async () => {
    setLoading(true);
    try {
      const response = await evolutionApi.getInstances();
      if (response.success && response.data) {
        setInstances(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar instâncias:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let response;
      if (editingInstance) {
        const updateData: UpdateInstanceRequest = {
          instanceName: formData.instanceName,
          rejectCall: formData.rejectCall,
          msgCall: formData.msgCall,
          groupsIgnore: formData.groupsIgnore,
          alwaysOnline: formData.alwaysOnline,
          readMessages: formData.readMessages,
          readStatus: formData.readStatus,
          webhook: webhookEnabled ? {
            ...formData.webhook,
            base64: true,
            events: ['MESSAGES_UPSERT']
          } : undefined,
        };
        response = await evolutionApi.updateInstance(editingInstance.instanceName, updateData);
      } else {
        const createData: CreateInstanceRequest = {
          ...formData,
          integration: 'WHATSAPP-BAILEYS' as const,
          webhook: webhookEnabled ? {
            ...formData.webhook,
            base64: true,
            events: ['MESSAGES_UPSERT']
          } : undefined,
        };
        response = await evolutionApi.createInstance(createData);
      }
      
      if (response.success) {
        loadInstances();
        resetForm();
      }
    } catch (error) {
      console.error('Erro ao salvar instância:', error);
    }
  };

  const handleEdit = (item: any) => {
    const instance = item.instance;
    const hasWebhook = instance.integration?.webhook_wa_business;
    setWebhookEnabled(!!hasWebhook);
    setFormData({
      instanceName: instance.instanceName,
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS',
      rejectCall: false,
      msgCall: '',
      groupsIgnore: false,
      alwaysOnline: false,
      readMessages: false,
      readStatus: false,
      syncFullHistory: false,
      webhook: {
        url: instance.integration?.webhook_wa_business || '',
        byEvents: false,
        base64: true,
        events: ['MESSAGES_UPSERT'],
      },
    });
    setEditingInstance(instance);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    setDeleteConfirm({ show: true, id });
  };

  const confirmDelete = async () => {
    if (deleteConfirm.id) {
      try {
        const response = await evolutionApi.deleteInstance(deleteConfirm.id);
        if (response.success) {
          toast.success('Instância deletada com sucesso!');
          loadInstances();
        }
      } catch (error) {
        console.error('Erro ao deletar instância:', error);
        toast.error('Erro ao deletar instância');
      }
    }
    setDeleteConfirm({ show: false, id: null });
  };

  const cancelDelete = () => {
    setDeleteConfirm({ show: false, id: null });
  };

  const handleConnect = async (instanceName: string) => {
    try {
      console.log('Conectando instância:', instanceName);
      const response = await evolutionApi.getQRCode(instanceName);
      
      console.log('Resposta da API:', response);
      console.log('Response data:', response.data);
      
      if (response.success && response.data) {
        console.log('Abrindo modal com dados:', response.data);
        setQrCodeModal({ show: true, data: response.data, instanceName: instanceName });
      } else {
        console.error('Erro na resposta:', response.message);
        toast.error(response.message || 'Erro ao obter QR Code');
      }
    } catch (error) {
      console.error('Erro ao obter QR Code:', error);
      toast.error('Erro ao obter QR Code');
    }
  };

  const handleDisconnect = async (instanceName: string) => {
    try {
      const response = await evolutionApi.disconnectInstance(instanceName);
      if (response.success) {
        toast.success('Instância desconectada com sucesso!');
        loadInstances();
      }
    } catch (error) {
      console.error('Erro ao desconectar instância:', error);
      toast.error('Erro ao desconectar instância');
    }
  };

  const handleRestart = async (instanceName: string) => {
    try {
      const response = await evolutionApi.restartInstance(instanceName);
      if (response.success) {
        toast.success('Instância reiniciada com sucesso!');
        loadInstances();
      }
    } catch (error) {
      console.error('Erro ao reiniciar instância:', error);
      toast.error('Erro ao reiniciar instância');
    }
  };

  const resetForm = () => {
    setFormData({
      instanceName: '',
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS',
      rejectCall: false,
      msgCall: '',
      groupsIgnore: false,
      alwaysOnline: false,
      readMessages: false,
      readStatus: false,
      syncFullHistory: false,
      webhook: {
        url: '',
        byEvents: false,
        base64: true,
        events: ['MESSAGES_UPSERT'],
      },
    });
    setWebhookEnabled(false);
    setEditingInstance(null);
    setShowModal(false);
  };

  const getStatusIcon = (status: string) => {
    if (status === 'open') {
      return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
    } else if (status === 'connecting') {
      return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
    } else {
      return <XCircleIcon className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusText = (status: string) => {
    if (status === 'open') {
      return 'Conectado';
     } else if (status === 'connecting') {
      return 'Desconectado';
    } else {
      return 'Desconectado';
    }
  };

  // Filtrar instâncias baseado no termo de busca
  const filteredInstances = instances.filter(item => {
    if (!searchTerm) return true;
    const instance = item.instance;
    if (!instance) return false;
    return instance.instanceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      instance.instanceId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (instance.owner && instance.owner.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (instance.profileName && instance.profileName.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  // Cálculos de paginação
  const totalPages = Math.ceil(filteredInstances.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentInstances = filteredInstances.slice(startIndex, endIndex);

  if (loading && instances.length === 0) {
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
              <LinkIcon className="h-8 w-8 text-white" />
              <div>
                <h2 className="text-lg font-bold text-white !text-white">Integração WhatsApp</h2>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadInstances}
                disabled={loading}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium flex items-center gap-1.5 text-white"
              >
                <ArrowPathIcon className={`h-3.5 w-3.5 text-white ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium flex items-center gap-1.5 text-white"
              >
                <PlusIcon className="h-3.5 w-3.5 text-white" />
                Nova Instância
              </button>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        {instances.length > 0 && (
          <div className="p-6 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {instances.length}
                </div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {instances.filter(i => i.instance && i.instance.status === 'open').length}
                </div>
                <div className="text-sm text-gray-600">Conectadas</div>
              </div>
              {/* <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {instances.filter(i => i.instance && i.instance.status === 'connecting').length}
                </div>
                <div className="text-sm text-gray-600">Conectando</div>
              </div> */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {instances.filter(i => i.instance && i.instance.status !== 'open').length}
                </div>
                <div className="text-sm text-gray-600">Desconectadas</div>
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
              placeholder="Buscar instâncias..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        {/* Tabela de Instâncias */}
        <div className="overflow-x-auto">
          {currentInstances.length === 0 ? (
            <div className="text-center py-12">
              <LinkIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {searchTerm ? 'Nenhuma instância encontrada' : 'Nenhuma instância cadastrada'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? 'Tente ajustar os filtros de busca.' : 'Comece criando sua primeira instância do WhatsApp.'}
              </p>
              {!searchTerm && (
                <div className="mt-6">
                  <button
                    onClick={() => setShowModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90"
                  >
                    <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                    Nova Instância
                  </button>
                </div>
              )}
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Perfil WhatsApp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Instância
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentInstances.map((item) => {
                  const instance = item.instance;
                  if (!instance) return null;
                  return (
                  <tr key={instance.instanceId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {instance.profilePictureUrl && (
                          <img
                            src={instance.profilePictureUrl}
                            alt="Profile"
                            className="h-8 w-8 rounded-full"
                          />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {instance.profileName || 'Não conectado'}
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            {instance.owner && instance.owner.replace(/@s\.whatsapp\.net/g, '')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {instance.instanceName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(instance.status || 'close')}
                        <span className={`text-sm font-medium ${
                          instance.status === 'open'
                            ? 'text-primary'
                            : instance.status === 'connecting'
                            ? 'text-yellow-600'
                            : 'text-primary'
                        }`}>
                          {getStatusText(instance.status || 'close')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        {(instance.status || 'close') !== 'open' ? (
                          <button
                            onClick={() => handleConnect(instance.instanceName)}
                            className="text-primary hover:text-primary/70 p-1 rounded hover:bg-primary/10"
                            title="Conectar"
                          >
                            <QrCodeIcon className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleDisconnect(instance.instanceName)}
                            className="text-primary hover:text-primary/70 p-1 rounded hover:bg-primary/10"
                            title="Desconectar"
                          >
                            <PowerIcon className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleRestart(instance.instanceName)}
                          className="text-primary hover:text-primary/70 p-1 rounded hover:bg-primary/10"
                          title="Reiniciar"
                        >
                          <ArrowPathIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-primary hover:text-primary/70 p-1 rounded hover:bg-primary/10"
                          title="Editar"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(instance.instanceName)}
                          className="text-primary hover:text-primary/70 p-1 rounded hover:bg-primary/10"
                          title="Deletar"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Controles de Paginação */}
        {filteredInstances.length > 0 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">
                  Mostrando {startIndex + 1} a {Math.min(endIndex, filteredInstances.length)} de {filteredInstances.length} resultados
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
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>

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
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Próximo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Criação/Edição */}
      <Modal
        isOpen={showModal}
        onClose={resetForm}
        title={editingInstance ? 'Editar Instância' : 'Nova Instância'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome da Instância *
            </label>
            <input
              type="text"
              required
              value={formData.instanceName}
              onChange={(e) => setFormData({ ...formData, instanceName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Ex: minha-empresa-whatsapp"
            />
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={webhookEnabled}
                onChange={(e) => setWebhookEnabled(e.target.checked)}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">Habilitar Webhook</span>
            </label>
          </div>

          {webhookEnabled && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL do Webhook *
              </label>
              <input
                type="url"
                required={webhookEnabled}
                value={formData.webhook?.url || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  webhook: { ...formData.webhook!, url: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="https://seu-webhook.com/whatsapp"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mensagem para Chamadas Rejeitadas
            </label>
            <textarea
              value={formData.msgCall || ''}
              onChange={(e) => setFormData({ ...formData, msgCall: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              rows={3}
              placeholder="Mensagem enviada quando uma chamada for rejeitada automaticamente"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.rejectCall || false}
                  onChange={(e) => setFormData({ ...formData, rejectCall: e.target.checked })}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Rejeitar chamadas automaticamente</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.groupsIgnore || false}
                  onChange={(e) => setFormData({ ...formData, groupsIgnore: e.target.checked })}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Ignorar mensagens de grupos</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.alwaysOnline || false}
                  onChange={(e) => setFormData({ ...formData, alwaysOnline: e.target.checked })}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Manter sempre online</span>
              </label>
            </div>

            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.readMessages || false}
                  onChange={(e) => setFormData({ ...formData, readMessages: e.target.checked })}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Marcar mensagens como lidas</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.readStatus || false}
                  onChange={(e) => setFormData({ ...formData, readStatus: e.target.checked })}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Mostrar status de leitura</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.syncFullHistory || false}
                  onChange={(e) => setFormData({ ...formData, syncFullHistory: e.target.checked })}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Sincronizar histórico completo</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-primary border border-transparent rounded-md hover:bg-primary/90"
            >
              {editingInstance ? 'Atualizar' : 'Criar'} Instância
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal de QR Code */}
      <Modal
        isOpen={qrCodeModal.show}
        onClose={() => setQrCodeModal({ show: false, data: null, instanceName: null })}
        title="Conectar WhatsApp"
        size="md"
      >
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <QrCodeIcon className="h-16 w-16 text-primary" />
          </div>
                    
          {qrCodeModal.data?.base64 && (
            <div className="flex justify-center">
              <img
                src={`data:image/png;base64,${qrCodeModal.data.base64}`}
                alt="QR Code"
                className="max-w-xs border rounded-lg"
              />
            </div>
          )}
          
          {qrCodeModal.data?.qrcode && !qrCodeModal.data?.base64 && (
            <div className="flex justify-center">
              <img
                src={`data:image/png;base64,${qrCodeModal.data.qrcode}`}
                alt="QR Code"
                className="max-w-xs border rounded-lg"
              />
            </div>
          )}
          
          {qrCodeModal.data?.pairingCode && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Código de Pareamento:</p>
              <p className="text-2xl font-mono font-bold text-gray-900">
                {qrCodeModal.data.pairingCode}
              </p>
            </div>
          )}
          
          {!qrCodeModal.data?.base64 && !qrCodeModal.data?.qrcode && !qrCodeModal.data?.pairingCode && (
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-red-600">Nenhum QR Code ou código de pareamento disponível</p>
            </div>
          )}
          
          <div className="text-sm text-gray-600">
            <p>1. Abra o WhatsApp no seu celular</p>
            <p>2. Vá em Configurações → Aparelhos conectados</p>
            <p>3. Toque em "Conectar um aparelho"</p>
            <p>4. {qrCodeModal.data?.base64 || qrCodeModal.data?.qrcode ? 'Escaneie o QR Code acima' : 'Digite o código de pareamento'}</p>
          </div>
          
          <button
            onClick={() => {
              setQrCodeModal({ show: false, data: null, instanceName: null });
              loadInstances();
            }}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-primary border border-transparent rounded-md hover:bg-primary/90"
          >
            Fechar
          </button>
        </div>
      </Modal>

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmModal
        isOpen={deleteConfirm.show}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Confirmar Exclusão"
        message="Tem certeza que deseja excluir esta instância? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  );
};

export default WhatsAppIntegration;