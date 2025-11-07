'use client';

import React, { useState, useEffect } from 'react';
import { Settings, RefreshCw, Clock, Calendar, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { followupConfigApi, FollowupConfig, DiaHorarioEnvio } from '../services/followupConfigApi';

const ConfiguracoesManager: React.FC = () => {
  const [config, setConfig] = useState<FollowupConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshLoading, setRefreshLoading] = useState(false);
  const [diaHorarioEnvio, setDiaHorarioEnvio] = useState<DiaHorarioEnvio>({
    segunda: '09:00-18:00',
    terca: '09:00-18:00',
    quarta: '09:00-18:00',
    quinta: '09:00-18:00',
    sexta: '09:00-18:00',
    sabado: 'fechado',
    domingo: 'fechado',
  });
  const [qtdEnvioDiario, setQtdEnvioDiario] = useState<number>(50);
  const [emExecucao, setEmExecucao] = useState<boolean>(false);
  const [ativo, setAtivo] = useState<boolean>(false);

  // Carregar configurações ao montar o componente
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const response = await followupConfigApi.getConfig();
      if (response.success && response.data) {
        setConfig(response.data);
        setDiaHorarioEnvio(response.data.dia_horario_envio);
        setQtdEnvioDiario(response.data.qtd_envio_diario);
        setEmExecucao(response.data.em_execucao);
        setAtivo(response.data.ativo);
      } else {
        toast.error(response.error || 'Erro ao carregar configurações');
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshLoading(true);
      await loadConfig();
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setRefreshLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config) {
      toast.error('Configuração não carregada');
      return;
    }

    setSaving(true);
    try {
      const response = await followupConfigApi.updateConfig(config.id, {
        dia_horario_envio: diaHorarioEnvio,
        qtd_envio_diario: qtdEnvioDiario,
        em_execucao: emExecucao || false,
        ativo: ativo,
      });

      if (response.success) {
        toast.success('Configurações salvas com sucesso!');
        await loadConfig();
      } else {
        toast.error(response.error || 'Erro ao salvar configurações');
      }
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const handleDiaHorarioChange = (dia: keyof DiaHorarioEnvio, valor: string) => {
    setDiaHorarioEnvio(prev => ({
      ...prev,
      [dia]: valor
    }));
  };

  const diasSemana: { key: keyof DiaHorarioEnvio; label: string }[] = [
    { key: 'segunda', label: 'Segunda-feira' },
    { key: 'terca', label: 'Terça-feira' },
    { key: 'quarta', label: 'Quarta-feira' },
    { key: 'quinta', label: 'Quinta-feira' },
    { key: 'sexta', label: 'Sexta-feira' },
    { key: 'sabado', label: 'Sábado' },
    { key: 'domingo', label: 'Domingo' },
  ];

  if (loading && !config) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="flex items-center justify-center mb-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Carregando configurações...
        </h3>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8">
      {/* Seção de Configurações */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-primary text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings size={24} className="text-white" />
              <div>
                <h2 className="text-lg font-bold text-white !text-white">Configurações do Follow Up</h2>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={refreshLoading || loading}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors text-sm font-medium flex items-center gap-1.5 text-white"
              >
                <RefreshCw size={14} className={`text-white ${refreshLoading || loading ? 'animate-spin' : ''}`} />
                {refreshLoading ? 'Atualizando...' : 'Atualizar'}
              </button>
              <button
                onClick={handleSave}
                disabled={saving || loading}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors text-sm font-medium flex items-center gap-1.5 text-white"
              >
                {saving ? (
                  <div className="w-3.5 h-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Save size={14} className="text-white" />
                )}
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Grid: Esquerda (Status + Limite) e Direita (Horários) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Coluna Esquerda: Status e Limite empilhados */}
            <div className="space-y-4">
              {/* Status de Ativação */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Settings size={20} className="text-primary" />
                  <h3 className="text-sm font-medium text-gray-900">Status do Follow Up</h3>
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setAtivo(!ativo)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                        ativo ? 'bg-primary' : 'bg-gray-200'
                      }`}
                      title={ativo ? 'Clique para desativar' : 'Clique para ativar'}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          ativo ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className="text-sm text-gray-700">
                      {ativo ? 'Ativo e operacional' : 'Desativado'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quantidade Diária Máxima */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Clock size={20} className="text-primary" />
                  <h3 className="text-sm font-medium text-gray-900">Limite de Envios Diária</h3>
                </div>
                <div>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={qtdEnvioDiario}
                    onChange={(e) => setQtdEnvioDiario(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm text-gray-900"
                    placeholder="Ex: 50"
                  />
                </div>
              </div>
            </div>

            {/* Coluna Direita: Horários por Dia da Semana */}
            <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <Calendar size={20} className="text-primary" />
              <h3 className="text-base font-semibold text-gray-900">Horários de Funcionamento</h3>
            </div>
            <div className="space-y-3">
              {diasSemana.map(({ key, label }) => (
                <div key={key} className="flex items-center gap-4">
                  <label className="w-36 text-sm font-medium text-gray-700">
                    {label}
                  </label>
                  <input
                    type="text"
                    value={diaHorarioEnvio[key]}
                    onChange={(e) => handleDiaHorarioChange(key, e.target.value)}
                    placeholder="HH:MM-HH:MM ou 'fechado'"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm text-gray-900"
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3 bg-gray-50 p-2 rounded">
              💡 Use o formato HH:MM-HH:MM (ex: 09:00-18:00) ou digite "fechado" para dias sem envio
            </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfiguracoesManager;
