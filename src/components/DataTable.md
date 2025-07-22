# DataTable Component

Um componente de tabela reutilizável e altamente configurável para React/Next.js com TypeScript.

## Características

- ✅ **Busca integrada** - Busca em múltiplos campos
- ✅ **Ordenação** - Ordenação por colunas com indicadores visuais
- ✅ **Paginação** - Controle completo de paginação
- ✅ **Ações customizáveis** - Botões de ação por linha
- ✅ **Responsivo** - Layout adaptável para diferentes telas
- ✅ **TypeScript** - Totalmente tipado
- ✅ **Customizável** - Classes CSS e renderização personalizada
- ✅ **Loading state** - Estado de carregamento
- ✅ **Empty state** - Estado vazio customizável

## Instalação

O componente já está incluído no projeto. Importe-o assim:

```tsx
import DataTable, { Column, Action } from '../components/DataTable';
```

## Uso Básico

```tsx
import React from 'react';
import DataTable, { Column } from '../components/DataTable';

interface User {
  id: number;
  name: string;
  email: string;
  status: string;
}

const users: User[] = [
  { id: 1, name: 'João', email: 'joao@email.com', status: 'ativo' },
  { id: 2, name: 'Maria', email: 'maria@email.com', status: 'inativo' },
];

const columns: Column<User>[] = [
  { key: 'name', label: 'Nome', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'status', label: 'Status', sortable: false },
];

function UserTable() {
  return (
    <DataTable
      data={users}
      columns={columns}
      searchable={true}
      paginated={true}
    />
  );
}
```

## Props

### DataTableProps<T>

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `data` | `T[]` | - | **Obrigatório.** Array de dados para exibir |
| `columns` | `Column<T>[]` | - | **Obrigatório.** Configuração das colunas |
| `actions` | `Action<T>[]` | `[]` | Ações disponíveis para cada linha |
| `searchable` | `boolean` | `true` | Habilita busca |
| `searchPlaceholder` | `string` | `"Buscar..."` | Placeholder do campo de busca |
| `searchFields` | `(keyof T)[]` | - | Campos específicos para busca |
| `sortable` | `boolean` | `true` | Habilita ordenação |
| `paginated` | `boolean` | `true` | Habilita paginação |
| `itemsPerPageOptions` | `number[]` | `[5, 10, 20, 50]` | Opções de itens por página |
| `defaultItemsPerPage` | `number` | `10` | Itens por página padrão |
| `loading` | `boolean` | `false` | Estado de carregamento |
| `emptyMessage` | `string` | `"Nenhum item encontrado"` | Mensagem quando vazio |
| `emptyIcon` | `React.ReactNode` | - | Ícone para estado vazio |
| `className` | `string` | `""` | Classes CSS para o container |
| `headerClassName` | `string` | `""` | Classes CSS para o cabeçalho |
| `rowClassName` | `string \| function` | `""` | Classes CSS para as linhas |
| `onRowClick` | `function` | - | Callback ao clicar na linha |

### Column<T>

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `key` | `keyof T \| string` | - | **Obrigatório.** Chave do campo |
| `label` | `string` | - | **Obrigatório.** Rótulo da coluna |
| `sortable` | `boolean` | `true` | Se a coluna é ordenável |
| `render` | `function` | - | Função de renderização customizada |
| `width` | `string` | - | Largura da coluna (CSS) |
| `align` | `'left' \| 'center' \| 'right'` | `'left'` | Alinhamento do conteúdo |

### Action<T>

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `label` | `string` | - | **Obrigatório.** Rótulo da ação |
| `icon` | `React.ReactNode` | - | Ícone da ação |
| `onClick` | `function` | - | **Obrigatório.** Callback da ação |
| `className` | `string` | - | Classes CSS do botão |
| `show` | `function` | - | Condição para mostrar a ação |

## Exemplos Avançados

### Renderização Customizada

```tsx
const columns: Column<User>[] = [
  {
    key: 'status',
    label: 'Status',
    render: (value: string) => (
      <span className={`px-2 py-1 rounded ${
        value === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        {value}
      </span>
    ),
  },
  {
    key: 'created_at',
    label: 'Data Criação',
    render: (value: string) => new Date(value).toLocaleDateString('pt-BR'),
  },
];
```

### Ações Condicionais

```tsx
const actions: Action<User>[] = [
  {
    label: 'Editar',
    icon: <PencilIcon className="h-4 w-4" />,
    onClick: (user) => editUser(user.id),
    className: 'text-blue-600 hover:bg-blue-100',
  },
  {
    label: 'Excluir',
    icon: <TrashIcon className="h-4 w-4" />,
    onClick: (user) => deleteUser(user.id),
    className: 'text-red-600 hover:bg-red-100',
    show: (user) => user.status !== 'admin', // Só mostra para não-admins
  },
];
```

### Busca em Campos Específicos

```tsx
<DataTable
  data={users}
  columns={columns}
  searchFields={['name', 'email']} // Busca apenas em nome e email
  searchPlaceholder="Buscar por nome ou email..."
/>
```

### Classes CSS Dinâmicas

```tsx
<DataTable
  data={users}
  columns={columns}
  rowClassName={(user, index) => {
    if (user.status === 'inativo') return 'opacity-50';
    if (index % 2 === 0) return 'bg-gray-50';
    return '';
  }}
/>
```

### Valores Aninhados

```tsx
interface User {
  id: number;
  name: string;
  profile: {
    company: string;
    role: string;
  };
}

const columns: Column<User>[] = [
  { key: 'name', label: 'Nome' },
  { key: 'profile.company', label: 'Empresa' }, // Acesso aninhado
  { key: 'profile.role', label: 'Cargo' },
];
```

## Integração com APIs

```tsx
function UserTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers()
      .then(setUsers)
      .finally(() => setLoading(false));
  }, []);

  return (
    <DataTable
      data={users}
      columns={columns}
      loading={loading}
      emptyMessage="Nenhum usuário encontrado"
      emptyIcon={<UserIcon className="h-12 w-12 text-gray-400" />}
    />
  );
}
```

## Estilização

O componente usa Tailwind CSS e pode ser customizado através das props de className:

```tsx
<DataTable
  className="border-2 border-blue-200" // Container principal
  headerClassName="bg-blue-50" // Cabeçalho
  rowClassName="hover:bg-blue-50" // Linhas
/>
```

## Acessibilidade

- Suporte a navegação por teclado
- Labels apropriados para leitores de tela
- Indicadores visuais de ordenação
- Estados de foco visíveis

## Performance

- Usa `useMemo` para otimizar filtragem e ordenação
- Renderização eficiente com keys apropriadas
- Paginação para grandes datasets

## Migração de Tabelas Existentes

Para migrar uma tabela existente:

1. Defina a interface TypeScript dos seus dados
2. Configure as colunas usando a interface `Column<T>`
3. Mova as ações para a interface `Action<T>`
4. Substitua a tabela HTML pelo componente `DataTable`

Veja o arquivo `DataTableExample.tsx` para um exemplo completo de migração.