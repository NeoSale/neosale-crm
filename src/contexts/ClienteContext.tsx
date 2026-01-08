'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useAuth } from './AuthContext'

interface ClienteContextType {
  selectedClienteId: string | null
  setSelectedClienteId: (clienteId: string | null) => void
  reloadData: () => void
}

const ClienteContext = createContext<ClienteContextType | undefined>(undefined)

export function ClienteProvider({ children }: { children: React.ReactNode }) {
  const [selectedClienteId, setSelectedClienteIdState] = useState<string | null>(null)
  const [reloadTrigger, setReloadTrigger] = useState(0)
  const { profile } = useAuth()

  // Carregar cliente do profile ou localStorage ao iniciar
  useEffect(() => {
    // Super_admin pode selecionar qualquer cliente, então priorizar localStorage
    if (profile?.role === 'super_admin') {
      if (typeof window !== 'undefined') {
        const savedClienteId = localStorage.getItem('selected_cliente_id')
        if (savedClienteId && savedClienteId !== selectedClienteId) {
          setSelectedClienteIdState(savedClienteId)
        }
        // Se não tem nada no localStorage, não setar nada (permite ver todos)
      }
    } 
    // Para outros usuários, usar o cliente_id do profile
    else if (profile?.cliente_id) {
      setSelectedClienteIdState(profile.cliente_id)
      if (typeof window !== 'undefined') {
        localStorage.setItem('selected_cliente_id', profile.cliente_id)
      }
    } else if (typeof window !== 'undefined') {
      // Fallback para localStorage
      const savedClienteId = localStorage.getItem('selected_cliente_id')
      if (savedClienteId && savedClienteId !== selectedClienteId) {
        setSelectedClienteIdState(savedClienteId)
      }
    }
  }, [profile]) // Recarrega quando o profile muda (após login)

  // Função para alterar o cliente selecionado
  const setSelectedClienteId = useCallback((clienteId: string | null) => {
    setSelectedClienteIdState(clienteId)
    
    if (typeof window !== 'undefined') {
      if (clienteId) {
        localStorage.setItem('selected_cliente_id', clienteId)
      } else {
        localStorage.removeItem('selected_cliente_id')
      }
    }
    
    // Disparar evento de recarga de dados
    setReloadTrigger(prev => prev + 1)
  }, [])

  // Função para forçar recarga de dados
  const reloadData = useCallback(() => {
    setReloadTrigger(prev => prev + 1)
  }, [])

  // Disparar evento customizado quando o cliente mudar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('clienteChanged', {
        detail: { clienteId: selectedClienteId, reloadTrigger }
      })
      window.dispatchEvent(event)
    }
  }, [selectedClienteId, reloadTrigger])

  // Para usuários não super_admin, usar sempre o cliente_id do profile
  useEffect(() => {
    if (profile && profile.role !== 'super_admin' && profile.cliente_id) {
      setSelectedClienteIdState(profile.cliente_id)
    }
  }, [profile])

  return (
    <ClienteContext.Provider
      value={{
        selectedClienteId,
        setSelectedClienteId,
        reloadData,
      }}
    >
      {children}
    </ClienteContext.Provider>
  )
}

export function useCliente() {
  const context = useContext(ClienteContext)
  if (context === undefined) {
    throw new Error('useCliente must be used within a ClienteProvider')
  }
  return context
}
