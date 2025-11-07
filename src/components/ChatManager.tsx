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
  ExclamationCircleIcon,
  ArrowPathIcon,
  PhotoIcon,
  MicrophoneIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import { chatApi, Chat, ChatMessage } from '../services/chatApi';
import { leadsApi, Lead } from '../services/leadsApi';
import { getClienteId } from '../utils/cliente-utils';
import { formatPhone, copyPhone } from '../utils/phone-utils';
import { ErrorHandler } from '../utils/error-handler';
import { formatTime } from '../utils/date-utils';
import Modal from './Modal';

interface ChatManagerProps {
  initialLeadId?: string | null;
}

const ChatManager: React.FC<ChatManagerProps> = ({ initialLeadId }) => {
  // Função para verificar se uma string é base64 válida
  const isBase64 = (str: string): boolean => {
    try {
      // Verificar se é uma data URL
      if (str.startsWith('data:')) {
        return true;
      }

      // Verificar se é base64 puro (sem prefixo data:)
      const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
      if (str.length % 4 === 0 && base64Regex.test(str)) {
        // Tentar decodificar para verificar se é válido
        atob(str);
        return true;
      }

      return false;
    } catch {
      return false;
    }
  };

  // Função para detectar o tipo de mídia em dados base64
  const detectMediaType = (content: string): 'image' | 'audio' | 'text' => {
    if (!content) return 'text';

    // Verificar se é uma data URL
    if (content.startsWith('data:')) {
      if (content.startsWith('data:image/')) {
        return 'image';
      }
      if (content.startsWith('data:audio/')) {
        return 'audio';
      }
    }

    // Verificar se é base64 puro e tentar detectar pelo conteúdo
    if (isBase64(content)) {
      try {
        // Decodificar os primeiros bytes para verificar assinaturas de arquivo
        const decoded = atob(content.substring(0, 100));
        const bytes = new Uint8Array(decoded.length);
        for (let i = 0; i < decoded.length; i++) {
          bytes[i] = decoded.charCodeAt(i);
        }

        // Verificar assinaturas de imagem
        if (bytes[0] === 0xFF && bytes[1] === 0xD8) return 'image'; // JPEG
        if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) return 'image'; // PNG
        if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return 'image'; // GIF
        if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) return 'audio'; // WAV
        if (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) return 'audio'; // MP3
        if (bytes[0] === 0x4F && bytes[1] === 0x67 && bytes[2] === 0x67 && bytes[3] === 0x53) return 'audio'; // OGG
      } catch {
        // Se falhar ao decodificar, tratar como texto
      }
    }

    return 'text';
  };

  // Função para detectar tipo de mídia na última mensagem
  const getLastMessageType = (ultimaMensagem: any): 'image' | 'audio' | 'text' => {
    if (!ultimaMensagem) return 'text';

    const messageContent = typeof ultimaMensagem === 'string' ? ultimaMensagem : JSON.stringify(ultimaMensagem);
    return detectMediaType(messageContent);
  };

  // Componente para renderizar imagem base64
  const Base64Image: React.FC<{ content: string }> = ({ content }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [showModal, setShowModal] = useState(false);

    const imageUrl = content.startsWith('data:') ? content : `data:image/jpeg;base64,${content}`;

    return (
      <>
        <div className="max-w-xs">
          {loading && (
            <div className="flex items-center justify-center h-32 bg-gray-100 rounded-lg">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          )}
          {error ? (
            <div className="flex items-center justify-center h-32 bg-gray-100 rounded-lg">
              <span className="text-gray-500 text-sm">Erro ao carregar imagem</span>
            </div>
          ) : (
            <img
              src={imageUrl}
              alt="Imagem enviada"
              className={`max-w-full h-auto rounded-lg shadow-md cursor-pointer hover:opacity-80 transition-opacity ${loading ? 'hidden' : ''}`}
              onLoad={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setError(true);
              }}
              onClick={() => setShowModal(true)}
            />
          )}
        </div>

        {/* Modal para exibir imagem em tamanho full */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Visualizar Imagem"
          size="6xl"
          className="p-0"
        >
          <div className="flex items-center justify-center">
            <img
              src={imageUrl}
              alt="Imagem em tamanho full"
              className="max-w-full max-h-[80vh] object-contain rounded-lg border border-gray-200"
            />
          </div>
        </Modal>
      </>
    );
  };

  // Componente para renderizar áudio base64
  const Base64Audio: React.FC<{ content: string }> = ({ content }) => {
    const [error, setError] = useState(false);

    const audioUrl = content.startsWith('data:') ? content : `data:audio/mpeg;base64,${content}`;

    if (error) {
      return (
        <div className="flex items-center space-x-2 p-3 bg-gray-100 rounded-lg">
          <ExclamationCircleIcon className="w-5 h-5 text-red-500" />
          <span className="text-gray-500 text-sm">Erro ao carregar áudio</span>
        </div>
      );
    }

    return (
      <div className="w-xs">
        <audio
          controls
          className="w-full"
          onError={() => setError(true)}
        >
          <source src={audioUrl} type="audio/mpeg" />
          <source src={audioUrl} type="audio/wav" />
          <source src={audioUrl} type="audio/ogg" />
          Seu navegador não suporta o elemento de áudio.
        </audio>
      </div>
    );
  };

  // Componente para exibir última mensagem com ícone
  const LastMessageDisplay: React.FC<{ ultimaMensagem: any }> = ({ ultimaMensagem }) => {
    if (!ultimaMensagem) {
      return <span className="text-gray-500">Sem mensagens</span>;
    }

    const messageType = getLastMessageType(ultimaMensagem);
    const messageContent = typeof ultimaMensagem === 'string' ? ultimaMensagem : JSON.stringify(ultimaMensagem);

    switch (messageType) {
      case 'image':
        return (
          <div className="flex items-center space-x-2">
            <PhotoIcon className="h-4 w-4 text-gray-500 flex-shrink-0" />
            <span className="text-gray-500 truncate">Imagem</span>
          </div>
        );
      case 'audio':
        return (
          <div className="flex items-center space-x-2">
            <MicrophoneIcon className="h-4 w-4 text-gray-500 flex-shrink-0" />
            <span className="text-gray-500 truncate">Áudio</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center space-x-2">
            <span className="text-gray-500 truncate">{messageContent}</span>
          </div>
        )
    }
  };

  // Função para renderizar conteúdo da mensagem com suporte a base64
  const renderMessageContent = (content: string, messageType: 'human' | 'ai') => {
    if (!content) return 'Mensagem sem conteúdo';

    const mediaType = detectMediaType(content);

    switch (mediaType) {
      case 'image':
        return <Base64Image content={content} />;
      case 'audio':
        return <Base64Audio content={content} />;
      default:
        return formatMessageContent(content, messageType);
    }
  };

  // Função para formatar texto com quebras de linha, links clicáveis e formatação WhatsApp
  const formatMessageContent = (content: string, messageType: 'human' | 'ai') => {
    if (!content) return 'Mensagem sem conteúdo';

    // Remover barras invertidas literais do conteúdo
    const cleanContent = content.replace(/\\/g, '');

    // Regex para detectar URLs e formatação
    // Removido flag global do URL para evitar problemas com lastIndex em .test()
    const urlRegex = /(https?:\/\/[^\s]+)/;
    // Simplificados sem lookbehind para garantir compatibilidade ampla
    const boldRegex = /\*([^*\n]+)\*/g;
    const italicRegex = /_([^_\n]+)_/g;
    const strikeRegex = /~([^~\n]+)~/g;
    const monoRegex = /`([^`\n]+)`/g;

    // Utilitário: escapar HTML para evitar XSS quando usamos dangerouslySetInnerHTML
    const escapeHtml = (s: string) =>
      s.replace(/&/g, '&amp;')
       .replace(/</g, '&lt;')
       .replace(/>/g, '&gt;')
       .replace(/\"/g, '&quot;')
       .replace(/'/g, '&#039;');

    // Dividir o texto por quebras de linha
    const lines = cleanContent.split(/\n/);

    // Definir classes de cor baseadas no tipo de mensagem
    const linkClasses = messageType === 'human'
      ? 'text-blue-500 underline hover:no-underline hover:text-blue-700'
      : 'text-white underline hover:no-underline hover:text-gray-200';

    // Função para processar formatação de texto
    const processFormatting = (text: string) => {
      const safe = escapeHtml(text);
      // Processar na ordem correta
      return safe
        // Primeiro código monoespaçado para evitar conflitos
        .replace(monoRegex, (_, content) => `<span class="font-mono bg-gray-100 rounded px-1">${content}</span>`)
        // Depois as outras formatações
        .replace(boldRegex, (_, content) => `<span class="font-bold">${content}</span>`)
        .replace(italicRegex, (_, content) => `<span class="italic">${content}</span>`)
        .replace(strikeRegex, (_, content) => `<span class="line-through">${content}</span>`);
    };

    return lines.map((line, lineIndex) => {
      // Dividir cada linha por URLs
      const parts = line.split(urlRegex);

      return (
        <React.Fragment key={lineIndex}>
          {parts.map((part, partIndex) => {
            // Verificar se a parte é uma URL
            if (urlRegex.test(part)) {
              // Função para limpar e formatar o URL para exibição
              const formatUrlDisplay = (url: string) => {
                try {
                  const urlObj = new URL(url);
                  let displayText = urlObj.hostname + urlObj.pathname;
                  
                  // Remover www. se presente
                  if (displayText.startsWith('www.')) {
                    displayText = displayText.substring(4);
                  }
                  
                  // Remover barra final se presente
                  if (displayText.endsWith('/')) {
                    displayText = displayText.slice(0, -1);
                  }
                  
                  // Limitar o tamanho se muito longo
                  if (displayText.length > 40) {
                    displayText = displayText.substring(0, 37) + '...';
                  }
                  
                  return displayText;
                } catch {
                  // Se não conseguir fazer parse, retorna o URL original
                  return part;
                }
              };
              
              return (
                <a
                  key={partIndex}
                  href={part}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${linkClasses} break-words`}
                  title={part}
                >
                  🔗 {formatUrlDisplay(part)}
                </a>
              );
            }
            // Processar formatação de texto para partes não-URL
            const formattedText = processFormatting(part);
            
            // Se o texto contém tags HTML (foi formatado), usar dangerouslySetInnerHTML
            if (formattedText.includes('<span')) {
              return (
                <span
                  key={partIndex}
                  dangerouslySetInnerHTML={{ __html: formattedText }}
                  className="whitespace-pre-wrap"
                />
              );
            }
            
            // Se não tem formatação, retornar o texto normal
            return <span key={partIndex} className="whitespace-pre-wrap">{part}</span>;
          })}
          {lineIndex < lines.length - 1 && <br />}
        </React.Fragment>
      );
    });
  };
  const [leads, setLeads] = useState<Chat[]>([]);
  const [selectedLead, setSelectedLead] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingMoreLeads, setLoadingMoreLeads] = useState(false);
  const [loadingMoreMessages, setLoadingMoreMessages] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [messagesPage, setMessagesPage] = useState(1);
  const [hasMoreLeads, setHasMoreLeads] = useState(true);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [showLeadInfo, setShowLeadInfo] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [leadInfo, setLeadInfo] = useState<Lead | null>(null);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showChatOnMobile, setShowChatOnMobile] = useState(false);

  const leadsListRef = useRef<HTMLDivElement>(null);
  const messagesListRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const leadItemRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Carregar leads
  const loadLeads = async (page: number = 1, append: boolean = false) => {
    if (page === 1) {
      setLoading(true);
    } else {
      setLoadingMoreLeads(true);
    }

    try {
      const response = await chatApi.getChats();
      if (response.success) {
        if (append) {
          setLeads(prev => [...prev, ...response.data]);
        } else {
          setLeads(response.data);
        }
        setHasMoreLeads(page < response.pagination.totalPages);
      }
    } catch (error) {
      console.error('Erro ao carregar leads:', error);
      toast.error('Erro ao carregar leads');
    } finally {
      setLoading(false);
      setLoadingMoreLeads(false);
    }
  };

  // Notificar quando está em uma conversa (para ocultar header no mobile)
  useEffect(() => {
    const event = new CustomEvent('chatStateChange', { 
      detail: { inChat: !!showChatOnMobile } 
    });
    window.dispatchEvent(event);
  }, [showChatOnMobile]);

  // Ajustar viewport quando o teclado abrir no mobile
  useEffect(() => {
    const handleResize = () => {
      // Forçar scroll para o input quando o teclado abrir
      if (document.activeElement?.tagName === 'TEXTAREA') {
        setTimeout(() => {
          document.activeElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
      }
    };

    window.addEventListener('resize', handleResize);
    window.visualViewport?.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('resize', handleResize);
    };
  }, []);

  // Carregar mensagens
  const loadMessages = async (id: string, page: number = 1, append: boolean = false) => {
    if (page === 1) {
      setLoadingMessages(true);
    } else {
      setLoadingMoreMessages(true);
    }

    try {
      const response = await chatApi.getMessages(id, page, 50);
      if (response.success) {
        if (append) {
          // Adicionar no início da lista (mensagens mais antigas)
          setMessages(prev => [...response.data, ...prev]);
        } else {
          setMessages(response.data);
          // Garantir que o scroll fique no final sem animação
          setTimeout(() => {
            if (messagesListRef.current) {
              messagesListRef.current.scrollTop = messagesListRef.current.scrollHeight;
            }
          }, 300);
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

  // Scroll infinito para leads
  const handleLeadsScroll = () => {
    if (!leadsListRef.current || loadingMoreLeads || !hasMoreLeads) return;

    const { scrollTop, scrollHeight, clientHeight } = leadsListRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 5) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      loadLeads(nextPage, true);
    }
  };

  // Scroll automático para o lead específico
  const scrollToLead = (leadId: string) => {
    const leadElement = leadItemRefs.current[leadId];
    if (leadElement && leadsListRef.current) {
      leadElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });
    }
  };

  // Enviar mensagem
  const sendMessage = async () => {
    if (!messageText.trim() || !selectedLead || sending) return;

    setSending(true);
    try {
      // Converter quebras de linha para \n
      const contentWithLineBreaks = messageText.trim().replace(/\n/g, '\n');

      await chatApi.sendMessage({
        lead_id: selectedLead.id,
        mensagem: contentWithLineBreaks,
        tipo: 'ai',
        source: 'crm',
      });

      setMessageText('');
      // Recarregar mensagens
      await loadMessages(selectedLead.id);
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

  // Selecionar lead
  const selectLead = async (lead: Chat) => {
    setSelectedLead(lead);
    setMessages([]);
    setMessagesPage(1);
    setHasMoreMessages(true);
    setMessageText(''); // Limpar campo de mensagem ao selecionar conversa
    setShowChatOnMobile(true); // Mostrar chat no mobile
    await loadMessages(lead.id);
    await loadLeadInfo(lead.id);

    // Garantir que a rolagem fique no final após selecionar um lead (sem animação)
    setTimeout(() => {
      if (messagesListRef.current) {
        messagesListRef.current.scrollTop = messagesListRef.current.scrollHeight;
      }
    }, 500);
  };

  // Voltar para lista no mobile
  const backToList = () => {
    setShowChatOnMobile(false);
    setSelectedLead(null);
  };

  // Scroll infinito para mensagens (carregar mensagens mais antigas)
  const handleMessagesScroll = () => {
    if (!messagesListRef.current || loadingMoreMessages || !hasMoreMessages) return;

    const { scrollTop } = messagesListRef.current;
    if (scrollTop <= 5) {
      const nextPage = messagesPage + 1;
      setMessagesPage(nextPage);
      loadMessages(selectedLead!.id, nextPage, true);
    }
  };

  // Formatação de data
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '--';

    try {
      const date = new Date(dateString.replace('+00:00', ''));
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
    } catch (error) {
      console.error('Erro ao formatar data:', error, dateString);
      return '--';
    }
  };

  // Carregar leads iniciais
  useEffect(() => {
    loadLeads();
  }, []);

  // Processar initialLeadId para selecionar automaticamente o lead
  useEffect(() => {
    if (initialLeadId && leads.length > 0) {
      // Buscar o lead correspondente ao leadId
      const leadCorrespondente = leads.find(lead => lead.id === initialLeadId);
      if (leadCorrespondente) {
        selectLead(leadCorrespondente);
        // Fazer scroll automático até o lead após um pequeno delay para garantir que o elemento foi renderizado
        setTimeout(() => {
          scrollToLead(initialLeadId);
        }, 300);
      }
    }
  }, [initialLeadId, leads]);

  return (
    <div className="flex h-full w-full bg-gray-50 overflow-hidden md:rounded-lg">
      {/* Lista de Leads */}
      <div className={`w-full md:w-1/3 bg-white shadow-lg border-r border-gray-200 flex flex-col overflow-hidden md:rounded-l-lg ${showChatOnMobile ? 'hidden md:flex' : 'flex'}`}>
        {/* Header da lista */}
        <div className="p-3 md:p-4 shadow-lg flex-shrink-0">
          <div className="flex justify-between items-center">
            <h2 className="text-base md:text-lg font-bold">Conversas</h2>
            <button
              onClick={() => {
                setCurrentPage(1);
                loadLeads(1, false);
              }}
              className="p-2 text-[#403CCF] hover:text-white hover:bg-[#403CCF] bg-gray-50 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
              title="Atualizar conversas"
              disabled={loading}
            >
              <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Campo de busca */}
          <div className="relative mt-3 md:mt-4">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar..."
              className="w-full pl-9 pr-3 py-2 text-xs md:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Lista de leads */}
        <div
          ref={leadsListRef}
          className="flex-1 overflow-y-auto"
          onScroll={handleLeadsScroll}
        >
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {(() => {
                // Filtrar leads baseado no termo de busca
                const filteredLeads = searchTerm.trim() === ''
                  ? leads
                  : leads.filter(lead => {
                    const searchLower = searchTerm.toLowerCase();
                    return (
                      lead.nome.toLowerCase().includes(searchLower) ||
                      (lead.telefone && lead.telefone.includes(searchTerm)) ||
                      (lead.ultima_mensagem && typeof lead.ultima_mensagem === 'string' && lead.ultima_mensagem.toLowerCase().includes(searchLower))
                    );
                  });

                return filteredLeads.map((lead) => (
                  <div
                    key={lead.id}
                    ref={(el) => {
                      leadItemRefs.current[lead.id] = el;
                    }}
                    onClick={() => selectLead(lead)}
                    className={`p-2 md:p-3 mx-1 md:mx-2 my-1 rounded-lg md:rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.01] md:hover:scale-[1.02] ${selectedLead?.id === lead.id
                      ? 'bg-gray-50 border-l-4 border-[#403CCF] shadow-lg'
                      : 'bg-white hover:bg-gray-50 border border-gray-100'
                      }`}
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-9 h-9 md:w-10 md:h-10 bg-[#403CCF] rounded-full flex items-center justify-center shadow-md overflow-hidden flex-shrink-0">
                        {lead.profile_picture_url ? (
                          <img
                            src={lead.profile_picture_url}
                            alt={`Foto de ${lead.nome}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <UserIcon className={`w-4 h-4 md:w-5 md:h-5 text-white ${lead.profile_picture_url ? 'hidden' : ''}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-1">
                          <h3 className="text-xs md:text-sm font-semibold text-gray-900 truncate">
                            {typeof lead.nome === 'string' ? lead.nome : JSON.stringify(lead.nome)}
                          </h3>
                          <div className="flex items-center space-x-0.5 md:space-x-1 text-[10px] md:text-xs text-gray-600 flex-shrink-0">
                            <span className="hidden sm:inline">{formatDate(lead.data_ultima_mensagem)}</span>
                            <span className="hidden sm:inline">-</span>
                            <span>{formatTime(lead.data_ultima_mensagem)}</span>
                          </div>
                        </div>
                        <div className="text-xs md:text-sm mt-1">
                          <LastMessageDisplay ultimaMensagem={lead.ultima_mensagem} />
                        </div>
                      </div>
                    </div>
                  </div>
                ));
              })()}

              {loadingMoreLeads && (
                <div className="flex justify-center items-center p-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Área de Chat */}
      <div className={`flex-1 flex flex-col border-b border-gray-200 shadow md:rounded-r-lg ${!showChatOnMobile ? 'hidden md:flex' : 'flex'}`}>
        {selectedLead ? (
          <>
            {/* Header do chat */}
            <div className="p-2 md:p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between shadow-sm flex-shrink-0 safe-top">
              <div className="flex items-center space-x-1.5 md:space-x-3 flex-1 min-w-0">
                {/* Botão voltar (mobile) */}
                <button
                  onClick={backToList}
                  className="md:hidden p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0"
                  title="Voltar para lista"
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                </button>
                <div className="w-9 h-9 md:w-12 md:h-12 bg-[#403CCF] rounded-full flex items-center justify-center shadow-lg overflow-hidden flex-shrink-0">
                  {selectedLead.profile_picture_url ? (
                    <img
                      src={selectedLead.profile_picture_url}
                      alt={`Foto de ${selectedLead.nome}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <UserIcon className={`w-4 h-4 md:w-6 md:h-6 text-white ${selectedLead.profile_picture_url ? 'hidden' : ''}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm md:text-base font-bold text-gray-900 dark:text-white truncate">{typeof selectedLead.nome === 'string' ? selectedLead.nome : JSON.stringify(selectedLead.nome)}</h3>
                  {leadInfo?.telefone ? (
                    <div className="flex items-center space-x-1 md:space-x-2">
                      <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400 truncate">{formatPhone(leadInfo.telefone || '')}</span>
                      <button
                        onClick={() => copyPhone(formatPhone(leadInfo.telefone || ''))}
                        className="p-0.5 md:p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors flex-shrink-0"
                        title="Copiar telefone"
                      >
                        <DocumentDuplicateIcon className="w-3 h-3 md:w-4 md:h-4" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">Telefone não disponível</p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-1.5 md:space-x-2 flex-shrink-0">
                {/* Toggle Agente AI */}
                <div className="flex items-center space-x-1.5 md:space-x-2 bg-gray-50 dark:bg-gray-800 px-2 md:px-3 py-1.5 md:py-2 rounded-lg">
                  <span className="text-xs md:text-sm font-medium dark:text-gray-300 hidden sm:inline">Agente</span>
                  <button
                    onClick={async () => {
                      if (!leadInfo?.id) return;
                      try {
                        const newValue = !leadInfo.ai_habilitada;
                        const lead_id = getClienteId();
                        const response = await leadsApi.updateAiHabilitada(leadInfo.id, newValue, lead_id);
                        if (response.success) {
                          setLeadInfo({ ...leadInfo, ai_habilitada: newValue });
                          toast.success(`Agente AI ${newValue ? 'ativado' : 'desativado'} com sucesso!`);
                        }
                      } catch (error) {
                        console.error('Erro ao atualizar Agente AI:', error);
                        toast.error('Erro ao atualizar Agente AI');
                      }
                    }}
                    className={`relative inline-flex h-5 w-9 md:h-6 md:w-11 items-center rounded-full transition-all duration-300 shadow-sm ${leadInfo?.ai_habilitada ? 'bg-[#403CCF]' : 'bg-gray-300'}`}
                    title={`Agente AI ${leadInfo?.ai_habilitada ? 'ativo' : 'inativo'}`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 md:h-4 md:w-4 transform rounded-full bg-white transition-transform duration-300 shadow-sm ${leadInfo?.ai_habilitada ? 'translate-x-5 md:translate-x-6' : 'translate-x-0.5 md:translate-x-1'}`}
                    />
                  </button>
                </div>

                <button
                  onClick={() => {
                    setMessagesPage(1);
                    loadMessages(selectedLead.id, 1, false);
                  }}
                  className="p-2 md:p-2.5 text-[#403CCF] dark:text-primary hover:text-white hover:bg-[#403CCF] dark:hover:bg-primary bg-gray-50 dark:bg-gray-800 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                  title="Atualizar mensagens"
                  disabled={loadingMessages}
                >
                  <ArrowPathIcon className={`w-5 h-5 md:w-6 md:h-6 ${loadingMessages ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Mensagens */}
            <div
              ref={messagesListRef}
              className="flex-1 overflow-y-auto p-2 md:p-3 pb-20 md:pb-3 space-y-2 md:space-y-3 bg-gray-50 dark:bg-gray-950"
              onScroll={handleMessagesScroll}
            >
              {loadingMoreMessages && (
                <div className="flex justify-center items-center p-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              )}

              {loadingMessages ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <>
                  {messages.slice().reverse().map((message, index) => (
                    <div
                      key={`${message.id}-${index}`}
                      className={`flex ${message.tipo === 'human' ? 'justify-start' : 'justify-end'} mb-2 md:mb-4`}
                    >
                      {(message.status === 'erro' && message.erro && message.tipo === 'ai') && (
                        <div
                          className={`relative group flex items-center m-1`}
                          title={ErrorHandler.handleError(message.erro)}
                        >
                          <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
                        </div>
                      )}
                      <div
                        className={`max-w-[75%] md:max-w-xs lg:max-w-md px-3 md:px-4 py-2 rounded-2xl shadow-md 
                          ${message.tipo === 'human' ? 'bg-white border border-gray-200' : 'bg-[#403CCF]'}
                          ${message.status === 'erro' && message.erro ? 'opacity-75' : ''}
                          `}
                      >
                        <div className={`text-md md:text-sm leading-relaxed font-normal break-words ${message.tipo === 'human' ? 'text-gray-800' : 'text-white'}`}>
                          {message.mensagem && message.mensagem ?
                            (typeof message.mensagem === 'string' ? renderMessageContent(message.mensagem, message.tipo || 'ai') : JSON.stringify(message.mensagem))
                            : 'Mensagem sem conteúdo'
                          }
                        </div>
                        <div className="flex justify-end">
                          <p className={`text-[12px] mt-1 ${message.tipo === 'human' ? 'text-gray-600' : 'text-gray-100'}`}>
                            {formatDate(message.created_at)} - {formatTime(message.created_at)}
                            {message.source && <span> - {message.source}</span>}
                          </p>
                        </div>
                      </div>
                      {(message.status === 'erro' && message.erro && message.tipo === 'human') && (
                        <div
                          className={`relative group flex items-center m-1`}
                          title={ErrorHandler.handleError(message.erro)}
                        >
                          <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input de mensagem - Fixo na parte inferior no mobile */}
            <div className="fixed md:sticky bottom-0 left-0 right-0 md:left-auto md:right-auto p-2 md:p-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 z-50 safe-bottom">
              <div className="flex space-x-2 items-end">
                <textarea
                  ref={textareaRef}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={(e) => {
                    // Scroll para o input quando receber foco (mobile)
                    setTimeout(() => {
                      e.target.scrollIntoView({ behavior: 'smooth', block: 'end' });
                    }, 300);
                  }}
                  placeholder={leadInfo?.ai_habilitada ? "🤖 Desabilite o agente para enviar mensagens" : "✍️ Digite sua mensagem..."}
                  className={`flex-1 px-2 md:px-3 py-2 text-xs md:text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#403CCF] focus:border-[#403CCF] transition-all duration-200 resize-none min-h-[40px] max-h-24 md:max-h-32 ${leadInfo?.ai_habilitada ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : 'bg-white dark:bg-gray-800 dark:text-white'}`}
                  disabled={sending || leadInfo?.ai_habilitada}
                  rows={1}
                />
                <button
                  onClick={sendMessage}
                  disabled={!messageText.trim() || sending || leadInfo?.ai_habilitada}
                  className="px-3 py-3 bg-[#403CCF] text-white rounded-lg hover:bg-[#3530B8] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex-shrink-0"
                >
                  {sending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <PaperAirplaneIcon className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-white shadow-lg">
            <div className="text-center p-8">
              <div className="w-20 h-20 bg-[#403CCF] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <UserIcon className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">💬 Selecione uma conversa</h3>
              <p className="text-gray-500 text-base">Escolha uma conversa da lista para começar a visualizar as mensagens</p>
              <div className="mt-6 text-3xl">👈</div>
            </div>
          </div>
        )}
      </div>

      {/* Painel lateral com informações do lead */}
      {showLeadInfo && (
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col rounded-r-xl overflow-hidden shadow-lg">
          {/* Header do painel */}
          <div className="p-4 flex items-center justify-between border-b border-gray-200 ">
            <div>
              <h3 className="text-lg font-bold">Informações do Lead</h3>
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
                    className={`w-14 h-14 bg-[#403CCF] rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg overflow-hidden ${leadInfo.profile_picture_url ? 'cursor-pointer hover:shadow-xl transition-shadow' : ''}`}
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
                    <UserIcon className={`w-7 h-7 text-white ${leadInfo.profile_picture_url ? 'hidden' : ''}`} />
                  </div>
                  <h4 className="text-base font-bold text-gray-900 truncate">
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

                {/* Status Agente AI compacto */}
                <div className="bg-gray-50 p-2 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">🤖</span>
                      <span className="text-sm font-semibold text-gray-900">Agente AI</span>
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

export default ChatManager;