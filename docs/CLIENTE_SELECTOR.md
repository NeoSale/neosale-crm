# Sistema de Seleção de Cliente para Super Admin

## Visão Geral

O sistema permite que usuários com role `super_admin` selecionem um cliente específico através de um combobox no header. Quando um cliente é selecionado, todos os dados da aplicação devem ser filtrados para mostrar apenas informações daquele cliente.

## Componentes

### 1. ClienteContext (`src/contexts/ClienteContext.tsx`)

Contexto React que gerencia o estado do cliente selecionado globalmente.

**Exports:**
- `ClienteProvider` - Provider do contexto
- `useCliente()` - Hook para acessar o contexto

**Estado:**
- `selectedClienteId: string | null` - ID do cliente selecionado
- `setSelectedClienteId(id: string | null)` - Função para alterar o cliente
- `reloadData()` - Função para forçar recarga de dados

### 2. useClienteData Hook (`src/hooks/useClienteData.ts`)

Hook customizado que facilita a recarga automática de dados quando o cliente muda.

## Como Usar

### Opção 1: Usando o Hook useClienteData (Recomendado)

```tsx
import { useClienteData } from '@/hooks/useClienteData'
import { useState } from 'react'

function LeadsPage() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(false)

  // O hook automaticamente recarrega os dados quando o cliente mudar
  const { selectedClienteId, reload } = useClienteData(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/leads?cliente_id=${selectedClienteId || ''}`)
      const data = await response.json()
      setLeads(data)
    } finally {
      setLoading(false)
    }
  })

  return (
    <div>
      <h1>Leads {selectedClienteId ? `do Cliente ${selectedClienteId}` : '(Todos)'}</h1>
      {/* ... resto do componente */}
    </div>
  )
}
```

### Opção 2: Usando o Contexto Diretamente

```tsx
import { useCliente } from '@/contexts/ClienteContext'
import { useEffect, useState } from 'react'

function LeadsPage() {
  const { selectedClienteId } = useCliente()
  const [leads, setLeads] = useState([])

  useEffect(() => {
    async function loadLeads() {
      const response = await fetch(`/api/leads?cliente_id=${selectedClienteId || ''}`)
      const data = await response.json()
      setLeads(data)
    }
    
    loadLeads()
  }, [selectedClienteId]) // Recarrega quando selectedClienteId mudar

  return (
    <div>
      <h1>Leads</h1>
      {/* ... resto do componente */}
    </div>
  )
}
```

### Opção 3: Escutando o Evento Customizado

```tsx
import { useEffect, useState } from 'react'

function LeadsPage() {
  const [leads, setLeads] = useState([])

  useEffect(() => {
    const handleClienteChange = (event: CustomEvent) => {
      const { clienteId } = event.detail
      // Recarregar dados com o novo clienteId
      loadLeads(clienteId)
    }

    window.addEventListener('clienteChanged', handleClienteChange as EventListener)
    
    return () => {
      window.removeEventListener('clienteChanged', handleClienteChange as EventListener)
    }
  }, [])

  async function loadLeads(clienteId: string | null) {
    const response = await fetch(`/api/leads?cliente_id=${clienteId || ''}`)
    const data = await response.json()
    setLeads(data)
  }

  return <div>{/* ... */}</div>
}
```

## Comportamento

### Para Super Admin
- Combobox visível no header
- Pode selecionar qualquer cliente ou "Todos os clientes"
- Seleção é salva no localStorage
- Ao trocar de cliente, dispara evento `clienteChanged`

### Para Outros Usuários
- Combobox não é exibido
- `selectedClienteId` sempre será `null`
- Dados filtrados automaticamente pelo backend baseado nas permissões

## Integração com APIs

Ao fazer requisições para o backend, sempre inclua o `selectedClienteId` quando disponível:

```tsx
const { selectedClienteId } = useCliente()

// Opção 1: Query parameter
const url = `/api/leads${selectedClienteId ? `?cliente_id=${selectedClienteId}` : ''}`

// Opção 2: Header
const response = await fetch('/api/leads', {
  headers: {
    'X-Cliente-Id': selectedClienteId || '',
  }
})

// Opção 3: Body (POST/PUT)
const response = await fetch('/api/leads', {
  method: 'POST',
  body: JSON.stringify({
    ...data,
    cliente_id: selectedClienteId,
  })
})
```

## Exemplo Completo

```tsx
'use client'

import { useState } from 'react'
import { useClienteData } from '@/hooks/useClienteData'
import { createClient } from '@/lib/supabase/client'

interface Lead {
  id: string
  nome: string
  email: string
  // ... outros campos
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const { selectedClienteId, reload } = useClienteData(async () => {
    setLoading(true)
    try {
      let query = supabase.from('leads').select('*')
      
      // Filtrar por cliente se selecionado
      if (selectedClienteId) {
        query = query.eq('cliente_id', selectedClienteId)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      setLeads(data || [])
    } catch (error) {
      console.error('Erro ao carregar leads:', error)
    } finally {
      setLoading(false)
    }
  })

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          Leads {selectedClienteId && `(Cliente Selecionado)`}
        </h1>
        <button onClick={reload} className="btn-primary">
          Recarregar
        </button>
      </div>

      {loading ? (
        <div>Carregando...</div>
      ) : (
        <div className="grid gap-4">
          {leads.map(lead => (
            <div key={lead.id} className="card">
              <h3>{lead.nome}</h3>
              <p>{lead.email}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

## Notas Importantes

1. **Persistência**: A seleção do cliente é salva no `localStorage` e persiste entre sessões
2. **Segurança**: O backend DEVE validar as permissões independentemente do cliente selecionado
3. **Performance**: Use o hook `useClienteData` para evitar re-renders desnecessários
4. **Limpeza**: Ao fazer logout, o `selectedClienteId` é automaticamente limpo
5. **URL Parameters**: Se houver `cliente_id` na URL, ele tem prioridade sobre o localStorage
