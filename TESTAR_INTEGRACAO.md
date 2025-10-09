# 🧪 Guia de Testes - Integração Frontend + Backend

## ✅ STATUS ATUAL

```
✅ Backend rodando: http://localhost:3001
✅ Frontend rodando: http://localhost:3000  
✅ Banco PostgreSQL: 72.60.5.74:5432 (conectado)
✅ API Client criado e configurado
✅ Frontend conectado à API
```

---

## 🚀 PASSO A PASSO PARA TESTAR

### **1. Verificar se os servidores estão rodando:**

#### **Backend:**
```bash
curl http://localhost:3001/api/health
```
**Resposta esperada:**
```json
{"status":"OK","database":"Connected"}
```

#### **Frontend:**
```bash
curl http://localhost:3000
```
**Deve retornar HTML da aplicação**

---

### **2. Acessar o Sistema:**

Abra o navegador em:
```
http://localhost:3000
```

Você verá a **tela de login**

---

### **3. Criar Conta (Primeira vez):**

1. **Clique em "Criar conta"**
2. **Preencha os dados:**
   - Email: `admin@email.com`
   - Senha: `Admin123`
   - Nome Completo: `Administrador`
   - Cargo: `Coordenador`
   - Colegiado: `Administração`
3. **Clique em "Registrar"**

**✅ O que vai acontecer:**
- Frontend chama `apiClient.signup()`
- Backend cria usuário no PostgreSQL
- JWT token é gerado
- Token é salvo no localStorage
- Você é redirecionado para o Dashboard

---

### **4. Fazer Login (Visitas seguintes):**

1. **Email:** `admin@email.com`
2. **Senha:** `Admin123`
3. **Clique em "Entrar"**

**✅ O que vai acontecer:**
- Frontend chama `apiClient.login()`
- Backend valida credenciais
- JWT token é retornado
- Você é redirecionado para o Dashboard

---

### **5. Testar Cadastro de Integrantes:**

1. **No Dashboard, clique em "Configurações"**
2. **Vá para a aba "Integrantes"**
3. **Clique em "Novo Integrante"**
4. **Preencha:**
   - Nome: `João Silva`
   - Email: `joao@email.com`
   - Origem/Função: `Coordenador`
5. **Clique em "Salvar"**

**✅ Verificar no banco:**
```bash
# Terminal
curl http://localhost:3001/api/integrantes \
  -H "Authorization: Bearer SEU_TOKEN"
```

---

### **6. Testar Cadastro de Pautas:**

1. **No menu, clique em "Pautas"**
2. **Clique em "Nova Pauta"**
3. **Preencha:**
   - Tema: `Aprovação de Ata 44/2025`
   - Descrição: `Discutir e aprovar a ata da reunião anterior`
   - Reunião Prevista: `10/2025`
   - Status: `APROVADA`
4. **Clique em "Salvar"**

**✅ Verificar:**
- Pauta deve aparecer na lista
- Dados salvos no PostgreSQL

---

### **7. Testar Criação de Ata - Modo Manual:**

1. **No Dashboard, vá para a aba "Manual"**
2. **Preencha os dados básicos:**
   - Número da Sessão: `001/2025`
   - Tipo: `Ordinária`
   - Data: `12/10/2025`
   - Horário: `10:00`
3. **Selecione a pauta criada anteriormente**
4. **Selecione os integrantes presentes**
5. **Clique em "Iniciar Redação"**
6. **Assistente irá abrir:**
   - Preencha os campos de cada pauta
   - Avance pelos passos
   - Preencha "Assuntos Gerais"
7. **Finalize a ata**

**✅ Verificar:**
- Ata criada e listada
- Status: CONCLUIDO
- Salva no PostgreSQL

---

### **8. Testar Edição de Ata:**

1. **Na lista de atas, clique em "Editar"**
2. **Você será redirecionado para o Editor Estruturado**
3. **Edite as seções:**
   - Cabeçalho
   - Pautas
   - Assuntos Gerais
   - Encerramento
4. **Clique em "Salvar"**

**✅ Verificar:**
- Alterações salvas
- Toast de sucesso

---

### **9. Testar Exportação:**

No editor de ata, teste os 3 formatos:

1. **Exportar TXT** → Deve baixar arquivo `.txt`
2. **Exportar PDF** → Deve baixar arquivo `.pdf` com logo
3. **Exportar DOCX** → Deve baixar arquivo `.docx` com logo

**✅ Verificar:**
- Arquivos baixados corretamente
- Logo aparece no topo (centralizada)
- Formatação correta

---

### **10. Testar Logout:**

1. **Clique no botão de Logout (canto superior)**
2. **Você deve voltar para tela de login**
3. **Tente acessar `/dashboard` diretamente**
4. **Deve redirecionar para login**

**✅ Verificar:**
- Token removido do localStorage
- Rotas protegidas não acessíveis

---

## 🔍 VERIFICAR DADOS NO BANCO

### **Via Prisma Studio (Interface Gráfica):**
```bash
cd backend
npx prisma studio
```

Abre em: `http://localhost:5555`

**Verifique as tabelas:**
- `ata_audio.users` → Deve ter seu usuário
- `ata_audio.integrantes` → Integrantes cadastrados
- `ata_audio.pautas` → Pautas cadastradas
- `ata_audio.atas` → Atas criadas

---

### **Via SQL (psql):**
```bash
psql postgresql://postgres:fb9ffba836d8aa033520200ce1ea5409@72.60.5.74:5432/postgres

# Ver usuários
SELECT * FROM ata_audio.users;

# Ver atas
SELECT id, numero_sessao, tipo_sessao, status, created_at 
FROM ata_audio.atas;

# Ver integrantes
SELECT * FROM ata_audio.integrantes;

# Ver pautas
SELECT * FROM ata_audio.pautas;

# Sair
\q
```

---

## 🔧 DEBUG - Console do Navegador

Abra o **DevTools** (F12) e vá para o **Console**.

### **Verificar Token:**
```javascript
localStorage.getItem('authToken')
```

Deve retornar um JWT longo.

### **Testar API diretamente:**
```javascript
// Importar cliente
import { apiClient } from './lib/apiClient'

// Listar atas
const atas = await apiClient.atas.list()
console.log(atas)

// Buscar usuário atual
const user = await apiClient.me()
console.log(user)
```

---

## 📊 MONITORAR REQUISIÇÕES

### **No DevTools → Network:**

1. **Abra a aba Network**
2. **Faça uma ação no sistema (criar ata, etc)**
3. **Veja as requisições:**
   ```
   POST http://localhost:3001/api/atas
   Headers:
     Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
     Content-Type: application/json
   Body:
     {
       "numeroSessao": "001/2025",
       "tipoSessao": "Ordinária",
       ...
     }
   Response: 200 OK
   ```

---

## 🐛 TROUBLESHOOTING

### **Problema: "Unauthorized"**

**Solução:**
```javascript
// Limpar token
localStorage.removeItem('authToken')
// Fazer login novamente
```

### **Problema: "Failed to fetch"**

**Solução:**
```bash
# 1. Verificar se backend está rodando
curl http://localhost:3001/api/health

# 2. Se não estiver, iniciar:
cd backend
node server.js
```

### **Problema: "CORS Error"**

**Solução:**
```bash
# Verificar CORS_ORIGIN no backend/.env
CORS_ORIGIN=http://localhost:3000

# Reiniciar backend
cd backend
node server.js
```

### **Problema: Console cheio de erros**

**Solução:**
```bash
# Limpar cache do navegador
Ctrl + Shift + Delete
# Marcar "Cache" e "Cookies"
# Recarregar página
```

---

## 🎯 CHECKLIST DE TESTES

### **Autenticação:**
- [ ] Criar conta funciona
- [ ] Login funciona
- [ ] Token é salvo
- [ ] Logout funciona
- [ ] Rotas protegidas funcionam

### **CRUD Integrantes:**
- [ ] Listar integrantes
- [ ] Criar integrante
- [ ] Editar integrante
- [ ] Deletar integrante

### **CRUD Pautas:**
- [ ] Listar pautas
- [ ] Criar pauta
- [ ] Editar pauta (botão com ícone Edit)
- [ ] Deletar pauta (botão com ícone Trash)
- [ ] Filtrar por status

### **CRUD Atas:**
- [ ] Listar atas
- [ ] Criar ata (modo manual)
- [ ] Editar ata (editor estruturado)
- [ ] Deletar ata
- [ ] Visualizar ata

### **Exportação:**
- [ ] Exportar TXT
- [ ] Exportar PDF (com logo)
- [ ] Exportar DOCX (com logo)

### **Dados Persistentes:**
- [ ] Dados salvos no banco
- [ ] Dados não se perdem ao recarregar
- [ ] Dados visíveis no Prisma Studio

---

## 🎉 SE TUDO FUNCIONAR:

### **✅ Você tem:**
- Frontend React funcionando
- Backend Node.js + Express rodando
- Banco PostgreSQL na VPS conectado
- Autenticação JWT
- CRUD completo
- Exportação de documentos
- Sistema multi-usuário
- Dados persistentes

### **🚀 Próximo passo:**
- **Deploy em produção na VPS**
- **Configurar domínio e HTTPS**
- **Backup automatizado**

---

## 📞 COMANDOS RÁPIDOS

```bash
# Ver saúde da API
curl http://localhost:3001/api/health

# Ver banco graficamente
cd backend && npx prisma studio

# Reiniciar backend
cd backend && node server.js

# Reiniciar frontend
cd frontend && pnpm run dev

# Ver logs do backend
cd backend && node server.js
# (logs aparecem no terminal)

# Limpar tudo e começar de novo
localStorage.clear()
# Recarregar página
# Fazer novo registro
```

---

## 📊 VALIDAÇÃO FINAL

Execute estes comandos para garantir que tudo está OK:

```bash
# 1. Backend funcionando
curl http://localhost:3001/api/health

# 2. Frontend servindo
curl http://localhost:3000

# 3. Banco conectado
cd backend && npx prisma db pull

# 4. Ver dados
cd backend && npx prisma studio
```

**Se todos responderem corretamente: ✅ SISTEMA 100% FUNCIONAL!**

---

## 🎊 PARABÉNS!

Você agora tem um **sistema completo de gestão de atas** com:

```
✅ Frontend moderno (React + Vite)
✅ Backend robusto (Node.js + Express)
✅ Banco de dados real (PostgreSQL na VPS)
✅ Autenticação segura (JWT + bcrypt)
✅ API REST profissional
✅ Multi-usuário
✅ Exportação de documentos
✅ Upload de arquivos
✅ Interface responsiva
✅ Pronto para produção
```

**🚀 PRÓXIMO NÍVEL: DEPLOY EM PRODUÇÃO!**


