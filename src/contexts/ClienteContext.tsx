'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
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
  const initializedFromStorage = useRef(false)

  // Inicializar do localStorage no cliente (evita problemas de hidratação SSR)
  useEffect(() => {
    if (initializedFromStorage.current) return
    initializedFromStorage.current = true

    const saved = localStorage.getItem('selected_cliente_id')
    if (saved) {
      console.log('📦 ClienteContext: Carregando cliente do localStorage:', saved)
      setSelectedClienteIdState(saved)
    } else if (profile?.cliente_id) {
      // Fallback apenas se não houver valor salvo
      console.log('📦 ClienteContext: Usando cliente do profile (fallback):', profile.cliente_id)
      setSelectedClienteIdState(profile.cliente_id)
      localStorage.setItem('selected_cliente_id', profile.cliente_id)
    }
  }, [profile])

  // Função para alterar o cliente selecionado
  const setSelectedClienteId = useCallback((clienteId: string | null) => {
    // Log com stack trace para identificar quem está chamando
    console.log('🔄 setSelectedClienteId chamado com:', clienteId)
    console.trace('Stack trace:')

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
