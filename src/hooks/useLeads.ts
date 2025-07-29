import { useState, useEffect, useCallback } from 'react';
import { leadsApi, Lead } from '../services/leadsApi';
import { getClienteId } from '../utils/cliente-utils';

export interface LeadsStats {
  total: number;
  withEmail: number;
  qualified: number;
  new: number;
  byStatus: Record<string, number>;
}

export interface UseLeadsReturn {
  leads: Lead[];
  stats: LeadsStats | null;
  loading: boolean;
  error: string | null;
  refreshLeads: () => Promise<void>;
  addLead: (lead: Omit<Lead, 'id'>) => Promise<boolean>;
  addMultipleLeads: (leads: Omit<Lead, 'id'>[]) => Promise<boolean>;
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
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Verificar se estamos no lado do cliente
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Obter cliente_id usando o utilitário global
  const currentClienteId = useCallback(() => {
    return getClienteId(cliente_id);
  }, [cliente_id]);



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
      lead.email && lead.email.includes('@')
    ).length;
    const qualified = leadsData.filter(lead =>
      lead.status === 'Qualificado'
    ).length;
    const newLeads = leadsData.filter(lead =>
      lead.status === 'Novo'
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
      
      const clienteId = currentClienteId();
      const response = await leadsApi.createLead(lead);

      if (response.success) {
        await refreshLeads();
        return true;
      } else {
        // Adicionar localmente se a API falhar
        // Gerar ID temporário único sem usar Date.now() para evitar problemas de hidratação
        const tempId = crypto.randomUUID ? crypto.randomUUID() : `temp_${Math.floor(Math.random() * 1000000)}`;
        const newLead = { ...lead, id: `temp_${tempId}` };
        setLeads(prev => [...prev, newLead]);
        return true;
      }
    } catch (err) {
      console.error('Erro ao adicionar lead:', err);
      setError('Erro ao adicionar lead');
      return false;
    } finally {
      setLoading(false);
    }
  }, [refreshLeads, currentClienteId]);

  // Função para adicionar múltiplos leads
  const addMultipleLeads = useCallback(async (newLeads: Omit<Lead, 'id'>[]): Promise<boolean> => {
    try {
      const response = await leadsApi.createMultipleLeads(newLeads);

      if (response.success) {
        await refreshLeads();
        return true;
      } else {
        // Adicionar localmente se a API falhar
        const leadsWithIds = newLeads.map((lead, index) => ({
          ...lead,
          // Gerar ID temporário único sem usar Date.now() para evitar problemas de hidratação
          id: `temp_${crypto.randomUUID ? crypto.randomUUID() : `${Math.floor(Math.random() * 1000000)}_${index}`}`
        }));
        setLeads(prev => [...prev, ...leadsWithIds]);
        return true;
      }
    } catch (err) {
      console.error('Erro ao adicionar múltiplos leads:', err);
      setError('Erro ao importar leads');
      return false;
    }
  }, [refreshLeads]);

  // Função para atualizar um lead
  const updateLead = useCallback(async (id: string, leadData: Partial<Lead>): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const clienteId = currentClienteId();
      const response = await leadsApi.updateLead(id, leadData);

      if (response.success) {
        await refreshLeads();
        return true;
      } else {
        // Atualizar localmente se a API falhar
        setLeads(prev => prev.map(lead =>
          lead.id === id ? { ...lead, ...leadData } : lead
        ));
        return true;
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
      const response = await leadsApi.deleteLead(id);

      if (response.success) {
        await refreshLeads();
        return true;
      } else {
        // Deletar localmente se a API falhar
        setLeads(prev => prev.filter(lead => lead.id !== id));
        return true;
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

  return {
    leads,
    stats,
    loading,
    error,
    refreshLeads,
    addLead,
    addMultipleLeads,
    updateLead,
    deleteLead,
    searchLeads
  };
};

export default useLeads;