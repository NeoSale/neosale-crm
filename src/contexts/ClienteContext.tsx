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

  // Carregar cliente do localStorage ao iniciar E quando o profile mudar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedClienteId = localStorage.getItem('selected_cliente_id')
      if (savedClienteId && savedClienteId !== selectedClienteId) {
        setSelectedClienteIdState(savedClienteId)
        console.log('📍 ClienteContext: Cliente carregado do localStorage:', savedClienteId)
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

  // Limpar cliente selecionado se não for super_admin
  useEffect(() => {
    if (profile && profile.role !== 'super_admin') {
      setSelectedClienteIdState(null)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('selected_cliente_id')
      }
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
