# Backend - Sistema Ata Audio

Backend Node.js com Express + Prisma ORM que suporta MySQL e PostgreSQL.

## 🗄️ Bancos de Dados Suportados

- **PostgreSQL** (Recomendado)
- **MySQL**

## 🚀 Instalação

### 1. Instalar dependências
```bash
cd backend
npm install
```

### 2. Configurar Banco de Dados

Copie o arquivo `.env.example` para `.env`:
```bash
cp .env.example .env
```

Edite o arquivo `.env` e configure a URL do banco:

#### Para PostgreSQL:
```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/sistema_ata_audio"
```

#### Para MySQL:
```env
DATABASE_URL="mysql://usuario:senha@localhost:3306/sistema_ata_audio"
```

### 3. Atualizar schema.prisma (se usar MySQL)

Se você escolheu MySQL, edite `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "mysql"  // ← Mude de "postgresql" para "mysql"
  url      = env("DATABASE_URL")
}
```

### 4. Criar banco de dados

#### PostgreSQL:
```bash
# Conectar no PostgreSQL
psql -U postgres

# Criar banco
CREATE DATABASE sistema_ata_audio;

# Sair
\q
```

#### MySQL:
```bash
# Conectar no MySQL
mysql -u root -p

# Criar banco
CREATE DATABASE sistema_ata_audio;

# Sair
exit
```

### 5. Rodar migrações
```bash
npm run prisma:generate
npm run prisma:migrate
```

### 6. Iniciar servidor
```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

## 📡 API Endpoints

### Autenticação
- `POST /api/auth/signup` - Registrar
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Usuário atual

### Atas
- `GET /api/atas` - Listar atas
- `GET /api/atas/:id` - Buscar ata
- `POST /api/atas` - Criar ata
- `PUT /api/atas/:id` - Atualizar ata
- `DELETE /api/atas/:id` - Deletar ata

### Integrantes
- `GET /api/integrantes` - Listar
- `POST /api/integrantes` - Criar
- `PUT /api/integrantes/:id` - Atualizar
- `DELETE /api/integrantes/:id` - Deletar

### Pautas
- `GET /api/pautas` - Listar
- `POST /api/pautas` - Criar
- `PUT /api/pautas/:id` - Atualizar
- `DELETE /api/pautas/:id` - Deletar

### Convocações
- `GET /api/convocacoes` - Listar
- `POST /api/convocacoes` - Criar

### Upload
- `POST /api/upload` - Upload de arquivo

## 🔧 Comandos Prisma Úteis

```bash
# Gerar cliente Prisma
npm run prisma:generate

# Criar migração
npm run prisma:migrate

# Abrir Prisma Studio (interface gráfica)
npm run prisma:studio

# Reset do banco
npx prisma migrate reset

# Seed inicial (se necessário)
npx prisma db seed
```

## 🐳 Docker (Opcional)

### PostgreSQL:
```bash
docker run --name postgres-ata \
  -e POSTGRES_PASSWORD=senha123 \
  -e POSTGRES_DB=sistema_ata_audio \
  -p 5432:5432 \
  -d postgres:15
```

### MySQL:
```bash
docker run --name mysql-ata \
  -e MYSQL_ROOT_PASSWORD=senha123 \
  -e MYSQL_DATABASE=sistema_ata_audio \
  -p 3306:3306 \
  -d mysql:8
```

## 📊 Variáveis de Ambiente

```env
DATABASE_URL=           # URL de conexão do banco
JWT_SECRET=             # Chave secreta JWT
PORT=3001               # Porta do servidor
CORS_ORIGIN=            # Origem permitida CORS
```

## 🔐 Segurança

- Senhas são hasheadas com bcrypt
- Autenticação via JWT
- CORS configurado
- Validação de permissões por usuário

## 📝 Estrutura do Banco

- **users** - Usuários do sistema
- **atas** - Atas de reunião
- **integrantes** - Participantes
- **pautas** - Pautas de reunião
- **convocacoes** - Histórico de convocações

## 🐛 Troubleshooting

### Erro de conexão:
- Verificar se banco está rodando
- Verificar credenciais no `.env`
- Verificar se porta está correta

### Erro de migração:
```bash
npx prisma migrate reset
npm run prisma:migrate
```

### Limpar tudo e recomeçar:
```bash
rm -rf node_modules prisma/migrations
npm install
npm run prisma:generate
npm run prisma:migrate
```


