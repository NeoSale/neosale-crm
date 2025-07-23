# NeoSale CRM - Sistema de Upload de Leads

Uma aplicação web moderna para upload e gerenciamento de planilhas de leads, construída com React, Next.js e Tailwind CSS.

## 🚀 Tecnologias Utilizadas

- **React 18** - Biblioteca para interfaces de usuário
- **Next.js 15** - Framework React com App Router
- **TypeScript** - Tipagem estática para JavaScript
- **Tailwind CSS v4** - Framework CSS utilitário
- **Lucide React** - Biblioteca de ícones
- **SheetJS (xlsx)** - Parser de planilhas Excel

## 🎨 Identidade Visual

- **Cor Primária**: `#403CCF` (azul roxo escuro)
- **Cor Secundária**: `#FBFAFF` (branco com leve toque lilás)
- Design clean, sofisticado e moderno

## 🚀 Funcionalidades

### 📊 Gerenciamento de Leads
- **Tabela de Leads**: Visualização completa de todos os leads cadastrados
- **Busca em Tempo Real**: Filtro por nome, email, empresa e outros campos
- **Estatísticas Dinâmicas**: Contadores automáticos de leads por status
- **Atualização Automática**: Sincronização com API em tempo real

### 📤 Importação de Dados
- **Upload de Planilhas Excel**: Suporte para arquivos `.xlsx` e `.xls`
- **Drag & Drop**: Interface intuitiva para arrastar e soltar arquivos
- **Preview de Dados**: Visualização dos leads antes da importação
- **Importação em Lote**: Adição de múltiplos leads simultaneamente

### 🔌 Integração com API
- **Consulta de Leads**: Busca dados da API REST em `http://localhost:3000`
- **Fallback Local**: Dados de exemplo quando API não está disponível
- **Tratamento de Erros**: Notificações claras sobre status da conexão
- **Cache Local**: Armazenamento temporário para melhor performance

### 🎨 Interface e UX
- **Design Responsivo**: Interface adaptável para diferentes dispositivos
- **Estados de Loading**: Feedback visual durante processamento
- **Validação Automática**: Detecção de campos e validação de dados
- **Notificações**: Alertas de sucesso e erro para ações do usuário

## 🛠️ Instalação e Execução

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn

### Passos para executar

1. **Clone o repositório**
   ```bash
   git clone <url-do-repositorio>
   cd neosale-crm
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Execute o servidor de desenvolvimento**
   ```bash
   npm run dev
   ```

4. **Acesse a aplicação**
   Abra [http://localhost:3000](http://localhost:3000) no seu navegador

## 📁 Estrutura do Projeto

```
src/
├── app/
│   ├── globals.css          # Estilos globais e configuração do Tailwind
│   ├── layout.tsx           # Layout principal da aplicação
│   └── page.tsx             # Página inicial
├── components/
│   ├── LeadsManager.tsx     # Gerenciador principal de leads
│   ├── UploadLeads.tsx      # Componente de upload de planilhas
│   └── LeadTable.tsx        # Componente de visualização de leads
├── hooks/
│   └── useLeads.ts          # Hook personalizado para gerenciar leads
└── services/
    └── leadsApi.ts          # Serviço de integração com API REST
```

## 🔌 API Integration

### Endpoints Esperados

O sistema espera uma API REST rodando em `http://localhost:3000` com os seguintes endpoints:

```
GET    /api/leads              # Buscar todos os leads
GET    /api/leads/:id          # Buscar lead por ID
POST   /api/leads              # Criar novo lead
POST   /api/leads/bulk         # Criar múltiplos leads
PUT    /api/leads/:id          # Atualizar lead
DELETE /api/leads/:id          # Deletar lead
GET    /api/leads/search       # Buscar leads com filtros
GET    /api/leads/stats        # Obter estatísticas dos leads
```

### Documentação Swagger

A documentação completa da API deve estar disponível em:
`http://localhost:3000/api-docs/`

### Fallback Mode

Quando a API não estiver disponível, o sistema automaticamente:
- Exibe dados de exemplo para demonstração
- Mostra notificação de "modo offline"
- Permite operações locais temporárias
- Mantém funcionalidade de upload e preview

## 🎨 Configuração do Tailwind CSS

O projeto utiliza Tailwind CSS v4 com cores personalizadas configuradas em `globals.css`:

```css
:root {
  --primary: #403CCF;
  --secondary: #FBFAFF;
}

@theme inline {
  --color-primary: var(--primary);
  --color-secondary: var(--secondary);
}
```

## 📦 Componentes Principais

### UploadLeads
Componente responsável pelo upload e processamento de planilhas:
- Gerenciamento de estado do arquivo
- Parsing com SheetJS
- Validação de formato
- Interface drag & drop

### LeadTable
Componente para exibição dos dados importados:
- Tabela responsiva
- Estatísticas automáticas
- Preview limitado
- Design elegante

## 🔧 Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Gera build de produção
- `npm run start` - Inicia servidor de produção
- `npm run lint` - Executa linting do código

## 📝 Próximos Passos

- [ ] Integração com API backend
- [ ] Validação avançada de dados
- [ ] Mapeamento de campos
- [ ] Histórico de uploads
- [ ] Exportação de dados
- [ ] Autenticação de usuários

## 🚀 Deploy

### Deploy Automatizado

Para fazer o deploy da aplicação:

```bash
npm run deploy
```

Este comando irá:
- Fazer build da aplicação
- Criar e enviar a imagem Docker
- Preparar para deploy em produção

### Deploy no EasyPanel

Para deploy no EasyPanel, consulte o guia específico: [EASYPANEL-SETUP.md](./EASYPANEL-SETUP.md)

**Configuração rápida:**
1. Use a imagem: `brunobspaiva/neosale-crm:latest`
2. Configure a variável: `NEXT_PUBLIC_API_URL=<sua-url-da-api>`
3. Mapeie a porta: `3000:80`

### Documentação Adicional

- [DEPLOY.md](./DEPLOY.md) - Deploy geral e Docker Hub
- [README-Docker.md](./README-Docker.md) - Configuração Docker detalhada
- [EASYPANEL-SETUP.md](./EASYPANEL-SETUP.md) - Configuração específica para EasyPanel

## 🤝 Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues e pull requests.

## 📄 Licença

Este projeto está sob a licença MIT.
