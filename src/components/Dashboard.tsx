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
        return <UsersIcon className="h-5 w-5 text-blue-500" />;
      case 'call':
        return <PhoneIcon className="h-5 w-5 text-green-500" />;
      case 'meeting':
        return <CalendarIcon className="h-5 w-5 text-purple-500" />;
      case 'deal':
        return <CurrencyDollarIcon className="h-5 w-5 text-yellow-500" />;
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
  const convertedLeads = stats?.byStatus?.converted || 0;
  const pendingLeads = stats?.byStatus?.pending || 0;
  const rejectedLeads = stats?.byStatus?.rejected || 0;
  const scheduledMeetings = stats?.byStatus?.contacted || 0;

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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard CRM</h1>
        <p className="text-gray-600">
          Visão geral do seu pipeline de vendas e atividades recentes.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total de Leads"
          value={totalLeads}
          icon={UsersIcon}
          color="bg-blue-500"
          trend="+12% este mês"
        />
        <StatCard
          title="Leads Convertidos"
          value={convertedLeads}
          icon={CheckCircleIcon}
          color="bg-green-500"
          trend={`${conversionRate}% taxa de conversão`}
        />
        <StatCard
          title="Em Andamento"
          value={pendingLeads}
          icon={ClockIcon}
          color="bg-yellow-500"
        />
        <StatCard
          title="Reuniões Agendadas"
          value={scheduledMeetings}
          icon={CalendarIcon}
          color="bg-purple-500"
          trend="+3 esta semana"
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Status */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Status do Pipeline</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="font-medium text-gray-900">Novos Leads</span>
              </div>
              <span className="text-2xl font-bold text-blue-600">{pendingLeads}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="font-medium text-gray-900">Em Contato</span>
              </div>
              <span className="text-2xl font-bold text-yellow-600">{scheduledMeetings}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="font-medium text-gray-900">Convertidos</span>
              </div>
              <span className="text-2xl font-bold text-green-600">{convertedLeads}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="font-medium text-gray-900">Perdidos</span>
              </div>
              <span className="text-2xl font-bold text-red-600">{rejectedLeads}</span>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Atividades Recentes</h2>
          <div className="space-y-2">
            {recentActivities.map((activity, index) => (
              <ActivityItem
                key={index}
                title={activity.title}
                description={activity.description}
                time={activity.time}
                type={activity.type}
              />
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <a
              href="/leads"
              className="text-sm text-primary hover:text-primary-dark font-medium"
            >
              Ver todas as atividades →
            </a>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/leads"
            className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors group"
          >
            <div className="text-center">
              <UsersIcon className="h-8 w-8 text-gray-400 group-hover:text-primary mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">Gerenciar Leads</p>
              <p className="text-xs text-gray-500">Visualizar e editar leads</p>
            </div>
          </a>
          <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors group">
            <div className="text-center">
              <CalendarIcon className="h-8 w-8 text-gray-400 group-hover:text-primary mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">Agendar Reunião</p>
              <p className="text-xs text-gray-500">Nova reunião com lead</p>
            </div>
          </button>
          <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors group">
            <div className="text-center">
              <ArrowTrendingUpIcon className="h-8 w-8 text-gray-400 group-hover:text-primary mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">Ver Relatórios</p>
              <p className="text-xs text-gray-500">Análises e métricas</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}