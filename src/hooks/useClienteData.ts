import { useEffect, useRef, useCallback } from 'react'
import { useCliente } from '@/contexts/ClienteContext'

/**
 * Hook customizado para facilitar a recarga de dados quando o cliente selecionado muda
 * 
 * @param fetchData - Função que busca os dados (pode ser async)
 * @param dependencies - Array de dependências adicionais (opcional)
 * 
 * @example
 * ```tsx
 * const { selectedClienteId } = useCliente()
 * const [leads, setLeads] = useState([])
 * 
 * useClienteData(async () => {
 *   const data = await fetchLeads(selectedClienteId)
 *   setLeads(data)
 * }, [selectedClienteId])
 * ```
 */
export function useClienteData(
  fetchData: () => void | Promise<void>,
  dependencies: any[] = []
) {
  const { selectedClienteId } = useCliente()
  const isFirstRender = useRef(true)

  const loadData = useCallback(async () => {
    try {
      await fetchData()
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    }
  }, [fetchData])

  // Carregar dados na primeira renderização
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      loadData()
    }
  }, [loadData])

  // Recarregar dados quando o cliente mudar
  useEffect(() => {
    if (!isFirstRender.current) {
      loadData()
    }
  }, [selectedClienteId, ...dependencies, loadData])

  // Escutar evento customizado de mudança de cliente
  useEffect(() => {
    const handleClienteChange = () => {
      if (!isFirstRender.current) {
        loadData()
      }
    }

    window.addEventListener('clienteChanged', handleClienteChange)
    return () => {
      window.removeEventListener('clienteChanged', handleClienteChange)
    }
  }, [loadData])

  return { selectedClienteId, reload: loadData }
}
