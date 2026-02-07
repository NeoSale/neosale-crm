'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@neosale/auth'
import { useCliente } from '@/contexts/ClienteContext'
import { ThemeToggle } from '@neosale/ui'
import { AccountMenuSidebar } from '@neosale/auth'
import { usePermissions } from '@/hooks/usePermissions'
import { clientesApi, Cliente } from '@/services/clientesApi'
import { APP_VERSION } from '@/utils/app-version'
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
  UserGroupIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { BookOpenIcon, Bot, DatabaseIcon } from 'lucide-react'

interface MenuItem {
  name: string
  href?: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  current?: boolean
  children?: MenuItem[]
  minRole?: 'super_admin' | 'admin' | 'manager' | 'salesperson' | 'member' | 'viewer'
}

const navigation: MenuItem[] = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Chat', href: '/chat', icon: ChatBubbleLeftRightIcon },
  { name: 'Leads', href: '/leads', icon: UsersIcon },
  { name: 'Agentes', href: '/agentes', icon: Bot as any },
  {
    name: 'Integrações',
    icon: LinkIcon,
    children: [
      { name: 'WhatsApp', href: '/integracoes/whatsapp-v2', icon: PaperAirplaneIcon },
    ]
  },
  {
    name: 'Conhecimento',
    icon: BookOpenIcon as any,
    children: [
      { name: 'Base', href: '/conhecimento/base', icon: DatabaseIcon as any },
      { name: 'Documentos', href: '/conhecimento/documentos', icon: DocumentTextIcon },
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
      { name: 'Configurações', href: '/followup/configuracoes', icon: CogIcon },
    ]
  },
  {
    name: 'Relatórios',
    icon: ChartBarIcon,
    minRole: 'manager',
    children: [
      { name: 'Distribuição', href: '/relatorios/distribuicao', icon: UserGroupIcon, minRole: 'manager' },
    ]
  },
  {
    name: 'Configurações',
    icon: CogIcon,
    children: [
      { name: 'Perfil', href: '/configuracoes/perfil', icon: UsersIcon },
      { name: 'Negócio', href: '/configuracoes/negocio', icon: CogIcon },
      { name: 'Notificações', href: '/configuracoes/notificacoes', icon: BellIcon, minRole: 'admin' },
      { name: 'Membros', href: '/members', icon: UsersIcon },
    ]
  },
]

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState<string[]>([])
  const [manuallyClosedMenus, setManuallyClosedMenus] = useState<string[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loadingClientes, setLoadingClientes] = useState(false)
  const [currentClienteId, setCurrentClienteId] = useState<string>('')

  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const { user, profile, signOut } = useAuth()
  const { selectedClienteId, setSelectedClienteId } = useCliente()
  const { isAtLeast } = usePermissions()

  // Filter navigation items based on user permissions
  const filterMenuByRole = (items: MenuItem[]): MenuItem[] => {
    return items
      .filter(item => !item.minRole || isAtLeast(item.minRole))
      .map(item => ({
        ...item,
        children: item.children ? filterMenuByRole(item.children) : undefined
      }))
      .filter(item => !item.children || item.children.length > 0)
  }

  const filteredNavigation = filterMenuByRole(navigation)

  // Load clientes for super_admin
  useEffect(() => {
    if (profile?.role === 'super_admin') {
      loadClientes()
    }
  }, [profile?.role])

  const loadClientes = async () => {
    if (clientes.length > 0) return
    setLoadingClientes(true)
    try {
      const response = await clientesApi.getClientes()
      if (response.success && response.data) {
        setClientes(response.data)
      }
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
    } finally {
      setLoadingClientes(false)
    }
  }

  // Sync with cliente context
  useEffect(() => {
    if (selectedClienteId) {
      setCurrentClienteId(selectedClienteId)
    } else {
      setCurrentClienteId('')
    }
  }, [selectedClienteId])

  // Check URL for cliente_id
  useEffect(() => {
    const clienteIdFromUrl = searchParams.get('cliente_id')
    if (clienteIdFromUrl) {
      setCurrentClienteId(clienteIdFromUrl)
      setSelectedClienteId(clienteIdFromUrl)
    }
  }, [searchParams, setSelectedClienteId])

  // Auto expand menu with active page
  useEffect(() => {
    const menuWithActivePage = filteredNavigation.find(item =>
      item.children?.some(child => pathname === child.href)
    )
    if (menuWithActivePage && !expandedMenus.includes(menuWithActivePage.name)) {
      setExpandedMenus(prev => [...prev, menuWithActivePage.name])
      setManuallyClosedMenus(prev => prev.filter(name => name !== menuWithActivePage.name))
    }
  }, [pathname, filteredNavigation])

  const toggleMenu = (menuName: string) => {
    const isCurrentlyExpanded = expandedMenus.includes(menuName)
    if (isCurrentlyExpanded) {
      setExpandedMenus(prev => prev.filter(name => name !== menuName))
      setManuallyClosedMenus(prev => [...prev, menuName])
    } else {
      setExpandedMenus(prev => [...prev, menuName])
      setManuallyClosedMenus(prev => prev.filter(name => name !== menuName))
    }
  }

  const handleClienteChange = (clienteId: string) => {
    setSelectedClienteId(clienteId || null)
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      // Redirecionar para auth com URL de retorno
      if (typeof window !== 'undefined') {
        const authUrl = process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:3003'
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
        const redirectUrl = encodeURIComponent(appUrl)
        window.location.href = `${authUrl}/login?redirect_url=${redirectUrl}`
      }
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
      // Mesmo com erro, redirecionar
      const authUrl = process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:3003'
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
      const redirectUrl = encodeURIComponent(appUrl)
      window.location.href = `${authUrl}/login?redirect_url=${redirectUrl}`
    }
  }

  const buildUrlWithClienteId = (href: string) => {
    if (!currentClienteId) return href
    const url = new URL(href, window.location.origin)
    url.searchParams.set('cliente_id', currentClienteId)
    return url.pathname + url.search
  }

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(href + '/')
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-200 dark:border-gray-700">
        <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
          <img src="/icone-azul.png" alt="NeoCRM Logo" className="w-8 h-8" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-primary">NeoCRM</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">v{APP_VERSION}</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {filteredNavigation.map((item) => {
          const Icon = item.icon
          const isItemActive = item.href ? isActive(item.href) : false
          const hasActiveChild = item.children?.some(child =>
            child.href ? isActive(child.href) : child.children?.some(gc => gc.href && isActive(gc.href))
          )
          const isManuallyClosed = manuallyClosedMenus.includes(item.name)
          const isExpanded = expandedMenus.includes(item.name) || (hasActiveChild && !isManuallyClosed)

          if (item.children) {
            return (
              <div key={item.name}>
                <button
                  onClick={() => {
                    if (collapsed) setCollapsed(false)
                    toggleMenu(item.name)
                  }}
                  className={classNames(
                    hasActiveChild
                      ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-dark'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-white',
                    'group flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors'
                  )}
                >
                  <Icon
                    className={classNames(
                      hasActiveChild ? 'text-primary dark:text-primary-dark' : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-400',
                      'mr-3 flex-shrink-0 h-5 w-5'
                    )}
                    aria-hidden="true"
                  />
                  {!collapsed && (
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
                {!collapsed && isExpanded && (
                  <div className="ml-6 mt-1 space-y-1">
                    {item.children.map((child) => {
                      const ChildIcon = child.icon
                      const isChildActive = child.href ? isActive(child.href) : false
                      const hasActiveGrandchild = child.children?.some(gc => gc.href && isActive(gc.href))
                      const childIsExpanded = expandedMenus.includes(`${item.name}-${child.name}`) || hasActiveGrandchild

                      if (child.children) {
                        return (
                          <div key={child.name}>
                            <button
                              onClick={() => toggleMenu(`${item.name}-${child.name}`)}
                              className={classNames(
                                hasActiveGrandchild
                                  ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-dark'
                                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-white',
                                'group flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors'
                              )}
                            >
                              <ChildIcon
                                className={classNames(
                                  hasActiveGrandchild ? 'text-primary dark:text-primary-dark' : 'text-gray-400 group-hover:text-gray-500',
                                  'mr-3 flex-shrink-0 h-4 w-4'
                                )}
                                aria-hidden="true"
                              />
                              <span className="flex-1 text-left">{child.name}</span>
                              {childIsExpanded ? <ChevronUpIcon className="h-3 w-3" /> : <ChevronDownIcon className="h-3 w-3" />}
                            </button>
                            {childIsExpanded && (
                              <div className="ml-6 mt-1 space-y-1">
                                {child.children.map((grandchild) => {
                                  const GrandchildIcon = grandchild.icon
                                  const isGrandchildActive = grandchild.href ? isActive(grandchild.href) : false
                                  return (
                                    <Link
                                      key={grandchild.name}
                                      href={buildUrlWithClienteId(grandchild.href!)}
                                      onClick={() => setMobileOpen(false)}
                                      className={classNames(
                                        isGrandchildActive
                                          ? 'bg-primary text-white dark:bg-primary dark:!text-white'
                                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-white',
                                        'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors'
                                      )}
                                    >
                                      <GrandchildIcon
                                        className={classNames(
                                          isGrandchildActive ? 'text-white dark:!text-white' : 'text-gray-400 group-hover:text-gray-500',
                                          'mr-3 flex-shrink-0 h-3 w-3'
                                        )}
                                        aria-hidden="true"
                                      />
                                      {grandchild.name}
                                    </Link>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )
                      }

                      return child.href ? (
                        <Link
                          key={child.name}
                          href={buildUrlWithClienteId(child.href)}
                          onClick={() => setMobileOpen(false)}
                          className={classNames(
                            isChildActive
                              ? 'bg-primary text-white dark:bg-primary dark:!text-white'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-white',
                            'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors'
                          )}
                        >
                          <ChildIcon
                            className={classNames(
                              isChildActive ? 'text-white dark:!text-white' : 'text-gray-400 group-hover:text-gray-500',
                              'mr-3 flex-shrink-0 h-4 w-4'
                            )}
                            aria-hidden="true"
                          />
                          {child.name}
                        </Link>
                      ) : null
                    })}
                  </div>
                )}
              </div>
            )
          }

          return item.href ? (
            <Link
              key={item.name}
              href={buildUrlWithClienteId(item.href)}
              onClick={() => setMobileOpen(false)}
              className={classNames(
                isItemActive
                  ? 'bg-primary text-white dark:bg-primary dark:!text-white'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-white',
                'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors'
              )}
            >
              <Icon
                className={classNames(
                  isItemActive ? 'text-white dark:!text-white' : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-400',
                  'mr-3 flex-shrink-0 h-5 w-5'
                )}
                aria-hidden="true"
              />
              {!collapsed && item.name}
            </Link>
          ) : null
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
        {/* Theme toggle */}
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'px-1'}`} suppressHydrationWarning>
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
          {!collapsed && (
            <span className="text-sm text-gray-600 dark:text-gray-300 ml-2" suppressHydrationWarning>
              {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
            </span>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
        >
          {collapsed ? (
            <ChevronRightIcon className="w-5 h-5" />
          ) : (
            <ChevronLeftIcon className="w-5 h-5" />
          )}
          {!collapsed && <span>Recolher</span>}
        </button>

        {/* Account Menu */}
        <AccountMenuSidebar
          profile={profile ? {
            email: profile.email,
            full_name: profile.full_name,
            avatar_url: profile.avatar_url,
            role: profile.role as 'super_admin' | 'admin' | 'member' | 'viewer' | undefined,
          } : null}
          onSignOut={handleSignOut}
          collapsed={collapsed}
          showSettings={false}
          clientes={clientes.map(c => ({ id: c.id, nome: c.nome }))}
          selectedClienteId={selectedClienteId}
          onClienteChange={handleClienteChange}
          loadingClientes={loadingClientes}
          onLoadClientes={loadClientes}
        />
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md"
      >
        <Bars3Icon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={classNames(
          'lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 transform transition-transform',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <XMarkIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={classNames(
          'hidden lg:block bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-200 shrink-0',
          collapsed ? 'w-16' : 'w-56'
        )}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
