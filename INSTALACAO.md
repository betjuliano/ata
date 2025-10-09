# Guia de Instalação - Sistema Ata Audio

Este guia fornece instruções passo a passo para configurar e executar o Sistema Ata Audio em diferentes ambientes.

## Configuração Rápida (Desenvolvimento)

### 1. Preparação do Ambiente

```bash
# Clone o projeto
git clone <url-do-repositorio>
cd sistema-ata-audio

# Instale as dependências do frontend
cd frontend
pnpm install
```

### 2. Configuração do Supabase

1. **Crie uma conta no Supabase**: https://supabase.com
2. **Crie um novo projeto**
3. **Configure as variáveis de ambiente**:

```bash
# No diretório frontend, copie o arquivo de exemplo
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
```

### 3. Configuração do Banco de Dados

1. **Acesse o Supabase Dashboard**
2. **Vá para SQL Editor**
3. **Execute o script de migração**:

Copie e execute o conteúdo do arquivo `supabase/migrations/001_initial_schema.sql`

### 4. Configuração do Storage

No Supabase Dashboard:

1. **Vá para Storage**
2. **Crie os buckets necessários**:
   - `audios` (privado)
   - `pautas` (privado)
   - `atas-geradas` (privado)

### 5. Deploy das Edge Functions

```bash
# Instale a CLI do Supabase
npm install -g supabase

# Faça login
supabase login

# Vincule seu projeto
supabase link --project-ref SEU_ID_PROJETO

# Deploy das funções
supabase functions deploy processar-ata
```

### 6. Executar a Aplicação

```bash
# No diretório frontend
pnpm run dev --host
```

A aplicação estará disponível em: http://localhost:5173

## Configuração com IA Real (Opcional)

Para ativar o processamento real com OpenAI:

### 1. Obter Chave da API OpenAI

1. **Crie uma conta na OpenAI**: https://platform.openai.com
2. **Gere uma API Key**
3. **Configure no Supabase**:
   - Vá para Project Settings > Edge Functions
   - Adicione a variável de ambiente: `OPENAI_API_KEY`

### 2. Deploy da Função com IA

```bash
supabase functions deploy processar-ata-real
```

### 3. Configurar Webhook

No Supabase Dashboard:

1. **Vá para Database > Webhooks**
2. **Crie um novo webhook**:
   - Tabela: `atas`
   - Evento: `INSERT`
   - URL: `https://seu-projeto.supabase.co/functions/v1/processar-ata-real`

## Configuração para Produção

### Opção 1: Vercel + Supabase

1. **Deploy do Frontend na Vercel**:

```bash
# Instale a CLI da Vercel
npm install -g vercel

# No diretório frontend
vercel --prod
```

2. **Configure as variáveis de ambiente na Vercel**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### Opção 2: Docker

1. **Build da imagem**:

```bash
docker-compose build
```

2. **Executar em produção**:

```bash
docker-compose --profile production up -d
```

## Solução de Problemas

### Problemas Comuns

**Erro de CORS**: Verifique se a URL do frontend está configurada nas configurações do Supabase.

**Falha no Upload**: Confirme se os buckets de storage foram criados e as políticas RLS estão ativas.

**Edge Function não executa**: Verifique se o webhook está configurado corretamente e se a função foi deployada.

### Logs e Debug

Para visualizar logs das Edge Functions:

```bash
supabase functions logs processar-ata
```

### Verificação da Configuração

Teste básico da conexão com Supabase:

```javascript
// No console do navegador
import { supabase } from './src/lib/supabase.js'
const { data, error } = await supabase.auth.getSession()
console.log('Sessão:', data, error)
```

## Configurações Avançadas

### Customização do Template de Ata

Para personalizar o formato da ata gerada:

1. **Edite a função `gerarRascunhoSimulado`** em `supabase/functions/processar-ata/index.ts`
2. **Redeploy a função**: `supabase functions deploy processar-ata`

### Configuração de Limites

Ajuste os limites de upload no frontend:

```javascript
// Em Dashboard.jsx, modifique as validações
const MAX_AUDIO_SIZE = 100 * 1024 * 1024 // 100MB
const MAX_PAUTA_SIZE = 10 * 1024 * 1024  // 10MB
```

### Monitoramento

Para monitorar o uso da aplicação:

1. **Configure alertas no Supabase** para uso de storage e função
2. **Implemente analytics** no frontend com Google Analytics ou similar
3. **Configure logs estruturados** nas Edge Functions

## Backup e Recuperação

### Backup do Banco de Dados

```bash
# Via CLI do Supabase
supabase db dump --file backup.sql
```

### Backup dos Arquivos

Configure backup automático dos buckets de storage através do painel do Supabase ou scripts personalizados.

## Atualizações

Para atualizar o sistema:

1. **Pull das mudanças**: `git pull origin main`
2. **Atualizar dependências**: `pnpm install`
3. **Executar migrações**: Se houver novos arquivos em `supabase/migrations/`
4. **Redeploy das funções**: `supabase functions deploy --all`

## Suporte

Para suporte técnico:

- **Issues no GitHub**: Para bugs e solicitações de funcionalidades
- **Documentação**: Consulte o README.md para informações detalhadas
- **Comunidade**: Participe das discussões no repositório oficial
