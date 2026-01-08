import { useState, useEffect, useCallback } from 'react';
import { leadsApi, Lead } from '../services/leadsApi';
import { getClienteId } from '../utils/cliente-utils';
import { useCliente } from '../contexts/ClienteContext';

export interface LeadsStats {
  total: number;
  withEmail: number;
  qualified: number;
  new: number;
  byStatus: Record<string, number>;
}

export interface ImportError {
  line: number;
  message: string;
}

export interface ImportResult {
  success: boolean;
  errors?: ImportError[];
}

export interface UseLeadsReturn {
  leads: Lead[];
  stats: LeadsStats | null;
  totalFromApi: number;
  loading: boolean;
  error: string | null;
  refreshLeads: () => Promise<void>;
  addLead: (lead: Omit<Lead, 'id'>) => Promise<boolean>;
  addMultipleLeads: (leads: Omit<Lead, 'id'>[]) => Promise<boolean>;
  addMultipleLeadsWithDetails: (leads: Omit<Lead, 'id'>[]) => Promise<ImportResult>;
  updateLead: (id: string, lead: Partial<Lead>) => Promise<boolean>;
  deleteLead: (id: string) => Promise<boolean>;
  searchLeads: (params: {
    query?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) => Promise<{ leads: Lead[]; total: number; page: number; limit: number; }>;
}

export const useLeads = (cliente_id?: string): UseLeadsReturn => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadsStats | null>(null);
  const [totalFromApi, setTotalFromApi] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const { selectedClienteId } = useCliente();

  // Verificar se estamos no lado do cliente
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Obter cliente_id usando o utilitário global ou do contexto
  const currentClienteId = useCallback(() => {
    // Prioridade: 1. selectedClienteId do contexto, 2. cliente_id passado como prop, 3. getClienteId
    return selectedClienteId || getClienteId(cliente_id);
  }, [cliente_id, selectedClienteId]);



  // Dados mockados para demonstração
  const mockLeads: Lead[] = [
    {
      id: '1',
      nome: 'João Silva',
      email: 'joao.silva@empresa.com',
      telefone: '(11) 99999-1111',
      empresa: 'Tech Solutions Ltda',
      cargo: 'Diretor Financeiro',
      status: 'Qualificado',
      cnpj: '12.345.678/0001-90',
      segmento: 'Tecnologia',
      erp_atual: 'SAP'
    },
    {
      id: '2',
      nome: 'Maria Santos',
      email: 'maria.santos@comercio.com',
      telefone: '(11) 88888-2222',
      empresa: 'Comércio ABC',
      cargo: 'Gerente Administrativo',
      status: 'Novo',
      cnpj: '98.765.432/0001-10',
      segmento: 'Comércio',
      erp_atual: 'Protheus'
    },
    {
      id: '3',
      nome: 'Pedro Oliveira',
      email: 'pedro@industria.com',
      telefone: '(11) 77777-3333',
      empresa: 'Indústria XYZ',
      cargo: 'Controller',
      status: 'Convertido',
      cnpj: '11.222.333/0001-44',
      segmento: 'Indústria',
      erp_atual: 'Oracle'
    },
    {
      id: '4',
      nome: 'Ana Costa',
      email: 'ana.costa@servicos.com',
      telefone: '(11) 66666-4444',
      empresa: 'Serviços Profissionais',
      cargo: 'Sócia',
      status: 'Agendado',
      cnpj: '55.666.777/0001-88',
      segmento: 'Serviços',
      erp_atual: 'Microsiga'
    },
    {
      id: '5',
      nome: 'Carlos Ferreira',
      email: 'carlos@consultoria.com',
      telefone: '(11) 55555-5555',
      empresa: 'Consultoria Estratégica',
      cargo: 'CEO',
      status: 'Perdido',
      cnpj: '99.888.777/0001-66',
      segmento: 'Consultoria',
      erp_atual: 'TOTVS'
    }
  ];

  // Função para buscar leads da API
  const fetchLeads = useCallback(async () => {
    if (!isClient) return;
    
    try {
      setLoading(true);
      setError(null);

      const clienteId = currentClienteId();
      const response = await leadsApi.getLeads(clienteId);
      if (response.success && response.data) {
        setLeads(response.data);
        setTotalFromApi(response.total || response.data.length);
      } else {
        setError('Erro ao carregar leads da API');
      }
    } catch (err) {
      console.error('❌ Erro ao buscar leads da API, usando dados mockados:', err);
      setError('Erro de conexão com a API');
      // Em caso de erro, usar dados mockados
      setLeads(mockLeads);
    } finally {
      setLoading(false);
    }
  }, [isClient, currentClienteId]);



  // Função para calcular estatísticas localmente
  const calculateLocalStats = (leadsData: Lead[]): LeadsStats => {
    const total = leadsData.length;
    const withEmail = leadsData.filter(lead =>
      lead.email && lead.email.trim() !== '' && lead.email.includes('@')
    ).length;
    const qualified = leadsData.filter(lead =>
      lead.status && (lead.status.toLowerCase() === 'qualificado' || lead.status.toLowerCase() === 'qualified')
    ).length;
    const newLeads = leadsData.filter(lead =>
      lead.status && (lead.status.toLowerCase() === 'novo' || lead.status.toLowerCase() === 'new')
    ).length;

    const byStatus: Record<string, number> = {};
    leadsData.forEach(lead => {
      if (lead.status) {
        byStatus[lead.status] = (byStatus[lead.status] || 0) + 1;
      }
    });

    return {
      total,
      withEmail,
      qualified,
      new: newLeads,
      byStatus
    };
  };

  // Função para atualizar leads
  const refreshLeads = useCallback(async () => {
    await fetchLeads();
  }, [fetchLeads]);

  // Função para adicionar um lead
  const addLead = useCallback(async (lead: Omit<Lead, 'id'>): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      // Processar telefone para formato internacional
      const processedLead = {
        ...lead,
        telefone: lead.telefone ? formatPhoneForBackend(lead.telefone) : ''
      };
      
      const clienteId = currentClienteId();
      const response = await leadsApi.createLead(processedLead, clienteId);

      if (response.success) {
        await refreshLeads();
        return true;
      } else {
        // Se a API falhar, não adicionar localmente e retornar false
        setError(response.message || 'Erro ao criar lead');
        return false;
      }
    } catch (err) {
      console.error('Erro ao adicionar lead:', err);
      setError('Erro ao adicionar lead');
      return false;
    } finally {
      setLoading(false);
    }
  }, [refreshLeads, currentClienteId]);

  // Função para converter telefone para formato backend (apenas números)
  const formatPhoneForBackend = (phone: string): string => {
    if (!phone) return '';
    const cleanPhone = phone.replace(/\D/g, '');
    // Se já começa com 55, retorna como está, senão adiciona 55
    if (cleanPhone.startsWith('55')) {
      return cleanPhone;
    }
    return `55${cleanPhone}`;
  };

  // Função para adicionar múltiplos leads
  const addMultipleLeads = useCallback(async (newLeads: Omit<Lead, 'id'>[]): Promise<boolean> => {
    try {
      // Processar telefones para formato internacional
      const processedLeads = newLeads.map(lead => ({
        ...lead,
        telefone: lead.telefone ? formatPhoneForBackend(lead.telefone) : ''
      }));
      
      const clienteId = currentClienteId();
      const response = await leadsApi.createMultipleLeads(processedLeads, clienteId);

      if (response.success) {
        await refreshLeads();
        return true;
      } else {
        setError('Erro ao importar leads');
        return false;
      }
    } catch (err) {
      console.error('Erro ao adicionar múltiplos leads:', err);
      setError('Erro ao importar leads');
      return false;
    }
  }, [refreshLeads, currentClienteId]);

  // Função para adicionar múltiplos leads com detalhes dos erros
  const addMultipleLeadsWithDetails = useCallback(async (newLeads: Omit<Lead, 'id'>[]): Promise<ImportResult> => {
    try {
      // Processar telefones para formato internacional
      const processedLeads = newLeads.map(lead => ({
        ...lead,
        telefone: lead.telefone ? formatPhoneForBackend(lead.telefone) : ''
      }));
      
      const clienteId = currentClienteId();
      
      // Usar o serviço leadsApi para criar múltiplos leads
      const response = await leadsApi.createMultipleLeads(processedLeads, clienteId);
      const data = response;

      if (data.success) {
        await refreshLeads();
        return { success: true };
      } else {
        // Extrair erros detalhados da resposta
        const errors: ImportError[] = [];

        console.log("data:", data)
        
        if (data.errors && Array.isArray(data.errors)) {
          data.errors.forEach((error: any, index: number) => {
            if (error.path && error.path[1] !== undefined && error.message) {
              errors.push({
                line: error.path[1] + 1, // +1 porque o array é 0-indexed mas queremos mostrar linha 1-indexed
                message: error.message
              });
            } else if (error.message) {
              // Se não há path, usar o índice do erro como linha
              errors.push({
                line: index + 1,
                message: error.message
              });
            }
          });
        };

        setError('Erro ao importar leads');
        return { 
          success: false, 
          errors: errors.length > 0 ? errors : [{ line: 0, message: data.message || 'Erro desconhecido' }]
        };
      }
    } catch (err) {
      console.error('Erro ao adicionar múltiplos leads:', err);
      setError('Erro ao importar leads');
      return { 
        success: false, 
        errors: [{ line: 0, message: 'Erro de conexão com o servidor' }]
      };
    }
  }, [refreshLeads, currentClienteId]);

  // Função para atualizar um lead
  const updateLead = useCallback(async (id: string, leadData: Partial<Lead>): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      // Processar telefone para formato internacional se estiver sendo atualizado
      const processedLeadData = {
        ...leadData,
        ...(leadData.telefone !== undefined && {
          telefone: leadData.telefone ? formatPhoneForBackend(leadData.telefone) : ''
        })
      };
      
      const clienteId = currentClienteId();
      const response = await leadsApi.updateLead(id, processedLeadData, clienteId);

      if (response.success) {
        await refreshLeads();
        return true;
      } else {
        // Se a API falhar, não atualizar localmente e retornar false
        setError(response.message || 'Erro ao atualizar lead');
        return false;
      }
    } catch (err) {
      console.error('Erro ao atualizar lead:', err);
      setError('Erro ao atualizar lead');
      return false;
    } finally {
      setLoading(false);
    }
  }, [refreshLeads, currentClienteId]);

  // Função para deletar um lead
  const deleteLead = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const clienteId = currentClienteId();
      const response = await leadsApi.deleteLead(id, clienteId);

      if (response.success) {
        await refreshLeads();
        return true;
      } else {
        // Se a API falhar, não deletar localmente e retornar false
        setError(response.message || 'Erro ao deletar lead');
        return false;
      }
    } catch (err) {
      console.error('Erro ao deletar lead:', err);
      setError('Erro ao deletar lead');
      return false;
    } finally {
      setLoading(false);
    }
  }, [refreshLeads, currentClienteId]);

  // Função para buscar leads
  const searchLeads = useCallback(async (params: {
    query?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ leads: Lead[]; total: number; page: number; limit: number; }> => {
    try {
      setLoading(true);
      setError(null);
      
      const clienteId = currentClienteId();
      const response = await leadsApi.searchLeads(params);
      
      if (response.success && response.data) {
        setLeads(response.data.leads);
        return response.data;
      } else {
        throw new Error(response.message || 'Erro ao buscar leads');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao buscar leads';
      setError(errorMessage);
      console.error('❌ Erro ao buscar leads:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentClienteId]);

  // Carregar dados iniciais
  useEffect(() => {
    if (!isClient) return;
    
    const loadInitialData = async () => {
      try {
        await fetchLeads();
      } catch (error) {
        console.error('Erro ao carregar dados iniciais:', error);
        setError('Erro ao carregar dados');
        setLoading(false);
      }
    };

    loadInitialData();
  }, [isClient, fetchLeads]);

  // Atualizar estatísticas quando os leads mudarem
  useEffect(() => {
    if (leads.length >= 0) {
      const localStats = calculateLocalStats(leads);
      setStats(localStats);
    }
  }, [leads]);

  // Recarregar dados quando o cliente selecionado mudar
  useEffect(() => {
    if (isClient && selectedClienteId !== undefined) {
      fetchLeads();
    }
  }, [selectedClienteId, isClient, fetchLeads]);

  return {
    leads,
    stats,
    totalFromApi,
    loading,
    error,
    refreshLeads,
    addLead,
    addMultipleLeads,
    addMultipleLeadsWithDetails,
    updateLead,
    deleteLead,
    searchLeads,
  };
};

export default useLeads;