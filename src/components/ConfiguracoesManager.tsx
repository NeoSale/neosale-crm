import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { configuracoesApi, Configuracao, ConfiguracaoForm } from '../services/configuracoesApi';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  PaperAirplaneIcon,
  DocumentDuplicateIcon,
  ArrowPathIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline';
import { Search } from 'lucide-react';
import { mensagensApi, Mensagem, MensagemForm } from '../services/mensagensApi';
import Modal from './Modal';
import ConfirmModal from './ConfirmModal';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const ConfiguracoesManager: React.FC = () => {
  const [configuracoes, setConfiguracoes] = useState<ConfiguracaoForm>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingMensagem, setEditingMensagem] = useState<Mensagem | null>(null);
  const [viewingMensagem, setViewingMensagem] = useState<Mensagem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; id: string | null }>({ show: false, id: null });

  const [formData, setFormData] = useState<MensagemForm>({
    nome: '',
    intervalo_numero: 1,
    intervalo_tipo: 'minutos',
    texto_mensagem: '',
    ativo: true
  });
  
  // Estados para paginação
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [searchTerm, setSearchTerm] = useState('');

  // Carregar configurações e mensagens ao montar o componente
  useEffect(() => {
    loadConfiguracoes();
    loadMensagens();
  }, []);

  const loadConfiguracoes = async () => {
    setLoading(true);
    try {
      const response = await configuracoesApi.getConfiguracoes();
      if (response.success && response.data) {
        const newConfiguracoes: ConfiguracaoForm = {};
        response.data.forEach((config: Configuracao) => {
          if (config.chave === 'envia_somente_dias_uteis') {
            newConfiguracoes[config.chave] = config.valor === 'true';
          } else {
            newConfiguracoes[config.chave] = config.valor;
          }
        });
        setConfiguracoes(newConfiguracoes);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const success = await configuracoesApi.saveMultipleConfiguracoes(configuracoes);
      if (!success) {
        throw new Error('Falha ao salvar configurações');
      }
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setConfiguracoes(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const loadMensagens = async () => {
    setLoading(true);
    try {
      const response = await mensagensApi.getMensagens();
      if (response.success && response.data) {
        // Ordenar mensagens por ordem se disponível, senão por created_at
        const mensagensOrdenadas = response.data.sort((a, b) => {
          if (a.ordem !== undefined && b.ordem !== undefined) {
            return a.ordem - b.ordem;
          }
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });
        setMensagens(mensagensOrdenadas);
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
      texto_mensagem: mensagem.texto_mensagem,
      ativo: mensagem.ativo
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

  // Configuração dos sensores para drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Função para lidar com o fim do drag
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = currentMensagens.findIndex((item) => item.id === active.id);
      const newIndex = currentMensagens.findIndex((item) => item.id === over?.id);

      const newOrder = arrayMove(currentMensagens, oldIndex, newIndex);
      
      // Atualizar estado local imediatamente para feedback visual
      setMensagens(prevMensagens => {
        const allMensagens = [...prevMensagens];
        const reorderedCurrent = arrayMove(currentMensagens, oldIndex, newIndex);
        
        // Atualizar as mensagens da página atual com a nova ordem
        reorderedCurrent.forEach((msg, index) => {
          const globalIndex = allMensagens.findIndex(m => m.id === msg.id);
          if (globalIndex !== -1) {
            // Calcular a ordem global baseada na página atual e posição
            const globalOrder = startIndex + index + 1;
            allMensagens[globalIndex] = { ...msg, ordem: globalOrder };
          }
        });
        
        return allMensagens;
      });

      // Preparar dados para enviar à API com ordem global correta
      const mensagensOrdenadas = newOrder.map((msg, index) => ({
        id: msg.id,
        ordem: startIndex + index + 1 // Ordem global considerando paginação
      }));

      try {
        // Enviar nova ordem para a API
        // Referência: http://localhost:3000/api-docs/#/ - endpoint PUT /mensagens/{id}
        await mensagensApi.reorderMensagens(mensagensOrdenadas);
        
        // Recarregar mensagens para refletir a ordem atualizada da base de dados
        await loadMensagens();
      } catch (error) {
        console.error('Erro ao atualizar ordem das mensagens:', error);
        // Recarregar mensagens em caso de erro
        loadMensagens();
      }
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      intervalo_numero: 1,
      intervalo_tipo: 'minutos',
      texto_mensagem: '',
      ativo: true
    });
    setEditingMensagem(null);
    setShowModal(false);
  };

  const handleToggleAtivo = async (mensagem: Mensagem) => {
    try {
      const updatedMensagem = { ...mensagem, ativo: !mensagem.ativo };
      await mensagensApi.updateMensagem(mensagem.id, updatedMensagem);
      await loadMensagens();
    } catch (error) {
      console.error('Erro ao alterar status da mensagem:', error);
    }
  };

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

  // Componente para linha arrastável
  const SortableRow: React.FC<{ mensagem: Mensagem; index: number }> = ({ mensagem, index }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: mensagem.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <tr
        ref={setNodeRef}
        style={style}
        {...attributes}
        className={`border-b border-gray-200 hover:bg-gray-50 ${isDragging ? 'bg-primary/10' : ''}`}
      >
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          <div className="flex items-center gap-2">
            <button
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 rounded"
            >
              <Bars3Icon className="h-4 w-4 text-gray-400" />
            </button>
            <span>{startIndex + index + 1}</span>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          {mensagem.nome || 'Sem nome'}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          {mensagem.intervalo_numero} {mensagem.intervalo_tipo}
        </td>
        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
          {mensagem.texto_mensagem}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          <button
            onClick={() => handleToggleAtivo(mensagem)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
              mensagem.ativo ? 'bg-primary' : 'bg-gray-200'
            }`}
            title={mensagem.ativo ? 'Clique para desativar' : 'Clique para ativar'}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                mensagem.ativo ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewingMensagem(mensagem)}
              className="text-primary hover:text-primary/70 p-1 rounded hover:bg-primary/10"
              title="Visualizar"
            >
              <EyeIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleEdit(mensagem)}
              className="text-primary hover:text-primary/70 p-1 rounded hover:bg-primary/10"
              title="Editar"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDuplicar(mensagem.id)}
              className="text-primary hover:text-blue-700 p-1 rounded hover:bg-primary/10"
              title="Duplicar"
            >
              <DocumentDuplicateIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDelete(mensagem.id)}
              className="text-primary hover:text-blue-700 p-1 rounded hover:bg-primary/10"
              title="Deletar"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  if (loading && mensagens.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Seção de Configurações do Follow Up */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Configurações do Follow Up</h2>
          <p className="text-gray-600 mt-1">Gerencie as configurações do Follow Up</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Horários de Funcionamento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                Horário de Início
                <div className="group relative ml-2">
                  <svg className="h-4 w-4 text-primary cursor-help" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                    Horário de início de envio de mensagens
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                  </div>
                </div>
              </label>
              <input
                type="text"
                placeholder="HH:MM"
                value={configuracoes.horario_inicio as string || ''}
                onChange={(e) => {
                  let value = e.target.value.replace(/\D/g, '');
                  if (value.length >= 2) {
                    const hours = parseInt(value.substring(0, 2));
                    if (hours > 23) value = '23' + value.substring(2);
                  }
                  if (value.length >= 4) {
                    const minutes = parseInt(value.substring(2, 4));
                    if (minutes > 59) value = value.substring(0, 2) + '59';
                  }
                  if (value.length >= 2) {
                    value = value.substring(0, 2) + (value.length > 2 ? ':' + value.substring(2, 4) : '');
                  }
                  handleInputChange('horario_inicio', value);
                }}
                maxLength={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900"
              />

            </div>

            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                Horário de Fim
                <div className="group relative ml-2">
                  <svg className="h-4 w-4 text-primary cursor-help" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                    Horário de fim de envio de mensagens
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                  </div>
                </div>
              </label>
              <input
                type="text"
                placeholder="HH:MM"
                value={configuracoes.horario_fim as string || ''}
                onChange={(e) => {
                  let value = e.target.value.replace(/\D/g, '');
                  if (value.length >= 2) {
                    const hours = parseInt(value.substring(0, 2));
                    if (hours > 23) value = '23' + value.substring(2);
                  }
                  if (value.length >= 4) {
                    const minutes = parseInt(value.substring(2, 4));
                    if (minutes > 59) value = value.substring(0, 2) + '59';
                  }
                  if (value.length >= 2) {
                    value = value.substring(0, 2) + (value.length > 2 ? ':' + value.substring(2, 4) : '');
                  }
                  handleInputChange('horario_fim', value);
                }}
                maxLength={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900"
              />

            </div>
          </div>

          {/* Quantidade Diária Máxima */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              Quantidade Máxima de Envios Diária
              <div className="group relative ml-2">
                 <svg className="h-4 w-4 text-blue-500 cursor-help" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                  Número máximo de mensagens enviadas por dia
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                </div>
              </div>
            </label>
            <input
              type="number"
              min="1"
              max="1000"
              value={configuracoes.quantidade_diaria_maxima as string || ''}
              onChange={(e) => handleInputChange('quantidade_diaria_maxima', e.target.value)}
              className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900"
              placeholder="Ex: 30"
            />

          </div>

          {/* Envio Apenas em Dias Úteis */}
          <div>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={configuracoes.envia_somente_dias_uteis as boolean || false}
                onChange={(e) => handleInputChange('envia_somente_dias_uteis', e.target.checked)}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-700">
                  Enviar Apenas em Dias Úteis
                </span>
                <div className="group relative ml-2">
                  <svg className="h-4 w-4 text-blue-500 cursor-help" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                    Quando ativado, os leads serão notificados apenas de segunda a sexta-feira
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                  </div>
                </div>
              </div>
            </label>
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={loadConfiguracoes}
              disabled={loading || saving}
              className="px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {saving && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              <span>{saving ? 'Salvando...' : 'Salvar'}</span>
            </button>
          </div>
        </div>
      </div>

      <br />

      {/* Seção de Mensagens */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-primary text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <PaperAirplaneIcon className="h-6 w-6 text-white" />
              <div>
                <h2 className="text-lg font-bold !text-white">Mensagens Cadastradas</h2>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadMensagens}
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
                Nova Mensagem
              </button>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        {mensagens.length > 0 && (
          <div className="bg-secondary px-4 py-3 border-b">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">
                  {mensagens.length}
                </div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {mensagens.filter(m => m.ativo).length}
                </div>
                <div className="text-sm text-gray-600">Ativas</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {mensagens.filter(m => !m.ativo).length}
                </div>
                <div className="text-sm text-gray-600">Inativas</div>
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
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ordem
                      </th>
                      {['nome', 'intervalo_tipo', 'texto_mensagem', 'ativo'].map((header, index) => (
                        <th
                          key={index}
                          className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {header === 'nome' ? 'Nome' :
                            header === 'intervalo_tipo' ? 'Intervalo' :
                                header === 'texto_mensagem' ? 'Mensagem' :
                                  header === 'ativo' ? 'Ativo' :
                                    header.charAt(0).toUpperCase() + header.slice(1)}
                        </th>
                      ))}
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <SortableContext
                    items={currentMensagens.map(m => m.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentMensagens.map((mensagem, rowIndex) => (
                        <SortableRow
                          key={mensagem.id}
                          mensagem={mensagem}
                          index={startIndex + rowIndex}
                        />
                      ))}
                    </tbody>
                  </SortableContext>
                </table>
              </DndContext>
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
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
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
          
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.ativo || false}
                onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-gray-700">
                Mensagem ativa
              </span>
            </label>
            <p className="text-xs text-gray-500 mt-1">
              Mensagens inativas não serão enviadas automaticamente
            </p>
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
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
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
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                viewingMensagem.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {viewingMensagem.ativo ? 'Ativa' : 'Inativa'}
              </span>
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

export default ConfiguracoesManager;