# ⚡ Deploy Rápido - Guia de 5 Minutos

## 🎯 Deploy para: `root@72.60.5.74:~/ata/`

---

## 🚀 OPÇÃO 1: DEPLOY AUTOMÁTICO (Recomendado)

### **Windows:**
```powershell
.\deploy-vps.ps1
```

### **Linux/Mac:**
```bash
chmod +x deploy-vps.sh
./deploy-vps.sh
```

**O script faz tudo automaticamente!**

---

## 📝 OPÇÃO 2: DEPLOY MANUAL (Passo a Passo)

### **1. Conectar na VPS:**
```bash
ssh root@72.60.5.74
```

### **2. Criar diretório:**
```bash
mkdir -p ~/ata
cd ~/ata
```

### **3. Enviar arquivos (do seu PC):**
```bash
# Backend
scp -r backend/* root@72.60.5.74:~/ata/

# Frontend
scp -r frontend root@72.60.5.74:~/ata/

# Configurações
scp docker-compose.yml ecosystem.config.js root@72.60.5.74:~/ata/
```

### **4. Configurar .env na VPS:**
```bash
ssh root@72.60.5.74
cd ~/ata

cat > .env << 'EOF'
DATABASE_URL="postgresql://postgres:fb9ffba836d8aa033520200ce1ea5409@72.60.5.74:5432/postgres"
JWT_SECRET="change_this_in_production_2025"
PORT=3001
CORS_ORIGIN="http://72.60.5.74:3000"
NODE_ENV=production
EOF
```

### **5. Instalar dependências:**
```bash
npm install --production
npx prisma generate
npx prisma db push
```

### **6. Iniciar servidor:**

**Opção A - Direto (simples):**
```bash
nohup node server.js > server.log 2>&1 &
```

**Opção B - Com PM2 (recomendado):**
```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## ✅ VERIFICAR SE ESTÁ FUNCIONANDO

```bash
curl http://72.60.5.74:3001/api/health
```

**Resposta esperada:**
```json
{"status":"OK","database":"Connected"}
```

---

## 🔧 COMANDOS ÚTEIS

### **Ver logs:**
```bash
# Direto
ssh root@72.60.5.74 'tail -f ~/ata/server.log'

# PM2
ssh root@72.60.5.74 'pm2 logs'
```

### **Reiniciar:**
```bash
# Direto
ssh root@72.60.5.74 'pkill -f node && cd ~/ata && nohup node server.js > server.log 2>&1 &'

# PM2
ssh root@72.60.5.74 'pm2 restart all'
```

### **Status:**
```bash
# Direto
ssh root@72.60.5.74 'ps aux | grep node'

# PM2
ssh root@72.60.5.74 'pm2 list'
```

### **Parar:**
```bash
# Direto
ssh root@72.60.5.74 'pkill -f node'

# PM2
ssh root@72.60.5.74 'pm2 stop all'
```

---

## 🐛 PROBLEMAS COMUNS

### **"Connection refused":**
```bash
# Verificar se servidor está rodando
ssh root@72.60.5.74 'ps aux | grep node'

# Se não estiver, iniciar
ssh root@72.60.5.74 'cd ~/ata && node server.js'
```

### **"Module not found":**
```bash
# Reinstalar dependências
ssh root@72.60.5.74 'cd ~/ata && npm install'
```

### **"Database connection error":**
```bash
# Testar conexão com banco
ssh root@72.60.5.74 'psql postgresql://postgres:fb9ffba836d8aa033520200ce1ea5409@localhost:5432/postgres -c "SELECT 1"'
```

---

## 🔄 ATUALIZAR CÓDIGO

```bash
# Rodar deploy novamente
.\deploy-vps.ps1

# Ou manualmente
scp -r backend/* root@72.60.5.74:~/ata/
ssh root@72.60.5.74 'cd ~/ata && pm2 restart all'
```

---

## 🎉 PRONTO!

Seu backend está rodando em:
```
http://72.60.5.74:3001/api/health
```

---

## 📚 DOCUMENTAÇÃO COMPLETA

Para configurações avançadas, consulte:
- `DEPLOY_VPS_COMPLETO.md` - Deploy detalhado
- `BACKEND_CONFIGURADO.md` - Configuração do backend
- `FRONTEND_CONECTADO.md` - Integração frontend/backend

---

## 📞 SUPORTE

Se tiver problemas:
1. Ver logs: `ssh root@72.60.5.74 'tail -f ~/ata/server.log'`
2. Testar conexão: `curl http://72.60.5.74:3001/api/health`
3. Verificar processo: `ssh root@72.60.5.74 'ps aux | grep node'`


