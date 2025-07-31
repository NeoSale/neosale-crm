'use client';

import React from 'react';
import useLeads from '../hooks/useLeads';
import ToastTest from './ToastTest';
import {
  UsersIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  PhoneIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  CurrencyDollarIcon,
  PlusIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
  trend?: string;
}

function StatCard({ title, value, icon: Icon, color, trend }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {trend && (
            <p className="text-sm text-green-600 mt-1 flex items-center">
              <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
              {trend}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
      
      {/* Toast Test Component */}
      <ToastTest />
    </div>
  );
}

interface ActivityItemProps {
  title: string;
  description: string;
  time: string;
  type: 'lead' | 'call' | 'meeting' | 'deal';
}

function ActivityItem({ title, description, time, type }: ActivityItemProps) {
  const getIcon = () => {
    switch (type) {
      case 'lead':
        return <UsersIcon className="h-5 w-5 text-primary" />;
      case 'call':
        return <PhoneIcon className="h-5 w-5 text-primary" />;
      case 'meeting':
        return <CalendarIcon className="h-5 w-5 text-primary" />;
      case 'deal':
        return <CurrencyDollarIcon className="h-5 w-5 text-primary" />;
      default:
        return <UsersIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
      <div className="flex-shrink-0 mt-1">
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{title}</p>
          <p className="text-sm text-gray-500">{description}</p>
      </div>
      <div className="flex-shrink-0">
        <p className="text-xs text-gray-400">{time}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { leads, stats, loading } = useLeads();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const totalLeads = Array.isArray(leads) ? leads.length : 0;
  const convertedLeads = stats?.byStatus?.['Convertido'] || stats?.byStatus?.['Qualificado'] || stats?.byStatus?.['qualificado'] || 0;
  const pendingLeads = stats?.byStatus?.['Novo'] || stats?.byStatus?.['novo'] || stats?.byStatus?.['Pendente'] || 0;
  const rejectedLeads = stats?.byStatus?.['Perdido'] || stats?.byStatus?.['Rejeitado'] || stats?.byStatus?.['perdido'] || 0;
  const scheduledMeetings = stats?.byStatus?.['Em Contato'] || stats?.byStatus?.['Agendado'] || stats?.byStatus?.['agendado'] || 0;

  const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : '0';

  // Atividades recentes simuladas
  const recentActivities = [
    {
      title: 'Novo lead adicionado',
      description: 'João Silva - Interessado em consultoria',
      time: '2 min atrás',
      type: 'lead' as const,
    },
    {
      title: 'Ligação agendada',
      description: 'Maria Santos - Reunião para amanhã às 14h',
      time: '15 min atrás',
      type: 'call' as const,
    },
    {
      title: 'Reunião concluída',
      description: 'Pedro Oliveira - Apresentação de proposta',
      time: '1 hora atrás',
      type: 'meeting' as const,
    },
    {
      title: 'Deal fechado',
      description: 'Ana Costa - Contrato de R$ 15.000 assinado',
      time: '2 horas atrás',
      type: 'deal' as const,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Dashboard CRM <span className="text-primary font-extrabold">(Dados Victícios)</span>
      </h1>
      <p className="text-gray-600">
            Visão geral do seu pipeline de vendas e atividades recentes.
          </p>
          




      </div>

      {/* Main Content Grid - Resumo de Leads, Chat e Integrações */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Resumo de Leads */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Resumo de Leads</h2>
            <UsersIcon className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="font-medium text-gray-900">Novos</span>
              </div>
              <span className="text-xl font-bold text-blue-600">{pendingLeads}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="font-medium text-gray-900">Em Contato</span>
              </div>
              <span className="text-xl font-bold text-yellow-600">{scheduledMeetings}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="font-medium text-gray-900">Convertidos</span>
              </div>
              <span className="text-xl font-bold text-green-600">{convertedLeads}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="font-medium text-gray-900">Perdidos</span>
              </div>
              <span className="text-xl font-bold text-red-600">{rejectedLeads}</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">Taxa de Conversão</p>
              <p className="text-2xl font-bold text-primary">{conversionRate}%</p>
            </div>
          </div>
        </div>

        {/* Chat */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Chat</h2>
            <ChatBubbleLeftRightIcon className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">Conversas Ativas</span>
                <span className="text-lg font-bold text-primary">12</span>
              </div>
              <p className="text-sm text-gray-600">Leads em conversa no WhatsApp</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">Mensagens Hoje</span>
                <span className="text-lg font-bold text-green-600">47</span>
              </div>
              <p className="text-sm text-gray-600">Enviadas e recebidas</p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">Pendentes</span>
                <span className="text-lg font-bold text-yellow-600">3</span>
              </div>
              <p className="text-sm text-gray-600">Aguardando resposta</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button className="w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors">
              Abrir Chat
            </button>
          </div>
        </div>

        {/* Integrações */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Integrações</h2>
            <ArrowTrendingUpIcon className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <ChatBubbleLeftRightIcon className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">WhatsApp</p>
                  <p className="text-sm text-gray-500">Conectado</p>
                </div>
              </div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <PhoneIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Telefone</p>
                  <p className="text-sm text-gray-500">Configurado</p>
                </div>
              </div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <CalendarIcon className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Calendário</p>
                  <p className="text-sm text-gray-500">Desconectado</p>
                </div>
              </div>
              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <a
              href="/integracoes"
              className="text-sm text-primary hover:text-primary/70 font-medium"
            >
              Gerenciar integrações →
            </a>
          </div>
        </div>
      </div>

      {/* Atividades Recentes */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Atividades Recentes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {recentActivities.map((activity, index) => (
            <div key={index} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <ActivityItem
                title={activity.title}
                description={activity.description}
                time={activity.time}
                type={activity.type}
              />
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200 text-center">
          <a
            href="/leads"
            className="text-sm text-primary hover:text-primary/70 font-medium"
          >
            Ver todas as atividades →
          </a>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Ações Rápidas</h2>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Acesso rápido às principais funcionalidades</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <a
            href="/leads"
            className="group p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-primary hover:bg-primary/5 transition-all duration-200 hover:shadow-md"
          >
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                <UsersIcon className="h-6 w-6 text-blue-600 group-hover:text-white" />
              </div>
              <p className="text-sm font-semibold text-gray-900 mt-3">Gerenciar Leads</p>
              <p className="text-xs text-gray-500 mt-1">Visualizar e editar leads</p>
            </div>
          </a>
          
          <button className="group p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-primary hover:bg-primary/5 transition-all duration-200 hover:shadow-md">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                <PlusIcon className="h-6 w-6 text-green-600 group-hover:text-white" />
              </div>
              <p className="text-sm font-semibold text-gray-900 mt-3">Novo Lead</p>
              <p className="text-xs text-gray-500 mt-1">Adicionar lead rapidamente</p>
            </div>
          </button>
          
          <button className="group p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-primary hover:bg-primary/5 transition-all duration-200 hover:shadow-md">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                <CalendarIcon className="h-6 w-6 text-purple-600 group-hover:text-white" />
              </div>
              <p className="text-sm font-semibold text-gray-900 mt-3">Agendar Reunião</p>
              <p className="text-xs text-gray-500 mt-1">Nova reunião com lead</p>
            </div>
          </button>
          
          <a
            href="/integracoes/whatsapp"
            className="group p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-primary hover:bg-primary/5 transition-all duration-200 hover:shadow-md"
          >
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                <ChatBubbleLeftRightIcon className="h-6 w-6 text-indigo-600 group-hover:text-white" />
              </div>
              <p className="text-sm font-semibold text-gray-900 mt-3">WhatsApp</p>
              <p className="text-xs text-gray-500 mt-1">Gerenciar integração</p>
            </div>
          </a>
        </div>
        
      </div>
    </div>
  );
}