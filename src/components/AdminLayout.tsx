'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import {
  HomeIcon,
  UsersIcon,
  ChartBarIcon,
  CogIcon,
  DocumentTextIcon,
  BellIcon,
  PaperAirplaneIcon,
  SpeakerWaveIcon,
  ChatBubbleLeftRightIcon,
  LinkIcon,
  PresentationChartBarIcon,
  DocumentChartBarIcon,
} from '@heroicons/react/24/outline';
import { APP_VERSION } from '../utils/app-version';
import ThemeToggle from './ThemeToggle';
import { clientesApi, Cliente } from '../services/clientesApi';
import { BookOpenIcon, Bot, DatabaseIcon } from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface MenuItem {
  name: string;
  href?: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  current?: boolean;
  children?: MenuItem[];
}

const navigation: MenuItem[] = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Chat', href: '/chat', icon: ChatBubbleLeftRightIcon },
  { name: 'Leads', href: '/leads', icon: UsersIcon },
  { name: 'Agentes', href: '/agentes', icon: Bot },
  {
    name: 'Integrações',
    icon: LinkIcon,
    children: [
      // { name: 'WhatsApp V1', href: '/integracoes/whatsapp', icon: PaperAirplaneIcon },
      { name: 'WhatsApp', href: '/integracoes/whatsapp-v2', icon: PaperAirplaneIcon },
    ]
  },
  {
    name: 'Conhecimento',
    icon: BookOpenIcon,
    children: [
      { name: 'Base', icon: DatabaseIcon },
      { name: 'Documentos', icon: DocumentTextIcon },
    ]
  },
  {
    name: 'Follow Up',
    icon: SpeakerWaveIcon,
    children: [
      {
        name: 'Relatórios',
        icon: ChartBarIcon,
        children: [
          { name: 'Geral', href: '/followup/relatorio/geral', icon: PresentationChartBarIcon },
          { name: 'Por Dia', href: '/followup/relatorio/por-dia', icon: DocumentChartBarIcon },
        ]
      },
      { name: 'Mensagens', href: '/followup/mensagens', icon: PaperAirplaneIcon },
      { name: 'Configurações', icon: CogIcon },
    ]
  },
  // {
  //   name: 'Relatórios',
  //   icon: ChartBarIcon,
  //   children: [
  //     { name: 'Vendas', icon: ChartBarIcon },
  //   ]
  // },
  {
    name: 'Configurações',
    icon: CogIcon,
    children: [
      { name: 'Negócio', href: '/configuracoes/negocio', icon: CogIcon },
    ]
  },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

// Componente interno que usa useSearchParams
function AdminLayoutContent({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [manuallyClosedMenus, setManuallyClosedMenus] = useState<string[]>([]);
  const [showTooltip, setShowTooltip] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [selectedCliente, setSelectedCliente] = useState<string>('');
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [clienteFromUrl, setClienteFromUrl] = useState<boolean>(false);
  const [currentClienteId, setCurrentClienteId] = useState<string>('');
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Função para carregar clientes
  const loadClientes = async () => {
    if (clientes.length > 0) return; // Já carregou

    setLoadingClientes(true);
    try {
      const response = await clientesApi.getClientes();
      if (response.success && response.data) {
        setClientes(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    } finally {
      setLoadingClientes(false);
    }
  };

  // Função para lidar com a seleção de cliente
  const handleClienteChange = (clienteId: string) => {
    setSelectedCliente(clienteId);
    if (clienteId) {
      // Salvar no localStorage
      localStorage.setItem('cliente_id', clienteId);
      // Recarregar a página para atualizar os dados
      window.location.reload();
    } else {
      // Remover do localStorage se nenhum cliente for selecionado
      localStorage.removeItem('cliente_id');
      // Recarregar a página para limpar os dados
      window.location.reload();
    }
  };

  // Função para adicionar cliente_id às URLs quando necessário
  const buildUrlWithClienteId = (href: string) => {
    if (!currentClienteId) return href;
    const url = new URL(href, window.location.origin);
    url.searchParams.set('cliente_id', currentClienteId);
    return url.pathname + url.search;
  };

  // Verificar parâmetro cliente_id na URL e carregar do localStorage
  useEffect(() => {
    const clienteIdFromUrl = searchParams.get('cliente_id');

    if (clienteIdFromUrl) {
      // Se há cliente_id na URL, usar ele e bloquear o select
      setSelectedCliente(clienteIdFromUrl);
      setClienteFromUrl(true);
      setCurrentClienteId(clienteIdFromUrl);
      localStorage.setItem('cliente_id', clienteIdFromUrl);
    } else {
      // Se não há cliente_id na URL, verificar localStorage e permitir troca
      const savedClienteId = localStorage.getItem('cliente_id');
      if (savedClienteId) {
        setSelectedCliente(savedClienteId);
      }
      setClienteFromUrl(false);
      setCurrentClienteId('');
    }
  }, [searchParams]);

  // Carregar clientes quando o tooltip for aberto
  useEffect(() => {
    if (showTooltip) {
      loadClientes();
    }
  }, [showTooltip]);

  // Fechar tooltip ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showTooltip && !target.closest('.user-tooltip-container')) {
        setShowTooltip(false);
      }
    };

    if (showTooltip) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTooltip]);

  // Automaticamente expandir o menu que contém a página atual
  useEffect(() => {
    const menuWithActivePage = navigation.find(item =>
      item.children?.some(child => pathname === child.href)
    );

    if (menuWithActivePage && !expandedMenus.includes(menuWithActivePage.name)) {
      setExpandedMenus(prev => [...prev, menuWithActivePage.name]);
      // Remove da lista de menus fechados manualmente quando a página muda
      setManuallyClosedMenus(prev => prev.filter(name => name !== menuWithActivePage.name));
    }
  }, [pathname, expandedMenus]);

  const toggleMenu = (menuName: string) => {
    const isCurrentlyExpanded = expandedMenus.includes(menuName);

    if (isCurrentlyExpanded) {
      // Se está expandido, fechar e marcar como fechado manualmente
      setExpandedMenus(prev => prev.filter(name => name !== menuName));
      setManuallyClosedMenus(prev => [...prev, menuName]);
    } else {
      // Se está fechado, abrir e remover da lista de fechados manualmente
      setExpandedMenus(prev => [...prev, menuName]);
      setManuallyClosedMenus(prev => prev.filter(name => name !== menuName));
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={classNames(
          sidebarOpen ? 'w-64' : 'w-16',
          'bg-white shadow-lg transition-all duration-300 ease-in-out flex flex-col'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
              <img
                src="/icone-azul.png"
                alt="NeoSale Logo"
                className="w-8 h-8"
              />
            </div>
            {sidebarOpen && (
              <div className="flex flex-col">
                <h1 className="text-xl font-bold text-primary">NeoSale</h1>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded-md hover:bg-gray-100 transition-colors"
            >
              <ChevronLeftIcon className="h-5 w-5 text-gray-500" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            const hasActiveChild = item.children?.some(child =>
              pathname === child.href || child.children?.some(grandchild => pathname === grandchild.href)
            );
            const isManuallyClosed = manuallyClosedMenus.includes(item.name);
            const isExpanded = expandedMenus.includes(item.name) || (hasActiveChild && !isManuallyClosed);

            if (item.children) {
              return (
                <div key={item.name}>
                  <button
                    onClick={() => {
                      if (!sidebarOpen) {
                        setSidebarOpen(true);
                      }
                      toggleMenu(item.name);
                    }}
                    className={classNames(
                      hasActiveChild
                        ? 'bg-primary/10 text-primary'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                      'group flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors'
                    )}
                  >
                    <Icon
                      className={classNames(
                        hasActiveChild ? 'text-primary' : 'text-gray-400 group-hover:text-gray-500',
                        'mr-3 flex-shrink-0 h-5 w-5'
                      )}
                      aria-hidden="true"
                    />
                    {sidebarOpen && (
                      <>
                        <span className="flex-1 text-left">{item.name}</span>
                        {isExpanded ? (
                          <ChevronUpIcon className="h-4 w-4" />
                        ) : (
                          <ChevronDownIcon className="h-4 w-4" />
                        )}
                      </>
                    )}
                  </button>
                  {sidebarOpen && (isExpanded || (hasActiveChild && !isManuallyClosed)) && (
                    <div className="ml-6 mt-1 space-y-1">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        const isChildActive = pathname === child.href;
                        const hasActiveGrandchild = child.children?.some(grandchild => pathname === grandchild.href);
                        const childIsExpanded = expandedMenus.includes(`${item.name}-${child.name}`) || hasActiveGrandchild;

                        if (child.children) {
                          return (
                            <div key={child.name}>
                              <button
                                onClick={() => toggleMenu(`${item.name}-${child.name}`)}
                                className={classNames(
                                  hasActiveGrandchild
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                                  'group flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors'
                                )}
                              >
                                <ChildIcon
                                  className={classNames(
                                    hasActiveGrandchild ? 'text-primary' : 'text-gray-400 group-hover:text-gray-500',
                                    'mr-3 flex-shrink-0 h-4 w-4'
                                  )}
                                  aria-hidden="true"
                                />
                                <span className="flex-1 text-left">{child.name}</span>
                                {childIsExpanded ? (
                                  <ChevronUpIcon className="h-3 w-3" />
                                ) : (
                                  <ChevronDownIcon className="h-3 w-3" />
                                )}
                              </button>
                              {childIsExpanded && (
                                <div className="ml-6 mt-1 space-y-1">
                                  {child.children.map((grandchild) => {
                                    const GrandchildIcon = grandchild.icon;
                                    const isGrandchildActive = pathname === grandchild.href;

                                    return (
                                      <a
                                        key={grandchild.name}
                                        href={buildUrlWithClienteId(grandchild.href!)}
                                        className={classNames(
                                          isGrandchildActive
                                            ? 'bg-primary text-white'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                                          'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors'
                                        )}
                                      >
                                        <GrandchildIcon
                                          className={classNames(
                                            isGrandchildActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-500',
                                            'mr-3 flex-shrink-0 h-3 w-3'
                                          )}
                                          aria-hidden="true"
                                        />
                                        {grandchild.name}
                                      </a>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        } else if (child.href) {
                          return (
                            <a
                              key={child.name}
                              href={buildUrlWithClienteId(child.href)}
                              className={classNames(
                                isChildActive
                                  ? 'bg-primary text-white'
                                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                                'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors'
                              )}
                            >
                              <ChildIcon
                                className={classNames(
                                  isChildActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-500',
                                  'mr-3 flex-shrink-0 h-4 w-4'
                                )}
                                aria-hidden="true"
                              />
                              {child.name}
                            </a>
                          );
                        } else {
                          return (
                            <div
                              key={child.name}
                              className="group flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-400 cursor-not-allowed opacity-60"
                            >
                              <ChildIcon
                                className="text-gray-300 mr-3 flex-shrink-0 h-4 w-4"
                                aria-hidden="true"
                              />
                              <span className="flex items-center gap-2">
                                {child.name}
                                <span className="text-xs bg-gray-200 text-gray-500 px-2 py-1 rounded-full">
                                  Em breve
                                </span>
                              </span>
                            </div>
                          );
                        }
                      })}
                    </div>
                  )}
                </div>
              );
            }

            if (item.href) {
              return (
                <a
                  key={item.name}
                  href={buildUrlWithClienteId(item.href)}
                  className={classNames(
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                    'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors'
                  )}
                >
                  <Icon
                    className={classNames(
                      isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-500',
                      'mr-3 flex-shrink-0 h-5 w-5'
                    )}
                    aria-hidden="true"
                  />
                  {sidebarOpen && item.name}
                </a>
              );
            } else {
              return (
                <div
                  key={item.name}
                  className="group flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-400 cursor-not-allowed opacity-60"
                >
                  <Icon
                    className="text-gray-300 mr-3 flex-shrink-0 h-5 w-5"
                    aria-hidden="true"
                  />
                  {sidebarOpen && (
                    <span className="flex items-center gap-2">
                      {item.name}
                      <span className="text-xs bg-gray-200 text-gray-500 px-2 py-1 rounded-full">
                        Em breve
                      </span>
                    </span>
                  )}
                </div>
              );
            }
          })}
        </nav>

        {/* App Version */}
        {sidebarOpen && (
          <div className="border-t border-gray-200 px-2 py-4">
            <div className="flex items-center px-3 py-2 text-sm font-medium">
            </div>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              {!sidebarOpen && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              )}
              <h2 className="text-2xl font-semibold text-gray-900">
                {pathname === '/' ? 'Dashboard' :
                  pathname === '/leads' ? 'Leads' :
                    pathname === '/chat' ? 'Chat' :
                      pathname === '/agentes' ? 'Agentes' :
                        pathname === '/followup/configuracoes' ? 'Follow Up - Configurações' :
                          pathname === '/followup/mensagens' ? 'Follow Up - Mensagens' :
                            pathname === '/followup/agendamento' ? 'Follow Up - Agendamento' :
                              pathname.startsWith('/followup') ? 'Follow Up' :
                                pathname === '/integracoes/whatsapp' ? 'WhatsApp' :
                                  pathname.startsWith('/integracoes') ? 'Integrações' :
                                    pathname === '/reports' ? 'Relatórios' :
                                      pathname === '/documents' ? 'Documentos' :
                                        pathname === '/configuracoes/negocio' ? 'Configurações - Negócio' :
                                          pathname === '/configuracoes' ? 'Configurações' : 'Dashboard'}
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <button className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-md transition-colors">
                <BellIcon className="h-5 w-5" />
              </button>
              <div className="relative user-tooltip-container">
                <button
                  onClick={() => setShowTooltip(!showTooltip)}
                  className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <img
                    src="/user-icon.svg"
                    alt="Usuário"
                    className="w-full h-full object-contain"
                  />
                </button>

                {showTooltip && (
                  <div className="absolute right-0 top-10 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50">
                    {/* Nome do usuário */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Usuário
                      </label>
                      <div className="text-sm text-gray-900 font-semibold">
                        Admin
                      </div>
                    </div>

                    {/* Select de clientes */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cliente
                      </label>
                      <select
                        value={selectedCliente}
                        onChange={(e) => handleClienteChange(e.target.value)}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${clienteFromUrl ? 'bg-gray-100 cursor-not-allowed' : ''
                          }`}
                        disabled={loadingClientes || (clienteFromUrl && !window.location.hostname.includes('localhost'))}
                        title={clienteFromUrl && !window.location.hostname.includes('localhost') ? 'Cliente definido via URL - não é possível alterar' : ''}
                      >
                        <option value="">
                          {loadingClientes ? 'Carregando...' : 'Selecione um cliente'}
                        </option>
                        {clientes.map((cliente) => (
                          <option key={cliente.id} value={cliente.id}>
                            {cliente.nome}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Versão do sistema */}
                    <div className="mb-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Versão do Sistema
                      </label>
                      <div className="text-sm text-gray-600">
                        v{APP_VERSION}
                      </div>
                    </div>

                    {/* Botão para fechar */}
                    <div className="flex justify-end pt-2 border-t border-gray-100">
                      <button
                        onClick={() => setShowTooltip(false)}
                        className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        Fechar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

// Componente principal com Suspense
export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Carregando...</div>}>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </Suspense>
  );
}