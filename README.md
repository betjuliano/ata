# Sistema Ata Audio

**Geração Automática de Atas de Reunião por Áudio**

O Sistema Ata Audio é uma aplicação web moderna que automatiza a criação de atas de reunião a partir de arquivos de áudio e documentos de pauta. Utilizando tecnologias de inteligência artificial para transcrição e interpretação semântica, o sistema gera rascunhos de atas no formato institucional da UFSM, permitindo edição e exportação pelos usuários.

## Características Principais

### Funcionalidades Core

**Processamento Inteligente de Áudio**: O sistema aceita arquivos de áudio em formatos MP3, WAV e M4A, processando-os através de APIs de transcrição avançadas para converter fala em texto com alta precisão.

**Análise Semântica de Pautas**: Documentos de pauta em PDF ou DOCX são analisados automaticamente, permitindo que o sistema correlacione os tópicos discutidos na reunião com os itens previamente planejados.

**Geração Automática de Atas**: Utilizando modelos de linguagem avançados, o sistema interpreta a transcrição da reunião em conjunto com a pauta para gerar um rascunho estruturado da ata, seguindo o formato institucional estabelecido.

**Editor Integrado**: Interface de edição rica que permite aos usuários revisar, corrigir e personalizar o conteúdo gerado automaticamente antes da finalização do documento.

### Arquitetura Tecnológica

**Frontend Moderno**: Desenvolvido em React com Vite, utilizando Tailwind CSS para estilização e componentes shadcn/ui para uma interface profissional e responsiva.

**Backend Serverless**: Implementado com Supabase, oferecendo autenticação segura, banco de dados PostgreSQL, armazenamento de arquivos e Edge Functions para processamento assíncrono.

**Integração com IA**: Conecta-se com APIs da OpenAI para transcrição (Whisper) e geração de texto (GPT-4), com sistema de fallback para garantir disponibilidade contínua.

## Estrutura do Projeto

```
sistema-ata-audio/
├── frontend/                 # Aplicação React
│   ├── src/
│   │   ├── components/      # Componentes React
│   │   ├── contexts/        # Contextos de estado
│   │   ├── lib/            # Utilitários e configurações
│   │   └── assets/         # Recursos estáticos
│   ├── public/             # Arquivos públicos
│   └── package.json        # Dependências do frontend
├── supabase/               # Configurações do backend
│   ├── functions/          # Edge Functions
│   └── migrations/         # Scripts de banco de dados
├── docker-compose.yml      # Orquestração de containers
└── README.md              # Documentação
```

## Configuração e Instalação

### Pré-requisitos

Para executar o Sistema Ata Audio, você precisará das seguintes ferramentas instaladas em seu ambiente:

- **Node.js** (versão 18 ou superior)
- **pnpm** (gerenciador de pacotes)
- **Docker** e **Docker Compose** (para containerização)
- **Conta no Supabase** (para backend e banco de dados)
- **Chave da API OpenAI** (para funcionalidades de IA)

### Configuração do Ambiente

**1. Clone o Repositório**
```bash
git clone <url-do-repositorio>
cd sistema-ata-audio
```

**2. Configuração do Frontend**
```bash
cd frontend
cp .env.example .env
# Edite o arquivo .env com suas configurações do Supabase
pnpm install
```

**3. Configuração do Supabase**

Crie um novo projeto no Supabase e configure as seguintes variáveis de ambiente:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
SUPABASE_SERVICE_ROLE_KEY=sua-chave-de-servico
OPENAI_API_KEY=sua-chave-openai
```

**4. Configuração do Banco de Dados**

Execute o script SQL de migração no editor SQL do Supabase:

```bash
# O arquivo está em: supabase/migrations/001_initial_schema.sql
```

**5. Deploy das Edge Functions**

```bash
# Instale a CLI do Supabase
npm install -g supabase

# Faça login e vincule o projeto
supabase login
supabase link --project-ref SEU_ID_PROJETO

# Deploy das funções
supabase functions deploy processar-ata
supabase functions deploy processar-ata-real
```

### Execução em Desenvolvimento

**Modo Desenvolvimento Local**
```bash
cd frontend
pnpm run dev --host
```

A aplicação estará disponível em `http://localhost:5173`

**Modo Docker (Recomendado)**
```bash
docker-compose up -d
```

## Guia de Uso

### Fluxo de Trabalho Típico

**1. Autenticação**: Os usuários fazem login ou criam uma conta através da interface web. O sistema utiliza autenticação segura do Supabase com verificação por e-mail.

**2. Criação de Nova Ata**: Na página principal, o usuário preenche as informações básicas da sessão (número, tipo) e faz upload dos arquivos necessários:
   - **Arquivo de Áudio**: Gravação da reunião (MP3, WAV, M4A)
   - **Documento de Pauta**: Agenda da reunião (PDF, DOCX)

**3. Processamento Automático**: O sistema processa os arquivos em segundo plano:
   - Transcreve o áudio usando IA
   - Extrai o conteúdo da pauta
   - Correlaciona discussões com itens da agenda
   - Gera rascunho da ata no formato institucional

**4. Edição e Revisão**: Quando o processamento é concluído, o usuário pode:
   - Revisar o rascunho gerado
   - Fazer correções e ajustes necessários
   - Salvar alterações incrementalmente

**5. Exportação**: O documento final pode ser exportado em formato de texto ou convertido para outros formatos conforme necessário.

### Funcionalidades Avançadas

**Modo Simulado**: Para desenvolvimento e testes, o sistema oferece um modo simulado que gera atas de exemplo sem consumir créditos de API da OpenAI.

**Sistema de Fallback**: Em caso de falha nas APIs de IA, o sistema automaticamente gera uma versão básica da ata para garantir continuidade do serviço.

**Controle de Acesso**: Cada usuário só pode visualizar e editar suas próprias atas, garantindo privacidade e segurança dos dados.

## Arquitetura de Segurança

### Proteção de Dados

**Row Level Security (RLS)**: Implementado no Supabase para garantir que usuários só acessem seus próprios dados.

**Autenticação JWT**: Tokens seguros para autenticação de sessões com renovação automática.

**Armazenamento Seguro**: Arquivos são armazenados no Supabase Storage com políticas de acesso restritivas.

### Políticas de Privacidade

**Processamento Local**: Quando possível, o processamento é feito em Edge Functions para minimizar transferência de dados sensíveis.

**Retenção de Dados**: Arquivos temporários são automaticamente removidos após o processamento.

**Criptografia**: Todas as comunicações utilizam HTTPS e os dados em repouso são criptografados.

## Deployment e Produção

### Opções de Implantação

**1. Supabase + Vercel (Recomendado)**
- Frontend hospedado na Vercel
- Backend e banco de dados no Supabase
- Edge Functions para processamento

**2. Docker + VPS**
- Containerização completa com Docker Compose
- Adequado para ambientes corporativos
- Controle total sobre infraestrutura

**3. Kubernetes**
- Para ambientes de alta disponibilidade
- Escalabilidade automática
- Monitoramento avançado

### Configuração de Produção

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  frontend:
    build:
      context: ./frontend
      target: production
    ports:
      - "80:80"
      - "443:443"
    environment:
      - NODE_ENV=production
```

## Monitoramento e Manutenção

### Métricas Importantes

**Performance**: Tempo de processamento de áudio, taxa de sucesso da transcrição, latência da interface.

**Uso de Recursos**: Consumo de créditos da OpenAI, utilização de storage, número de usuários ativos.

**Qualidade**: Precisão da transcrição, satisfação dos usuários com atas geradas, taxa de edições necessárias.

### Logs e Debugging

O sistema gera logs detalhados em todas as etapas do processamento, facilitando a identificação e resolução de problemas:

```javascript
// Exemplo de log estruturado
console.log('Processando ata ID:', ataId, {
  usuario: userId,
  tamanho_audio: audioSize,
  status: 'PROCESSANDO'
})
```

## Roadmap e Funcionalidades Futuras

### Próximas Versões

**Identificação de Oradores**: Reconhecimento automático de quem está falando em cada trecho da reunião.

**Integração com Assinatura Digital**: Conexão com plataformas de assinatura eletrônica para formalização automática dos documentos.

**Dashboard Analytics**: Painel com métricas sobre tempo de reunião, participação e tópicos mais discutidos.

**API Pública**: Interface programática para integração com outros sistemas institucionais.

### Melhorias Planejadas

**Suporte a Múltiplos Idiomas**: Expansão para transcrição e geração de atas em outros idiomas além do português.

**Templates Personalizáveis**: Permitir que instituições configurem seus próprios modelos de ata.

**Processamento em Tempo Real**: Transcrição e análise durante reuniões ao vivo via streaming.

## Suporte e Contribuição

### Documentação Técnica

Para desenvolvedores interessados em contribuir ou personalizar o sistema, documentação detalhada da API e arquitetura está disponível no diretório `/docs`.

### Comunidade

O projeto é open source e aceita contribuições da comunidade acadêmica e de desenvolvimento. Issues e pull requests são bem-vindos no repositório oficial.

### Licença

Este projeto é distribuído sob licença MIT, permitindo uso, modificação e distribuição livre para fins acadêmicos e comerciais.

---

**Desenvolvido por**: Manus AI  
**Versão**: 1.0.0  
**Data**: Outubro 2025
