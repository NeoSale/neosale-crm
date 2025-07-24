'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
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
} from '@heroicons/react/24/outline';
import { APP_VERSION } from '../utils/app-version';
import ThemeToggle from './ThemeToggle';

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
  { name: 'Leads', href: '/leads', icon: UsersIcon },
  { name: 'Chat', href: '/chat', icon: ChatBubbleLeftRightIcon },
  { name: 'Documentos', href: '/documents', icon: DocumentTextIcon },
  { name: 'Integração', href: '/integracao', icon: LinkIcon },
  { 
    name: 'Relatórios', 
    icon: ChartBarIcon,
    children: [
      { name: 'Follow Up', href: '/relatorios/followup', icon: SpeakerWaveIcon },
    ]
  },
  { 
    name: 'Configurações', 
    icon: CogIcon,
    children: [
      { name: 'Mensagens', href: '/configuracoes/mensagens', icon: PaperAirplaneIcon },
      { name: 'Follow Up', href: '/configuracoes/followup', icon: SpeakerWaveIcon },
    ]
  },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [manuallyClosedMenus, setManuallyClosedMenus] = useState<string[]>([]);
  const pathname = usePathname();

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
                src="/neosale-logo.svg" 
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
            const hasActiveChild = item.children?.some(child => pathname === child.href);
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
                        return (
                          <a
                            key={child.name}
                            href={child.href}
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
                      })}
                    </div>
                  )}
                </div>
              );
            }
            
            return (
              <a
                key={item.name}
                href={item.href}
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
          })}
        </nav>

        {/* App Version */}
        {sidebarOpen && (
          <div className="border-t border-gray-200 px-2 py-4">
            <div className="flex items-center px-3 py-2 text-sm font-medium">
              <div className="w-5 h-5 mr-3 flex-shrink-0 flex items-center justify-center">
                <img 
                  src="/version-icon.svg" 
                  alt="Versão" 
                  className="w-4 h-4"
                />
              </div>
              <span className="text-gray-600">Versão {APP_VERSION}</span>
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
                 pathname === '/mensagens' ? 'Mensagens' :
                 pathname === '/configuracoes/mensagens' ? 'Mensagens' :
                 pathname === '/followup' ? 'Follow Up' :
                 pathname === '/configuracoes/followup' ? 'Follow Up' :
                 pathname === '/relatorios/followup' ? 'Follow Up' :
                 pathname === '/integracao' ? 'Integração' :
                 pathname === '/reports' ? 'Relatórios' :
                 pathname === '/documents' ? 'Documentos' :
                 pathname === '/configuracoes' ? 'Configurações' : 'Dashboard'}
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <button className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-md transition-colors">
                <BellIcon className="h-5 w-5" />
              </button>
              <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-gray-100">
                <img 
                  src="/user-icon.svg" 
                  alt="Usuário" 
                  className="w-full h-full object-contain"
                />
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