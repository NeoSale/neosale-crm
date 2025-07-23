import { useState, useEffect, useCallback } from 'react';
import { leadsApi, Lead } from '../services/leadsApi';

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
  searchLeads: (searchTerm: string) => Promise<void>;
}

export const useLeads = (): UseLeadsReturn => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadsStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Função para buscar leads da API
  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await leadsApi.getLeads();
      if (response.success && response.data) {
        setLeads(response.data);
      } else {
        console.log('API failed, using mock data');
        setError('Usando dados de exemplo - API não disponível');
      }
    } catch (err) {
      console.error('Erro ao buscar leads:', err);
      setError('Erro ao carregar leads');
    } finally {
      setLoading(false);
    }
  }, []);



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
    }
  }, [refreshLeads]);

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
    }
  }, [refreshLeads]);

  // Função para deletar um lead
  const deleteLead = useCallback(async (id: string): Promise<boolean> => {
    try {
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
    }
  }, [refreshLeads]);

  // Função para buscar leads
  const searchLeads = useCallback(async (searchTerm: string) => {
    try {
      setLoading(true);

      if (!searchTerm.trim()) {
        await refreshLeads();
        return;
      }

      const response = await leadsApi.searchLeads({ search: searchTerm });

      if (response.success) {
        setLeads(response.data.leads || []);
      } else {
        // Buscar localmente se a API falhar
        const filteredLeads = leads.filter(lead =>
          Object.values(lead).some(value =>
            value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
          )
        );
        setLeads(filteredLeads);
      }
    } catch (err) {
      console.error('Erro ao buscar leads:', err);
      setError('Erro ao buscar leads');
    } finally {
      setLoading(false);
    }
  }, [leads, refreshLeads]);

  // Carregar dados iniciais
  useEffect(() => {
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
  }, []);

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