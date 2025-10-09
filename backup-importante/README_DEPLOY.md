# 🚀 Guia Rápido de Deploy - Sistema Ata Audio

## 📋 Escolha Seu Método

### **🎯 RECOMENDAÇÃO:**
1. **Primeiro Deploy:** Use Método A (simples)
2. **Produção:** Use Método B (profissional)

---

## **MÉTODO A: Build na VPS** ⚡ (Simples)

### **1 único comando:**
```powershell
.\deploy.ps1
```

**✅ Vantagens:**
- Mais simples
- Não precisa Docker Hub
- Ideal para testar

**⚠️ Desvantagens:**
- Build demora 8-10 min
- VPS fica lenta durante build
- Sem versionamento

📖 **Documentação completa:** `DEPLOY_VPS.md`

---

## **MÉTODO B: Docker Registry** 🏆 (Profissional)

### **Configuração inicial (1x):**
```powershell
# 1. Criar conta grátis
Start-Process "https://hub.docker.com/signup"

# 2. Login
docker login

# 3. Editar scripts
# build-and-push.ps1: linha 3
# deploy-from-registry.ps1: linha 7
# Trocar "seu-usuario" pelo seu username
```

### **Deploy (sempre):**
```powershell
# 1. Build e push
.\build-and-push.ps1

# 2. Deploy na VPS
.\deploy-from-registry.ps1
```

**✅ Vantagens:**
- Build rápido (1-2 min na VPS)
- Versionamento automático
- Rollback fácil
- VPS não sofre

**⚠️ Desvantagens:**
- Precisa conta Docker Hub
- 2 comandos em vez de 1

📖 **Documentação completa:** `DEPLOY_DOCKER_REGISTRY.md`

---

## 🔄 Comparação Rápida

| | Método A | Método B |
|---|---|---|
| **Comandos** | 1 | 2 |
| **Tempo total** | 10-12 min | 5-8 min |
| **VPS sofre?** | ✅ Sim | ❌ Não |
| **Versionamento** | ❌ | ✅ |
| **Rollback** | ❌ Difícil | ✅ 30s |
| **Produção** | ⚠️ OK | ✅ Ideal |

📖 **Comparação detalhada:** `COMPARACAO_DEPLOY.md`

---

## 🎯 Qual Usar?

### **Use Método A se:**
- ✅ Primeiro deploy / teste
- ✅ VPS com 2GB+ RAM
- ✅ Projeto pessoal
- ✅ Quer simplicidade

### **Use Método B se:**
- ✅ Produção
- ✅ VPS com <2GB RAM
- ✅ Deploys frequentes
- ✅ Precisa versionamento

---

## 🚀 Deploy em 3 Passos

### **OPÇÃO 1: Simples (Recomendado para começar)**
```powershell
# Passo único
.\deploy.ps1
```

### **OPÇÃO 2: Profissional (Recomendado para produção)**
```powershell
# Passo 1: Setup inicial (1x)
docker login

# Passo 2: Build
.\build-and-push.ps1 v1.0.0

# Passo 3: Deploy
.\deploy-from-registry.ps1 v1.0.0
```

---

## 📝 Scripts Disponíveis

### **Build na VPS:**
- `deploy.sh` - Linux/Mac
- `deploy.ps1` - Windows ✅

### **Docker Registry:**
- `build-and-push.sh` - Linux/Mac
- `build-and-push.ps1` - Windows ✅
- `deploy-from-registry.sh` - Linux/Mac
- `deploy-from-registry.ps1` - Windows ✅

---

## 🆘 Troubleshooting Rápido

### **VPS sem RAM durante build:**
```powershell
# Migrar urgente para Registry
.\build-and-push.ps1
.\deploy-from-registry.ps1
```

### **Erro de login Docker:**
```powershell
docker logout
docker login
```

### **Imagem não encontrada:**
```powershell
# Verificar se fez push
docker images | Select-String "sistema-ata-audio"
```

### **VPS sem espaço:**
```bash
ssh root@72.60.5.74
docker system prune -a -f
```

---

## 📚 Documentação Completa

1. **`DEPLOY_VPS.md`** - Método A (Build na VPS)
2. **`DEPLOY_DOCKER_REGISTRY.md`** - Método B (Registry)
3. **`COMPARACAO_DEPLOY.md`** - Comparação detalhada
4. **`README_DEPLOY.md`** - Este arquivo (resumo)

---

## ✅ Checklist de Deploy

### **Antes do primeiro deploy:**
- [ ] VPS acessível via SSH
- [ ] Docker instalado na VPS
- [ ] Docker Compose instalado na VPS
- [ ] Portas 80/443 liberadas no firewall

### **Método A - Build na VPS:**
- [ ] SSH configurado
- [ ] Executar `.\deploy.ps1`
- [ ] Aguardar 10-12 min
- [ ] Acessar http://72.60.5.74

### **Método B - Docker Registry:**
- [ ] Conta Docker Hub criada
- [ ] `docker login` executado
- [ ] Scripts editados com username
- [ ] Executar `.\build-and-push.ps1`
- [ ] Executar `.\deploy-from-registry.ps1`
- [ ] Acessar http://72.60.5.74

---

## 🎉 Depois do Deploy

Verificar se está funcionando:

```powershell
# Ver logs
ssh root@72.60.5.74 "cd /opt/sistema-ata-audio && docker-compose logs -f"

# Ver status
ssh root@72.60.5.74 "cd /opt/sistema-ata-audio && docker-compose ps"

# Acessar
Start-Process "http://72.60.5.74"
```

---

## 📞 Comandos Úteis

### **Reiniciar aplicação:**
```bash
ssh root@72.60.5.74 "cd /opt/sistema-ata-audio && docker-compose restart"
```

### **Parar aplicação:**
```bash
ssh root@72.60.5.74 "cd /opt/sistema-ata-audio && docker-compose down"
```

### **Ver logs em tempo real:**
```bash
ssh root@72.60.5.74 "cd /opt/sistema-ata-audio && docker-compose logs -f"
```

### **Atualizar código:**
```powershell
# Método A
.\deploy.ps1

# Método B
.\build-and-push.ps1 v1.1.0
.\deploy-from-registry.ps1 v1.1.0
```

---

## 🔐 Informações da VPS

```
Host: 72.60.5.74
User: root
Diretório: /opt/sistema-ata-audio
Porta HTTP: 80
Porta HTTPS: 443 (futuro)
```

---

## 🎯 Resumo Executivo

**Pressa? Faça isso:**
```powershell
.\deploy.ps1
```

**Quer fazer direito? Faça isso:**
```powershell
docker login
.\build-and-push.ps1
.\deploy-from-registry.ps1
```

**Deu erro? Leia isso:**
- `DEPLOY_VPS.md` (seção Troubleshooting)
- `DEPLOY_DOCKER_REGISTRY.md` (seção Troubleshooting)

---

## 💪 Próximos Passos

Após o deploy funcionar:

1. **Configurar HTTPS:**
   - Certificado SSL com Let's Encrypt
   - Redirecionar HTTP → HTTPS

2. **Monitoramento:**
   - Logs centralizados
   - Alertas de erro

3. **Backup:**
   - Backup automático do localStorage
   - Snapshot da VPS

4. **CI/CD:**
   - GitHub Actions
   - Deploy automático

---

**🚀 Escolha um método e mãos à obra!**

Qualquer dúvida, consulte a documentação detalhada de cada método.


