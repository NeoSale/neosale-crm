'use client';

import React, { useState } from 'react';
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
} from '@heroicons/react/24/outline';

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
  { name: 'Relatórios', href: '/reports', icon: ChartBarIcon },
  { name: 'Documentos', href: '/documents', icon: DocumentTextIcon },
  { 
    name: 'Configurações', 
    icon: CogIcon,
    children: [
      { name: 'Follow Up', href: '/followup', icon: SpeakerWaveIcon },
      { name: 'Mensagens', href: '/mensagens', icon: PaperAirplaneIcon },
    ]
  },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['Configurações']);
  const pathname = usePathname();

  const toggleMenu = (menuName: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuName) 
        ? prev.filter(name => name !== menuName)
        : [...prev, menuName]
    );
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
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-lg">N</span>
            </div>
            {sidebarOpen && (
              <div className="flex flex-col">
                <h1 className="text-xl font-bold text-primary">NeoSale</h1>
                <span className="text-xs text-gray-500">CRM Admin</span>
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
            const isExpanded = expandedMenus.includes(item.name);
            const hasActiveChild = item.children?.some(child => pathname === child.href);
            
            if (item.children) {
              return (
                <div key={item.name}>
                  <button
                    onClick={() => toggleMenu(item.name)}
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
                  {sidebarOpen && isExpanded && (
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

        {/* User Profile */}
        {sidebarOpen && (
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600">U</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">Usuário Admin</p>
                <p className="text-xs text-gray-500 truncate">admin@neosale.com</p>
              </div>
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
              <h2 className="text-2xl font-semibold text-gray-900">
                {pathname === '/' ? 'Dashboard' : 
                 pathname === '/leads' ? 'Leads' :
                 pathname === '/mensagens' ? 'Mensagens' :
                 pathname === '/reports' ? 'Relatórios' :
                 pathname === '/documents' ? 'Documentos' :
                 pathname === '/configuracoes' ? 'Configurações' : 'Dashboard'}
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-md transition-colors">
                <BellIcon className="h-5 w-5" />
              </button>
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">U</span>
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