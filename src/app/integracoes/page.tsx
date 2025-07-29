'use client';

import React from 'react';
import { ChatBubbleLeftRightIcon, PhoneIcon, CalendarIcon } from '@heroicons/react/24/outline';

export default function IntegracoesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Integrações</h1>
        <p className="text-gray-600">
          Gerencie todas as suas integrações e conecte o CRM com suas ferramentas favoritas.
        </p>
      </div>

      {/* Integrações Disponíveis */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* WhatsApp */}
        <a
          href="/integracoes/whatsapp"
          className="group bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow border border-gray-200 hover:border-primary"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
              <ChatBubbleLeftRightIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary transition-colors">
                WhatsApp
              </h3>
              <p className="text-sm text-gray-600">
                Integração com WhatsApp Business
              </p>
            </div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Status: <span className="text-green-600 font-medium">Conectado</span>
            </p>
          </div>
        </a>

        {/* Telefone */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <PhoneIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                Telefone
              </h3>
              <p className="text-sm text-gray-600">
                Integração com sistema telefônico
              </p>
            </div>
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Status: <span className="text-blue-600 font-medium">Configurado</span>
            </p>
            <span className="inline-block mt-2 text-xs bg-gray-200 text-gray-500 px-2 py-1 rounded-full">
              Em breve
            </span>
          </div>
        </div>

        {/* Calendário */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <CalendarIcon className="h-6 w-6 text-gray-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                Calendário
              </h3>
              <p className="text-sm text-gray-600">
                Sincronização com Google Calendar
              </p>
            </div>
            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Status: <span className="text-gray-600 font-medium">Desconectado</span>
            </p>
            <span className="inline-block mt-2 text-xs bg-gray-200 text-gray-500 px-2 py-1 rounded-full">
              Em breve
            </span>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Estatísticas de Integrações</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">1</p>
            <p className="text-sm text-gray-600">Integrações Ativas</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">47</p>
            <p className="text-sm text-gray-600">Mensagens Hoje</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-600">98%</p>
            <p className="text-sm text-gray-600">Taxa de Entrega</p>
          </div>
        </div>
      </div>
    </div>
  );
}