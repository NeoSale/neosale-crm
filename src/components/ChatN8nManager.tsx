'use client';

import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import {
  PaperAirplaneIcon,
  InformationCircleIcon,
  XMarkIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  TagIcon,
  DocumentDuplicateIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { chatApi, ChatCliente, ChatMessage } from '../services/chatApi-old';
import { leadsApi, Lead } from '../services/leadsApi';
import { getClienteId } from '../utils/cliente-utils';
import { formatPhone, copyPhone } from '../utils/phone-utils';



interface ChatManagerProps {
  initialLeadId?: string | null;
}

const ChatManagerOld: React.FC<ChatManagerProps> = ({ initialLeadId }) => {
  // Função para formatar texto com quebras de linha e links clicáveis
  const formatMessageContent = (content: string, messageType: 'human' | 'ai') => {
    if (!content) return 'Mensagem sem conteúdo';
    
    // Regex para detectar URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    
    // Dividir o texto por quebras de linha
    const lines = content.split(/\\n|\n/);
    
    // Definir classes de cor baseadas no tipo de mensagem
    const linkClasses = messageType === 'human' 
      ? 'text-blue-500 underline hover:no-underline hover:text-blue-700'
      : 'text-white underline hover:no-underline hover:text-gray-200';
    
    return lines.map((line, lineIndex) => {
      // Dividir cada linha por URLs
      const parts = line.split(urlRegex);
      
      return (
        <React.Fragment key={lineIndex}>
          {parts.map((part, partIndex) => {
            // Verificar se a parte é uma URL
            if (urlRegex.test(part)) {
              return (
                <a
                   key={partIndex}
                   href={part}
                   target="_blank"
                   rel="noopener noreferrer"
                   className={linkClasses}
                 >
                   {part}
                 </a>
              );
            }
            return part;
          })}
          {lineIndex < lines.length - 1 && <br />}
        </React.Fragment>
      );
    });
  };
  const [clientes, setClientes] = useState<ChatCliente[]>([]);
  const [selectedCliente, setSelectedCliente] = useState<ChatCliente | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingMoreClientes, setLoadingMoreClientes] = useState(false);
  const [loadingMoreMessages, setLoadingMoreMessages] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [messagesPage, setMessagesPage] = useState(1);
  const [hasMoreClientes, setHasMoreClientes] = useState(true);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [showLeadInfo, setShowLeadInfo] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [leadInfo, setLeadInfo] = useState<Lead | null>(null);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const clientesListRef = useRef<HTMLDivElement>(null);
  const messagesListRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Carregar clientes
  const loadClientes = async (page: number = 1, append: boolean = false) => {
    if (page === 1) {
      setLoading(true);
    } else {
      setLoadingMoreClientes(true);
    }

    try {
      const response = await chatApi.getClientes(page, 500);
      if (response.success) {
        if (append) {
          setClientes(prev => [...prev, ...response.data]);
        } else {
          setClientes(response.data);
        }
        setHasMoreClientes(page < response.pagination.totalPages);
      }
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoading(false);
      setLoadingMoreClientes(false);
    }
  };

  // Carregar mensagens
  const loadMessages = async (sessionId: string, page: number = 1, append: boolean = false) => {
    if (page === 1) {
      setLoadingMessages(true);
    } else {
      setLoadingMoreMessages(true);
    }

    try {
      const response = await chatApi.getMessages(sessionId, page, 50);
      if (response.success) {
        if (append) {
          // Adicionar no início da lista (mensagens mais antigas)
          setMessages(prev => [...response.data, ...prev]);
        } else {
          setMessages(response.data);
          // Scroll para o final quando carregar mensagens pela primeira vez
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
        setHasMoreMessages(page < response.pagination.totalPages);
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      toast.error('Erro ao carregar mensagens');
    } finally {
      setLoadingMessages(false);
      setLoadingMoreMessages(false);
    }
  };

  // Carregar informações do lead
  const loadLeadInfo = async (leadId: string) => {
    try {
      const response = await leadsApi.getLeadById(leadId);
      if (response.success) {
        setLeadInfo(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar informações do lead:', error);
      toast.error('Erro ao carregar informações do lead');
    }
  };

  // Enviar mensagem
  const sendMessage = async () => {
    if (!messageText.trim() || !selectedCliente || sending) return;

    setSending(true);
    try {
      // Converter quebras de linha para \n
      const contentWithLineBreaks = messageText.trim().replace(/\n/g, '\n');
      
      await chatApi.sendMessage({
        session_id: selectedCliente.session_id,
        message: {
          type: 'ai',
          content: contentWithLineBreaks,
          tool_calls: [],
          additional_kwargs: {},
          response_metadata: {},
          invalid_tool_calls: [],
        },
      });

      setMessageText('');
      // Recarregar mensagens
      await loadMessages(selectedCliente.session_id);
      toast.success('Mensagem enviada com sucesso!');
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem');
    } finally {
      setSending(false);
    }
  };

  // Função para lidar com teclas no textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
    // Shift + Enter permite quebra de linha naturalmente
  };

  // Selecionar cliente
  const selectCliente = async (cliente: ChatCliente) => {
    setSelectedCliente(cliente);
    setMessages([]);
    setMessagesPage(1);
    setHasMoreMessages(true);
    setMessageText(''); // Limpar campo de mensagem ao selecionar conversa
    await loadMessages(cliente.session_id);
    await loadLeadInfo(cliente.id);
  };

  // Scroll infinito para clientes
  const handleClientesScroll = () => {
    if (!clientesListRef.current || loadingMoreClientes || !hasMoreClientes) return;

    const { scrollTop, scrollHeight, clientHeight } = clientesListRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 5) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      loadClientes(nextPage, true);
    }
  };

  // Scroll infinito para mensagens (carregar mensagens mais antigas)
  const handleMessagesScroll = () => {
    if (!messagesListRef.current || loadingMoreMessages || !hasMoreMessages) return;

    const { scrollTop } = messagesListRef.current;
    if (scrollTop <= 5) {
      const nextPage = messagesPage + 1;
      setMessagesPage(nextPage);
      loadMessages(selectedCliente!.session_id, nextPage, true);
    }
  };



  // Formatação de data
  const formatTime = (dateString: string) => {
    const [hours, minutes] = dateString.split('T')[1].split(':');
    return `${hours}:${minutes}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoje';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ontem';
    } else {
      return date.toLocaleDateString('pt-BR');
    }
  };

  // Carregar clientes iniciais
  useEffect(() => {
    loadClientes();
  }, []);

  // Processar initialLeadId para selecionar automaticamente o cliente
  useEffect(() => {
    if (initialLeadId && clientes.length > 0) {
      // Buscar o cliente correspondente ao leadId
      const clienteCorrespondente = clientes.find(cliente => cliente.id === initialLeadId);
      if (clienteCorrespondente) {
        selectCliente(clienteCorrespondente);
      }
    }
  }, [initialLeadId, clientes]);

  return (
    <div className="flex bg-gray-50" style={{ height: 'calc(87vh)' }}>
      {/* Lista de Clientes */}
      <div className="w-1/3 bg-white shadow-lg border-r border-gray-200 flex flex-col rounded-l-xl overflow-hidden">
        {/* Header da lista */}
        <div className="p-6 shadow-lg">
          <h2 className="text-xl font-bold">Conversas</h2>
          
          {/* Campo de busca */}
          <div className="relative mt-4">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar conversas..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Lista de clientes */}
        <div
          ref={clientesListRef}
          className="flex-1 overflow-y-auto"
          onScroll={handleClientesScroll}
        >
          {loading && clientes.length === 0 ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {(() => {
                // Filtrar clientes baseado no termo de busca
                const filteredClientes = searchTerm.trim() === '' 
                  ? clientes 
                  : clientes.filter(cliente => {
                      const searchLower = searchTerm.toLowerCase();
                      return (
                        cliente.nome.toLowerCase().includes(searchLower) ||
                        (cliente.telefone && cliente.telefone.includes(searchTerm)) ||
                        (cliente.ultima_mensagem && typeof cliente.ultima_mensagem.content === 'string' && cliente.ultima_mensagem.content.toLowerCase().includes(searchLower))
                      );
                    });
                
                return filteredClientes.map((cliente) => (
                <div
                  key={cliente.id}
                  onClick={() => selectCliente(cliente)}
                  className={`p-4 mx-2 my-1 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] ${selectedCliente?.id === cliente.id
                      ? 'bg-gray-50 border-l-4 border-[#403CCF] shadow-lg'
                      : 'bg-white hover:bg-gray-50 border border-gray-100'
                    }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-[#403CCF] rounded-full flex items-center justify-center shadow-md overflow-hidden">
                      {cliente.profile_picture_url ? (
                        <img 
                          src={cliente.profile_picture_url} 
                          alt={`Foto de ${cliente.nome}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <UserIcon className={`w-6 h-6 text-white ${cliente.profile_picture_url ? 'hidden' : ''}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">
                          {typeof cliente.nome === 'string' ? cliente.nome : JSON.stringify(cliente.nome)}
                        </h3>
                        <div className="flex items-center space-x-1 text-xs text-gray-600 ml-2">
                          <span>{formatDate(cliente.data_ultima_mensagem)}</span>
                          <span>-</span>
                          <span>{formatTime(cliente.data_ultima_mensagem)}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 truncate mt-1">
                        {cliente.ultima_mensagem && cliente.ultima_mensagem.content ? 
                          (typeof cliente.ultima_mensagem.content === 'string' ? cliente.ultima_mensagem.content : JSON.stringify(cliente.ultima_mensagem.content))
                          : 'Sem mensagens'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              ));
              })()}

              {loadingMoreClientes && (
                <div className="flex justify-center items-center p-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Área de Chat */}
      <div className="flex-1 flex flex-col border-b border-gray-200 shadow">
        {selectedCliente ? (
          <>
            {/* Header do chat */}
            <div className="p-6 bg-white border-b border-gray-200 flex items-center justify-between shadow-sm">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-[#403CCF] rounded-full flex items-center justify-center shadow-lg overflow-hidden">
                  {selectedCliente.profile_picture_url ? (
                    <img 
                      src={selectedCliente.profile_picture_url} 
                      alt={`Foto de ${selectedCliente.nome}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <UserIcon className={`w-6 h-6 text-white ${selectedCliente.profile_picture_url ? 'hidden' : ''}`} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{typeof selectedCliente.nome === 'string' ? selectedCliente.nome : JSON.stringify(selectedCliente.nome)}</h3>
                  {leadInfo?.telefone ? (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">{formatPhone(leadInfo.telefone || '')}</span>
                      <button
                        onClick={() => copyPhone(formatPhone(leadInfo.telefone || ''))}
                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        title="Copiar telefone"
                      >
                        <DocumentDuplicateIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Telefone não disponível</p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {/* Toggle AI Agent */}
                <div className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-xl">
                  <span className="text-sm">Agente</span>
                  <button
                    onClick={async () => {
                      if (!leadInfo?.id) return;
                      try {
                        const newValue = !leadInfo.ai_habilitada;
                        const cliente_id = getClienteId();
                        const response = await leadsApi.updateAiHabilitada(leadInfo.id, newValue, cliente_id);
                        if (response.success) {
                          setLeadInfo({ ...leadInfo, ai_habilitada: newValue });
                          toast.success(`AI Agent ${newValue ? 'ativado' : 'desativado'} com sucesso!`);
                        }
                      } catch (error) {
                        console.error('Erro ao atualizar AI Agent:', error);
                        toast.error('Erro ao atualizar AI Agent');
                      }
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 shadow-md ${leadInfo?.ai_habilitada ? 'bg-[#403CCF]' : 'bg-gray-300'}`}
                    title={`AI Agent ${leadInfo?.ai_habilitada ? 'ativo' : 'inativo'}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 shadow-sm ${leadInfo?.ai_habilitada ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                  </button>
                </div>
                
                <button
                  onClick={() => setShowLeadInfo(true)}
                  className="p-3 text-[#403CCF] hover:text-white hover:bg-[#403CCF] bg-gray-50 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
                  title="Ver informações do lead"
                >
                  <InformationCircleIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Mensagens */}
            <div
              ref={messagesListRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 shadow-md"
              onScroll={handleMessagesScroll}
            >
              {loadingMoreMessages && (
                <div className="flex justify-center items-center p-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              )}

              {loadingMessages && messages.length === 0 ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <>
                  {messages.slice().reverse().map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.message?.type === 'human' ? 'justify-start' : 'justify-end'} mb-4`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-5 py-3 rounded-2xl shadow-md ${message.message?.type === 'human'
                            ? 'bg-white border border-gray-200'
                            : 'bg-[#403CCF]'
                          }`}
                      >
                        <div className={`text-sm leading-relaxed ${message.message?.type === 'human' ? 'text-gray-800' : 'text-white'}`}>
                          {message.message && message.message.content ? 
                            (typeof message.message.content === 'string' ? formatMessageContent(message.message.content, message.message.type || 'ai') : JSON.stringify(message.message.content))
                            : 'Mensagem sem conteúdo'
                          }
                        </div>
                        <p className={`text-xs mt-2 ${message.message?.type === 'human' ? 'text-left text-gray-600' : 'text-right text-gray-100'}`}>
                          {formatDate(message.created_at)} - {formatTime(message.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input de mensagem */}
            <div className="p-6 bg-gray-50 border-t border-gray-200">
              <div className="flex space-x-3">
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={leadInfo?.ai_habilitada ? "🤖 Desabilite o agente para enviar mensagem manualmente" : "✍️ Digite sua mensagem... (Shift+Enter para quebrar linha)"}
                  className={`flex-1 px-6 py-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#403CCF] focus:border-[#403CCF] transition-all duration-200 shadow-sm hover:shadow-md resize-none min-h-[56px] max-h-32 ${leadInfo?.ai_habilitada ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                  disabled={sending || leadInfo?.ai_habilitada}
                  rows={1}
                />
                <button
                  onClick={sendMessage}
                  disabled={!messageText.trim() || sending || leadInfo?.ai_habilitada}
                  className="px-6 py-4 bg-[#403CCF] text-white rounded-2xl hover:bg-[#3530B8] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  {sending ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <PaperAirplaneIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-white shadow-lg">
            <div className="text-center p-8">
              <div className="w-24 h-24 bg-[#403CCF] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <UserIcon className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">💬 Selecione uma conversa</h3>
              <p className="text-gray-500 text-lg">Escolha uma conversa da lista para começar a visualizar as mensagens</p>
              <div className="mt-6 text-4xl">👈</div>
            </div>
          </div>
        )}
      </div>

      {/* Painel lateral com informações do lead */}
      {showLeadInfo && (
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col rounded-r-xl overflow-hidden shadow-lg">
          {/* Header do painel */}
          <div className="p-6 flex items-center justify-between border-b border-gray-200 ">
            <div>
              <h3 className="text-xl font-bold">Informações do Lead</h3>
            </div>
            <button
              onClick={() => setShowLeadInfo(false)}
              className="p-2 hover:text-[#403CCF] rounded-xl transition-all duration-200 cursor-pointer"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Conteúdo do painel */}
          <div className="flex-1 p-3 space-y-4">
            {leadInfo ? (
              <>
                {/* Avatar e nome */}
                <div className="text-center">
                  <div 
                    className={`w-16 h-16 bg-[#403CCF] rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg overflow-hidden ${leadInfo.profile_picture_url ? 'cursor-pointer hover:shadow-xl transition-shadow' : ''}`}
                    onClick={() => leadInfo.profile_picture_url && setShowPhotoModal(true)}
                  >
                    {leadInfo.profile_picture_url ? (
                      <img 
                        src={leadInfo.profile_picture_url} 
                        alt="Foto do lead" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <UserIcon className={`w-8 h-8 text-white ${leadInfo.profile_picture_url ? 'hidden' : ''}`} />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 truncate">
                    {typeof leadInfo.nome === 'string' 
                      ? leadInfo.nome 
                      : typeof leadInfo.nome === 'object' && leadInfo.nome && 'nome' in leadInfo.nome 
                        ? (leadInfo.nome as any).nome 
                        : 'Nome não disponível'
                    }
                  </h4>
                  <div className="w-12 h-0.5 bg-[#403CCF] rounded-full mx-auto mt-1"></div>
                </div>

                {/* Informações compactas */}
                <div className="space-y-2">
                  <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-green-400 rounded-full flex items-center justify-center flex-shrink-0">
                        <PhoneIcon className="w-3 h-3 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-600">Telefone</p>
                        <p className="text-sm font-semibold text-gray-900 truncate">
                           {typeof leadInfo.telefone === 'string' 
                             ? leadInfo.telefone 
                             : typeof leadInfo.telefone === 'object' && leadInfo.telefone && 'nome' in leadInfo.telefone 
                               ? (leadInfo.telefone as any).nome 
                               : 'N/A'
                           }
                         </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-orange-50 p-2 rounded-lg border border-orange-100">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-orange-400 rounded-full flex items-center justify-center flex-shrink-0">
                        <EnvelopeIcon className="w-3 h-3 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-600">Email</p>
                        <p className="text-sm font-semibold text-gray-900 truncate">
                           {typeof leadInfo.email === 'string' 
                             ? leadInfo.email 
                             : typeof leadInfo.email === 'object' && leadInfo.email && 'nome' in leadInfo.email 
                               ? (leadInfo.email as any).nome 
                               : 'N/A'
                           }
                         </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 p-2 rounded-lg border border-purple-100">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-purple-400 rounded-full flex items-center justify-center flex-shrink-0">
                        <CalendarIcon className="w-3 h-3 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-600">Criado em</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {leadInfo.created_at ? new Date(leadInfo.created_at).toLocaleDateString('pt-BR') : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 p-2 rounded-lg border border-yellow-100">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0">
                        <TagIcon className="w-3 h-3 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-600">Origem</p>
                        <p className="text-sm font-semibold text-gray-900 truncate">
                           {typeof leadInfo.origem === 'string' 
                             ? leadInfo.origem 
                             : typeof leadInfo.origem === 'object' && leadInfo.origem && 'nome' in leadInfo.origem 
                               ? (leadInfo.origem as any).nome 
                               : 'N/A'
                           }
                         </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status AI Agent compacto */}
                <div className="bg-gray-50 p-2 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">🤖</span>
                      <span className="text-sm font-semibold text-gray-900">AI Agent</span>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${leadInfo?.ai_habilitada ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {leadInfo?.ai_habilitada ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal da foto */}
      {showPhotoModal && leadInfo?.profile_picture_url && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={() => setShowPhotoModal(false)}>
          <div className="relative max-w-4xl max-h-4xl p-4">
            <button
              onClick={() => setShowPhotoModal(false)}
              className="absolute top-2 right-2 text-white hover:text-gray-300 z-10"
            >
              <XMarkIcon className="w-8 h-8" />
            </button>
            <img
              src={leadInfo.profile_picture_url}
              alt="Foto do lead"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatManagerOld;