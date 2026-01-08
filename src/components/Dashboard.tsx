'use client';

import React, { useState, useEffect } from 'react';
import { leadsApi, RelatorioDiario } from '../services/leadsApi';
import { evolutionApiV2, EvolutionInstancesV2 } from '../services/evolutionApiV2';
import { formatPhoneDisplay } from '../utils/phone-utils';
import { useCliente } from '../contexts/ClienteContext';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import WhatsAppActionsModal from './WhatsAppActionsModal';
import {
  UsersIcon,
  XCircleIcon,
  PlusIcon,
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  PencilIcon,
  TrashIcon,
  QrCodeIcon,
  PowerIcon,
  UserPlusIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';

export default function Dashboard() {
  const router = useRouter();
  const { selectedClienteId } = useCliente();
  const [relatorio, setRelatorio] = useState<RelatorioDiario | null>(null);
  const [loadingRelatorio, setLoadingRelatorio] = useState(true);
  
  // Formatar número com ponto de milhar
  const formatarNumero = (num: number): string => {
    return num.toLocaleString('pt-BR');
  };
  
  // Inicializar com data de hoje (local, sem conversão de timezone)
  const getDataHojeLocal = () => {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  };
  
  const hoje = getDataHojeLocal();
  const [dataInicio, setDataInicio] = useState<string>(hoje);
  const [dataFim, setDataFim] = useState<string>(hoje);
  const [periodoAtivo, setPeriodoAtivo] = useState<'hoje' | 'ontem' | '7dias' | '30dias' | 'custom'>('hoje');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDataInicio, setTempDataInicio] = useState<string>(hoje);
  const [tempDataFim, setTempDataFim] = useState<string>(hoje);
  
  // Formatar data para exibição em português
  const formatarDataPtBr = (dataStr: string): string => {
    if (!dataStr) return '';
    const [ano, mes, dia] = dataStr.split('-');
    return `${dia}/${mes}/${ano}`;
  };
  
  const getTextoDataRange = (): string => {
    if (dataInicio === dataFim) {
      return formatarDataPtBr(dataInicio);
    }
    return `${formatarDataPtBr(dataInicio)} - ${formatarDataPtBr(dataFim)}`;
  };
  
  // Funções para o calendário
  const getDiasNoMes = (ano: number, mes: number): number => {
    return new Date(ano, mes + 1, 0).getDate();
  };
  
  const getPrimeiroDiaSemana = (ano: number, mes: number): number => {
    return new Date(ano, mes, 1).getDay();
  };
  
  const getNomeMes = (mes: number): string => {
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                   'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    return meses[mes];
  };
  
  const [mesAtual, setMesAtual] = useState(new Date().getMonth());
  const [anoAtual, setAnoAtual] = useState(new Date().getFullYear());
  
  const handleDiaClick = async (dia: number, mes: number, ano: number) => {
    const dataStr = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    
    // Se não tem início ou se já tem início e fim (resetar para nova seleção)
    if (!tempDataInicio || (tempDataInicio && tempDataFim && tempDataInicio !== tempDataFim)) {
      // Primeira seleção - marca apenas o início
      setTempDataInicio(dataStr);
      setTempDataFim('');
    } else if (tempDataInicio && !tempDataFim) {
      // Segunda seleção - define o fim e aplica automaticamente
      let novaDataInicio = tempDataInicio;
      let novaDataFim = dataStr;
      
      if (dataStr < tempDataInicio) {
        // Se clicar em data anterior, inverte
        novaDataInicio = dataStr;
        novaDataFim = tempDataInicio;
      }
      
      setTempDataInicio(novaDataInicio);
      setTempDataFim(novaDataFim);
      
      // Aplicar automaticamente
      setDataInicio(novaDataInicio);
      setDataFim(novaDataFim);
      setPeriodoAtivo('custom');
      setShowDatePicker(false);
      
      // Carregar relatório
      setLoadingRelatorio(true);
      try {
        const clienteId = selectedClienteId || undefined;
        const response = await leadsApi.getRelatorioDiario(novaDataInicio, novaDataFim, clienteId);
        if (response.success && response.data) {
          setRelatorio(response.data);
        }
      } catch (error) {
        console.error('Erro ao carregar relatório:', error);
      } finally {
        setLoadingRelatorio(false);
      }
    } else if (tempDataInicio === tempDataFim) {
      // Se tem apenas um dia selecionado, define o fim e aplica
      let novaDataInicio = tempDataInicio;
      let novaDataFim = dataStr;
      
      if (dataStr < tempDataInicio) {
        novaDataInicio = dataStr;
        novaDataFim = tempDataInicio;
      }
      
      setTempDataInicio(novaDataInicio);
      setTempDataFim(novaDataFim);
      
      // Aplicar automaticamente
      setDataInicio(novaDataInicio);
      setDataFim(novaDataFim);
      setPeriodoAtivo('custom');
      setShowDatePicker(false);
      
      // Carregar relatório
      setLoadingRelatorio(true);
      try {
        const clienteId = selectedClienteId || undefined;
        const response = await leadsApi.getRelatorioDiario(novaDataInicio, novaDataFim, clienteId);
        if (response.success && response.data) {
          setRelatorio(response.data);
        }
      } catch (error) {
        console.error('Erro ao carregar relatório:', error);
      } finally {
        setLoadingRelatorio(false);
      }
    }
  };
  
  const isDiaNoRange = (dia: number, mes: number, ano: number): boolean => {
    if (!tempDataInicio) return false;
    const dataStr = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    
    // Se só tem data início, não marca range
    if (!tempDataFim) return false;
    
    return dataStr >= tempDataInicio && dataStr <= tempDataFim;
  };
  
  const isDiaInicio = (dia: number, mes: number, ano: number): boolean => {
    if (!tempDataInicio) return false;
    const dataStr = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    return dataStr === tempDataInicio;
  };
  
  const isDiaFim = (dia: number, mes: number, ano: number): boolean => {
    if (!tempDataFim) return false;
    const dataStr = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    return dataStr === tempDataFim;
  };
  
  const [qualificacaoSelecionada, setQualificacaoSelecionada] = useState<string | null>(null);
  const [showModalQualificacao, setShowModalQualificacao] = useState(false);
  const [integracoes, setIntegracoes] = useState<EvolutionInstancesV2[]>([]);
  const [loadingIntegracoes, setLoadingIntegracoes] = useState(true);
  const [actionModal, setActionModal] = useState<{
    show: boolean;
    type: 'connect' | 'disconnect' | 'edit' | 'delete' | null;
    instance: EvolutionInstancesV2 | null;
  }>({ show: false, type: null, instance: null });

  useEffect(() => {
    if (selectedClienteId) {
      loadRelatorio();
      loadIntegracoes();
    } 
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClienteId]);

  // Fechar date picker ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showDatePicker && !target.closest('.date-picker-container')) {
        setShowDatePicker(false);
      }
    };

    if (showDatePicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDatePicker]);

  // Função para definir período rápido
  const setPeriodoRapido = async (dias: number, tipo: 'hoje' | 'ontem' | '7dias' | '30dias') => {
    // Usar data local sem conversão de timezone
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const inicio = new Date(hoje);
    let novaDataInicio = '';
    let novaDataFim = '';
    
    if (dias === 0) {
      // Hoje
      const ano = hoje.getFullYear();
      const mes = String(hoje.getMonth() + 1).padStart(2, '0');
      const dia = String(hoje.getDate()).padStart(2, '0');
      novaDataInicio = `${ano}-${mes}-${dia}`;
      novaDataFim = `${ano}-${mes}-${dia}`;
    } else if (dias === -1) {
      // Ontem
      inicio.setDate(hoje.getDate() - 1);
      const ano = inicio.getFullYear();
      const mes = String(inicio.getMonth() + 1).padStart(2, '0');
      const dia = String(inicio.getDate()).padStart(2, '0');
      novaDataInicio = `${ano}-${mes}-${dia}`;
      novaDataFim = `${ano}-${mes}-${dia}`;
    } else {
      // Semana ou Mês - de ontem para trás
      const ontem = new Date(hoje);
      ontem.setDate(hoje.getDate() - 1);
      
      inicio.setDate(ontem.getDate() - dias + 1);
      
      const anoInicio = inicio.getFullYear();
      const mesInicio = String(inicio.getMonth() + 1).padStart(2, '0');
      const diaInicio = String(inicio.getDate()).padStart(2, '0');
      
      const anoFim = ontem.getFullYear();
      const mesFim = String(ontem.getMonth() + 1).padStart(2, '0');
      const diaFim = String(ontem.getDate()).padStart(2, '0');
      
      novaDataInicio = `${anoInicio}-${mesInicio}-${diaInicio}`;
      novaDataFim = `${anoFim}-${mesFim}-${diaFim}`;
    }
    
    setDataInicio(novaDataInicio);
    setDataFim(novaDataFim);
    setPeriodoAtivo(tipo);
    
    // Atualizar relatório automaticamente
    setLoadingRelatorio(true);
    try {
      const clienteId = selectedClienteId || undefined;
      const response = await leadsApi.getRelatorioDiario(novaDataInicio, novaDataFim, clienteId);
      if (response.success && response.data) {
        setRelatorio(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar relatório:', error);
    } finally {
      setLoadingRelatorio(false);
    }
  };

  const loadRelatorio = async () => {
    setLoadingRelatorio(true);
    try {
      const clienteId = selectedClienteId || undefined;
      
      const response = await leadsApi.getRelatorioDiario(dataInicio, dataFim, clienteId);
      if (response.success && response.data) {
        setRelatorio(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar relatório:', error);
    } finally {
      setLoadingRelatorio(false);
    }
  };

  const loadIntegracoes = async () => {
    setLoadingIntegracoes(true);
    try {
      const response = await evolutionApiV2.getInstances();
      if (response.success && response.data) {
        setIntegracoes(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar integrações:', error);
    } finally {
      setLoadingIntegracoes(false);
    }
  };

  const handleQualificacaoClick = (qualificacao: string) => {
    setQualificacaoSelecionada(qualificacao);
    setShowModalQualificacao(true);
  };

  const getLeadsByQualificacao = (qualificacao: string) => {
    if (!relatorio) return [];
    
    const allLeads = [
      ...relatorio.detalhes.leads_criados,
      ...relatorio.detalhes.leads_atualizados
    ];
    
    return allLeads.filter(lead => {
      const leadQual = typeof lead.qualificacao === 'string' 
        ? lead.qualificacao 
        : lead.qualificacao?.nome;
      return leadQual === qualificacao;
    });
  };

  const formatPhone = (phone: string) => {
    if (!phone) return 'Não conectado';
    // Remove todos os caracteres não numéricos
    const cleaned = phone.replace(/\D/g, '');

    // Se tem 13 dígitos e começa com 55, é um número brasileiro
    if (cleaned.length === 13 && cleaned.startsWith('55')) {
      const countryCode = cleaned.slice(0, 2);
      const areaCode = cleaned.slice(2, 4);
      const firstPart = cleaned.slice(4, 9);
      const secondPart = cleaned.slice(9, 13);
      return `+${countryCode} (${areaCode}) ${firstPart}-${secondPart}`;
    }

    // Se tem 12 dígitos e começa com 55, é um número brasileiro (telefone fixo)
    if (cleaned.length === 12 && cleaned.startsWith('55')) {
      const countryCode = cleaned.slice(0, 2);
      const areaCode = cleaned.slice(2, 4);
      const firstPart = cleaned.slice(4, 8);
      const secondPart = cleaned.slice(8, 12);
      return `+${countryCode} (${areaCode}) ${firstPart}-${secondPart}`;
    }

    // Se tem 11 dígitos, assume que é brasileiro sem código do país
    if (cleaned.length === 11) {
      const areaCode = cleaned.slice(0, 2);
      const firstPart = cleaned.slice(2, 7);
      const secondPart = cleaned.slice(7, 11);
      return `+55 (${areaCode}) ${firstPart}-${secondPart}`;
    }

    // Se tem 10 dígitos, assume que é brasileiro sem código do país (telefone fixo)
    if (cleaned.length === 10) {
      const areaCode = cleaned.slice(0, 2);
      const firstPart = cleaned.slice(2, 6);
      const secondPart = cleaned.slice(6, 10);
      return `+55 (${areaCode}) ${firstPart}-${secondPart}`;
    }

    // Retorna o número original se não conseguir formatar
    return phone;
  };

  const copyPhoneToClipboard = async (phone: string) => {
    if (!phone || phone === 'Não conectado') {
      toast.error('Número não disponível para cópia');
      return;
    }

    try {
      // Remove todos os caracteres não numéricos para copiar apenas os números
      const cleanPhone = phone.replace(/\D/g, '');
      await navigator.clipboard.writeText(cleanPhone);
      toast.success('Número copiado para a área de transferência!');
    } catch (error) {
      console.error('Erro ao copiar número:', error);
      toast.error('Erro ao copiar número');
    }
  };

  return (
    <div className="space-y-6">
      {/* Filtro de Período */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap items-center gap-2">
          {/* Botões de Período Rápido */}
          <button
            onClick={() => setPeriodoRapido(0, 'hoje')}
            disabled={loadingRelatorio}
            className={`px-3 py-2 text-sm rounded-lg font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              periodoAtivo === 'hoje'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            Hoje
          </button>
          <button
            onClick={() => setPeriodoRapido(-1, 'ontem')}
            disabled={loadingRelatorio}
            className={`px-3 py-2 text-sm rounded-lg font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              periodoAtivo === 'ontem'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            Ontem
          </button>
          <button
            onClick={() => setPeriodoRapido(7, '7dias')}
            disabled={loadingRelatorio}
            className={`px-3 py-2 text-sm rounded-lg font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              periodoAtivo === '7dias'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            Semana
          </button>
          <button
            onClick={() => setPeriodoRapido(30, '30dias')}
            disabled={loadingRelatorio}
            className={`px-3 py-2 text-sm rounded-lg font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              periodoAtivo === '30dias'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            Mês
          </button>

          {/* Seletor de Datas */}
          <div className="relative date-picker-container">
            <button
              onClick={() => {
                setTempDataInicio(dataInicio);
                setTempDataFim(dataFim);
                setShowDatePicker(!showDatePicker);
              }}
              disabled={loadingRelatorio}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <CalendarIcon className="h-4 w-4" />
              {getTextoDataRange()}
            </button>
            
            {showDatePicker && (
              <div className="absolute top-full mt-2 left-0 z-50 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl p-4">
                {/* Calendários lado a lado */}
                <div className="flex gap-4">
                  {[0, 1].map((offset) => {
                    const mes = (mesAtual + offset) % 12;
                    const ano = anoAtual + Math.floor((mesAtual + offset) / 12);
                    const diasNoMes = getDiasNoMes(ano, mes);
                    const primeiroDia = getPrimeiroDiaSemana(ano, mes);
                    
                    return (
                      <div key={offset} className="w-64">
                        {/* Header do mês */}
                        <div className="flex items-center justify-between mb-3">
                          {offset === 0 && (
                            <button
                              onClick={() => {
                                if (mesAtual === 0) {
                                  setMesAtual(11);
                                  setAnoAtual(anoAtual - 1);
                                } else {
                                  setMesAtual(mesAtual - 1);
                                }
                              }}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                            >
                              <span className="text-gray-600 dark:text-gray-400">‹</span>
                            </button>
                          )}
                          <div className="flex-1 text-center">
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              {getNomeMes(mes)} {ano}
                            </span>
                          </div>
                          {offset === 1 && (
                            <button
                              onClick={() => {
                                if (mesAtual === 11) {
                                  setMesAtual(0);
                                  setAnoAtual(anoAtual + 1);
                                } else {
                                  setMesAtual(mesAtual + 1);
                                }
                              }}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                            >
                              <span className="text-gray-600 dark:text-gray-400">›</span>
                            </button>
                          )}
                        </div>
                        
                        {/* Dias da semana */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dia) => (
                            <div key={dia} className="text-center text-xs font-medium text-gray-600 dark:text-gray-400 py-1">
                              {dia}
                            </div>
                          ))}
                        </div>
                        
                        {/* Dias do mês */}
                        <div className="grid grid-cols-7 gap-1">
                          {/* Espaços vazios antes do primeiro dia */}
                          {Array.from({ length: primeiroDia }).map((_, i) => (
                            <div key={`empty-${i}`} />
                          ))}
                          
                          {/* Dias do mês */}
                          {Array.from({ length: diasNoMes }).map((_, i) => {
                            const dia = i + 1;
                            const noRange = isDiaNoRange(dia, mes, ano);
                            const isInicio = isDiaInicio(dia, mes, ano);
                            const isFim = isDiaFim(dia, mes, ano);
                            const hoje = new Date();
                            hoje.setHours(0, 0, 0, 0);
                            const dataAtual = new Date(ano, mes, dia);
                            dataAtual.setHours(0, 0, 0, 0);
                            const isHoje = dataAtual.getTime() === hoje.getTime();
                            const isFuturo = dataAtual > hoje;
                            
                            return (
                              <button
                                key={dia}
                                onClick={() => !isFuturo && handleDiaClick(dia, mes, ano)}
                                disabled={isFuturo}
                                className={`
                                  h-8 text-sm transition-colors relative
                                  ${isInicio && isFim ? 'rounded-full' : ''}
                                  ${isInicio && !isFim ? 'rounded-l-full' : ''}
                                  ${isFim && !isInicio ? 'rounded-r-full' : ''}
                                  ${!isInicio && !isFim && noRange ? 'rounded-none' : ''}
                                  ${!noRange && !isInicio && !isFim ? 'rounded-full' : ''}
                                  ${noRange && !isInicio && !isFim ? 'bg-primary/10 text-primary dark:bg-primary/20' : ''}
                                  ${isInicio || isFim ? 'bg-primary text-white font-semibold' : ''}
                                  ${!noRange && !isInicio && !isFim && !isFuturo ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800' : ''}
                                  ${isHoje && !isInicio && !isFim ? 'ring-2 ring-primary ring-inset' : ''}
                                  ${isFuturo ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50' : 'cursor-pointer'}
                                `}
                              >
                                {dia}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          
          <button
            onClick={() => {
              loadRelatorio();
              loadIntegracoes();
            }}
            disabled={loadingRelatorio || loadingIntegracoes}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
          >
            <ArrowPathIcon className={`h-5 w-5 ${loadingRelatorio || loadingIntegracoes ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Indicador de Loading */}
      {loadingRelatorio && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Carregando dados...</span>
          </div>
        </div>
      )}

      {/* Cards de Totais */}
      {!loadingRelatorio && relatorio && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6 border-l-4 border-blue-500 dark:border-blue-400">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Criados</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{formatarNumero(relatorio.totais.criados)}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <PlusIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6 border-l-4 border-yellow-500 dark:border-yellow-400">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Atualizados</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">{formatarNumero(relatorio.totais.atualizados)}</p>
              </div>
              <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                <ArrowPathIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6 border-l-4 border-red-500 dark:border-red-400">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Deletados</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">{formatarNumero(relatorio.totais.deletados)}</p>
              </div>
              <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30">
                <XCircleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6 border-l-4 border-green-500 dark:border-green-400">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">{formatarNumero(relatorio.totais.total)}</p>
              </div>
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                <UsersIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Distribuição por Qualificação e Detalhes */}
      {!loadingRelatorio && relatorio && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Distribuição por Qualificação */}
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Por Qualificação</h2>
              <UsersIcon className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-3">
              {relatorio.distribuicao.por_qualificacao ? (
                Object.entries(relatorio.distribuicao.por_qualificacao)
                .sort(([, a], [, b]) => b - a) // Ordenar por quantidade decrescente
                .map(([qual, qtd], index) => {
                  const colors = [
                    { bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-500' },
                    { bg: 'bg-green-50', text: 'text-green-600', dot: 'bg-green-500' },
                    { bg: 'bg-yellow-50', text: 'text-yellow-600', dot: 'bg-yellow-500' },
                    { bg: 'bg-purple-50', text: 'text-purple-600', dot: 'bg-purple-500' },
                    { bg: 'bg-pink-50', text: 'text-pink-600', dot: 'bg-pink-500' },
                  ];
                  const color = colors[index % colors.length];
                  
                  // Calcular percentual
                  const totalQualificacoes = Object.values(relatorio.distribuicao.por_qualificacao).reduce((sum, val) => sum + val, 0);
                  const percentual = totalQualificacoes > 0 ? ((qtd / totalQualificacoes) * 100).toFixed(1) : '0';
                  
                  return (
                    <div 
                      key={qual} 
                      onClick={() => handleQualificacaoClick(qual)}
                      className={`flex items-center justify-between p-3 ${color.bg} rounded-lg cursor-pointer hover:opacity-80 transition-opacity`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 ${color.dot} rounded-full`}></div>
                        <span className="font-medium text-gray-900 dark:text-white">{qual}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xl font-bold ${color.text}`}>{formatarNumero(qtd)}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">({percentual}%)</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">Nenhum lead qualificado no período</p>
              )}
            </div>
          </div>

          {/* Leads Criados */}
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Leads Criados</h2>
              <PlusIcon className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {relatorio.detalhes.leads_criados.slice(0, 10).map((lead) => (
                <div key={lead.id} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">{lead.nome}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{formatPhoneDisplay(lead.telefone || '')}</p>
                      {lead.qualificacao && (
                        <span className="inline-block mt-1 px-2 py-1 text-xs font-medium bg-blue-100 text-gray-900 dark:bg-blue-900 dark:text-blue-200 rounded">
                          {typeof lead.qualificacao === 'string' ? lead.qualificacao : lead.qualificacao.nome}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => router.push(`/chat?leadId=${lead.id}`)}
                      className="p-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex-shrink-0"
                      title="Abrir chat"
                    >
                      <ChatBubbleLeftRightIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
              {relatorio.detalhes.leads_criados.length === 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">Nenhum lead criado no período</p>
              )}
            </div>
          </div>

          {/* Leads Atualizados */}
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Leads Atualizados</h2>
              <ArrowPathIcon className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {relatorio.detalhes.leads_atualizados.slice(0, 10).map((lead) => (
                <div key={lead.id} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">{lead.nome}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{formatPhoneDisplay(lead.telefone || '')}</p>
                      {lead.qualificacao && (
                        <span className="inline-block mt-1 px-2 py-1 text-xs font-medium bg-yellow-100 text-gray-900 dark:bg-yellow-900 dark:text-yellow-200 rounded">
                          {typeof lead.qualificacao === 'string' ? lead.qualificacao : lead.qualificacao.nome}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => router.push(`/chat?leadId=${lead.id}`)}
                      className="p-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex-shrink-0"
                      title="Abrir chat"
                    >
                      <ChatBubbleLeftRightIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
              {relatorio.detalhes.leads_atualizados.length === 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">Nenhum lead atualizado no período</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Leads por Qualificação */}
      {showModalQualificacao && qualificacaoSelecionada && (
        <div
          className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowModalQualificacao(false)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Leads - {qualificacaoSelecionada}
              </h2>
              <button
                onClick={() => setShowModalQualificacao(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <XCircleIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-3">
              {getLeadsByQualificacao(qualificacaoSelecionada).map((lead) => (
                <div key={lead.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Nome</p>
                      <p className="font-medium text-gray-900 dark:text-white">{lead.nome}</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Telefone</p>
                      <button
                        onClick={() => copyPhoneToClipboard(lead.telefone || '')}
                        className="font-medium text-primary hover:text-primary/80 transition-colors cursor-pointer text-left"
                        title="Clique para copiar"
                      >
                        {formatPhoneDisplay(lead.telefone || '')}
                      </button>
                    </div>
                    <div>
                      <button
                        onClick={() => router.push(`/chat?leadId=${lead.id}`)}
                        className="p-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                        title="Abrir chat"
                      >
                        <ChatBubbleLeftRightIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {getLeadsByQualificacao(qualificacaoSelecionada).length === 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">Nenhum lead encontrado para esta qualificação</p>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowModalQualificacao(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Integrações WhatsApp */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Integrações WhatsApp</h2>
          <ChatBubbleLeftRightIcon className="h-6 w-6 text-primary" />
        </div>
        
        {loadingIntegracoes ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : integracoes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Perfil WhatsApp</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Instância</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Telefone</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Agente</th>
                </tr>
              </thead>
              <tbody>
                {integracoes.map((instance) => {
                  const isConnected = instance.status === 'open';
                  
                  return (
                    <tr key={instance.instanceId} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {instance.profilePictureUrl && (
                            <img
                              src={instance.profilePictureUrl}
                              alt="Profile"
                              className="h-8 w-8 rounded-full"
                            />
                          )}
                          <p className="text-sm text-gray-900 dark:text-white">{instance.profileName || 'Não conectado'}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-900 dark:text-white">{instance.instanceName}</p>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => copyPhoneToClipboard(instance.owner || '')}
                          className="text-sm text-gray-900 dark:text-white hover:bg-gray-50 cursor-pointer font-medium"
                          title="Clique para copiar"
                        >
                          {formatPhone(instance.owner || '')}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {isConnected ? (
                            <CheckCircleIcon className="h-5 w-5 text-green-500" />
                          ) : ( 
                            <XCircleIcon className="h-5 w-5 text-red-500" />
                          )}
                          <span className={`text-sm ${isConnected ? 'text-green-600' : 'text-red-600'} dark:text-white font-medium`}>
                            {isConnected ? 'Conectado' : 'Desconectado'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {instance.agente?.nome || '—'}
                        </p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">Nenhuma integração WhatsApp configurada</p>
        )}
      </div>

      {/* Modal de Ações WhatsApp */}
      <WhatsAppActionsModal
        show={actionModal.show}
        onClose={() => setActionModal({ show: false, type: null, instance: null })}
        title={
          actionModal.type === 'connect' ? 'Conectar Instância' :
          actionModal.type === 'disconnect' ? 'Desconectar Instância' :
          actionModal.type === 'edit' ? 'Editar Instância' :
          actionModal.type === 'delete' ? 'Excluir Instância' : ''
        }
      >
        {actionModal.type === 'connect' && (
          <div className="text-center py-4">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Escaneie o QR Code com seu WhatsApp para conectar a instância <strong>{actionModal.instance?.instanceName}</strong>
            </p>
            <div className="flex justify-center">
              <div className="animate-pulse bg-gray-200 dark:bg-gray-800 h-64 w-64 rounded-lg flex items-center justify-center">
                <QrCodeIcon className="h-16 w-16 text-gray-400 dark:text-gray-500" />
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">Carregando QR Code...</p>
          </div>
        )}

        {actionModal.type === 'disconnect' && (
          <div className="py-4">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Tem certeza que deseja desconectar a instância <strong>{actionModal.instance?.instanceName}</strong>?
            </p>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setActionModal({ show: false, type: null, instance: null })}
                className="px-4 py-2 bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  toast.success('Instância desconectada!');
                  setActionModal({ show: false, type: null, instance: null });
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Desconectar
              </button>
            </div>
          </div>
        )}

        {actionModal.type === 'edit' && (
          <div className="py-4">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Editar configurações da instância <strong>{actionModal.instance?.instanceName}</strong>
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Esta funcionalidade será implementada em breve.
            </p>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setActionModal({ show: false, type: null, instance: null })}
                className="px-4 py-2 bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        )}

        {actionModal.type === 'delete' && (
          <div className="py-4">
            <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mb-4">
              <XCircleIcon className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0" />
              <div>
                <p className="font-medium text-red-900 dark:text-red-300">Atenção!</p>
                <p className="text-sm text-red-700 dark:text-red-400">Esta ação não pode ser desfeita.</p>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Tem certeza que deseja excluir permanentemente a instância <strong>{actionModal.instance?.instanceName}</strong>?
            </p>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setActionModal({ show: false, type: null, instance: null })}
                className="px-4 py-2 bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  toast.success('Instância excluída!');
                  setActionModal({ show: false, type: null, instance: null });
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        )}
      </WhatsAppActionsModal>
    </div>
  );
}