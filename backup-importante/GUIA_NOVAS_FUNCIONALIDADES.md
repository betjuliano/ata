# 📚 Guia de Novas Funcionalidades - Sistema Ata Audio

## ✨ Funcionalidades Implementadas

### 1. **Gestão de Integrantes** 👥

#### Localização
- **Menu:** Dashboard → Botão "Configurações" → Aba "Integrantes"

#### Como Usar
1. Clique em "Configurações" no cabeçalho
2. Vá para a aba "Integrantes"
3. Preencha os campos:
   - Nome Completo
   - Email
   - Origem/Função (ex: Presidente, Secretário, Membro)
4. Clique em "Adicionar Integrante"

#### Funcionalidades
- ✅ Cadastro manual de integrantes
- ✅ Edição de integrantes existentes
- ✅ Exclusão de integrantes
- ✅ Importação via portaria PDF (aba "Portaria")
- ✅ Integrantes globais (disponíveis em todas as atas)

---

### 2. **Upload de Portaria com OCR** 📄

#### Localização
- **Menu:** Configurações → Aba "Portaria"

#### Como Usar
1. Clique em "Configurações"
2. Vá para a aba "Portaria"
3. Clique na área de upload ou arraste um arquivo PDF
4. O sistema extrairá automaticamente os integrantes do PDF
5. Os integrantes importados aparecerão na aba "Integrantes"

#### Requisitos
- Formato: PDF
- Tamanho máximo: 10MB
- O sistema usa OCR para extrair nomes e emails

---

### 3. **Modo Manual de Criação de Atas** ✍️

#### Localização
- **Menu:** Dashboard → Aba "Manual"

#### Como Usar
1. No Dashboard, selecione a aba "Manual"
2. Preencha os campos obrigatórios:
   - Número da Sessão (ex: 42ª)
   - Tipo da Sessão (Ordinária/Extraordinária)
   - Data da Reunião (DD/MM/AAAA)
   - Horário da Reunião (HH:MM)

3. **Escolha a origem da pauta:**
   - **Arquivo:** Faça upload de PDF/DOCX
   - **Cadastrada:** Selecione uma pauta previamente cadastrada

4. **Selecione os integrantes:**
   - Marque os presentes (checkbox)
   - Para ausentes, deixe desmarcado e preencha justificativa

5. **Redija a ata:**
   - Digite o conteúdo da ata no campo "Rascunho da Ata"
   - Use as informações da pauta como base

6. Clique em "Criar Ata Manual"

#### Diferenças entre Modos
| Modo Áudio | Modo Manual |
|------------|-------------|
| Requer arquivo de áudio | Não requer áudio |
| Processamento automático com IA | Redação manual pelo usuário |
| Status inicial: PENDENTE | Status inicial: CONCLUÍDO |
| Demora alguns minutos | Criação instantânea |

---

### 4. **Data e Horário da Reunião** 🕐

#### Localização
- **Ambos os modos** (Áudio e Manual) no Dashboard

#### Como Usar
- **Data:** Digite no formato DD/MM/AAAA (ex: 12/09/2025)
- **Horário:** Digite no formato HH:MM (ex: 10:00)

#### Observações
- A data da reunião pode ser diferente da data de criação da ata
- Não há validação de conflito de horários
- A data é formatada automaticamente enquanto você digita

---

### 5. **Cadastro de Pautas** 📋

#### Localização
- **Menu:** Dashboard → Botão "Pautas" (no cabeçalho)

#### Como Usar
1. Clique em "Pautas" no cabeçalho
2. Clique em "Nova Pauta"
3. Preencha os campos:
   - **Tema:** Tópico da ata/memorando
   - **Descrição:** Detalhes da pauta
   - **Reunião Prevista:** Mês/Ano (ex: 09/2025)
   - **Status:** Pendente, Discutida ou Aprovada

4. Clique em "Criar Pauta"

#### Status das Pautas
- **PENDENTE:** Pauta ainda não discutida (para revisão)
- **DISCUTIDA:** Pauta já discutida (para revisão)
- **APROVADA:** Pauta aprovada e pronta para uso nas atas

⚠️ **Importante:** Apenas pautas com status "APROVADA" podem ser selecionadas ao criar atas.

#### Filtros Disponíveis
- Busca por tema ou descrição
- Filtro por status (Todas, Pendente, Discutida, Aprovada)

---

### 6. **Convocação de Reunião** 📧

#### Localização
- **Menu:** Pautas → Botão "Convocar Reunião"

#### Como Usar
1. Na tela de Pautas, clique em "Convocar Reunião"
2. Preencha as informações:
   - **Título:** Ex: "Pauta reunião do colegiado Setembro/2025"
   - **Formato:** Presencial, Virtual ou Híbrido
   - **Data:** DD/MM/AAAA
   - **Horário:** HH:MM

3. **Escolha o modo de entrada das pautas:**
   - **Pautas Cadastradas:** Selecione pautas já aprovadas
   - **Digitar Manualmente:** Escreva as pautas livremente

4. Clique em "Gerar Texto de Convocação"

5. O texto será gerado no formato:
```
[Título]
Formato: [presencial/virtual/híbrido]
Data: [data]
Horário: [horário]

PAUTA 1: [tema]
[descrição]

PAUTA 2: [tema]
[descrição]

At.te
[Nome do usuário]
```

6. Clique em "Copiar Texto" para copiar para a área de transferência

#### Histórico
- Todas as convocações são salvas automaticamente no histórico
- Acesse pelo menu de convocações

---

## 🚀 Fluxo de Trabalho Recomendado

### Para criar uma ata completa:

1. **Preparação (uma vez):**
   ```
   Configurações → Integrantes → Cadastrar todos os integrantes
   ```

2. **Antes da reunião:**
   ```
   Pautas → Criar pautas → Definir status como APROVADA
   Pautas → Convocar Reunião → Gerar texto → Enviar por email
   ```

3. **Durante/Após a reunião:**
   
   **Opção A - Modo Áudio:**
   ```
   Dashboard → Aba Áudio →
   Preencher dados → Upload áudio/pauta →
   Selecionar integrantes + presença →
   Criar Ata → Aguardar processamento
   ```
   
   **Opção B - Modo Manual:**
   ```
   Dashboard → Aba Manual →
   Preencher dados → Selecionar pauta cadastrada →
   Marcar presença dos integrantes →
   Redigir ata → Criar Ata Manual
   ```

4. **Finalização:**
   ```
   Ver Ata → Editar/Revisar → Exportar
   ```

---

## 📊 Dados Armazenados

Todas as informações são salvas localmente no navegador (LocalStorage):

- ✅ **Integrantes:** `localIntegrantes`
- ✅ **Pautas:** `localPautas`
- ✅ **Convocações:** `localConvocacoes`
- ✅ **Atas:** `localAtas` (com novos campos)

### Estrutura de Ata Expandida:
```javascript
{
  id, user_id, created_at,
  numero_sessao, tipo_sessao,
  
  // NOVOS CAMPOS
  data_reuniao,           // DD/MM/AAAA
  horario_reuniao,        // HH:MM
  modo_criacao,           // 'AUDIO' ou 'MANUAL'
  
  // Modo Áudio
  audio_path,             // caminho do áudio
  pauta_path,             // caminho da pauta PDF/DOCX
  
  // Modo Manual
  pauta_id,               // ID da pauta cadastrada
  pauta_texto,            // texto da pauta
  
  // Integrantes
  integrantes: [
    {
      integrante_id,
      presente,           // true/false
      justificativa_ausencia
    }
  ],
  
  status,
  rascunho_gerado
}
```

---

## 🎨 Validações Implementadas

### Integrante
- Nome: 3-100 caracteres
- Email: formato válido (RFC 5322)
- Origem/Função: 2-100 caracteres

### Pauta
- Tema: 3-200 caracteres
- Descrição: 5-2000 caracteres
- Reunião Prevista: formato MM/AAAA
- Status: PENDENTE, DISCUTIDA ou APROVADA

### Convocação
- Título: 5-200 caracteres
- Formato: PRESENCIAL, VIRTUAL ou HIBRIDO
- Data: DD/MM/AAAA (não pode ser no passado)
- Horário: HH:MM
- Pautas: 10-5000 caracteres

### Ata
- Número da sessão: obrigatório
- Tipo: Ordinária ou Extraordinária
- Data/Horário: formatos válidos
- Integrantes: mínimo 1 selecionado

---

## 🛠️ Tecnologias Utilizadas

- **Frontend:** React 19 + Vite
- **UI:** shadcn/ui + Tailwind CSS
- **Validação:** Zod
- **Formulários:** React Hook Form
- **Notificações:** Sonner
- **PDF:** pdfjs-dist (OCR)
- **Storage:** LocalStorage

---

## 🔧 Instalação e Execução

### 1. Instalar dependências
```bash
cd frontend
pnpm install
```

### 2. Executar em desenvolvimento
```bash
pnpm run dev --host
```

### 3. Acessar
```
http://localhost:5173
```

### 4. Login padrão
```
Email: admjulianoo@gmail.com
Senha: Adm4125
```

---

## 📝 Notas Importantes

1. **Pautas aprovadas:** Apenas pautas com status "APROVADA" aparecem no modo manual de criação de atas

2. **Integrantes globais:** Integrantes cadastrados ficam disponíveis para todas as atas

3. **Portaria PDF:** O sistema simula OCR por ora. Para implementação real, integre com biblioteca de OCR

4. **Data da reunião:** Pode ser diferente da data de criação da ata

5. **Modo Manual:** Gera ata com status "CONCLUÍDO" imediatamente (sem processamento)

6. **Histórico de convocações:** Todas as convocações geradas são salvas automaticamente

---

## 🎯 Próximas Melhorias Sugeridas

- [ ] Implementar OCR real para portaria PDF
- [ ] Exportar atas em PDF com formatação
- [ ] Templates personalizáveis de convocação
- [ ] Estatísticas de presença dos integrantes
- [ ] Histórico de convocações com busca
- [ ] Migração para Supabase real (banco de dados remoto)

---

## 🆘 Solução de Problemas

### Problema: Integrantes não aparecem
**Solução:** Verifique se cadastrou integrantes em Configurações → Integrantes

### Problema: Pauta não aparece no modo manual
**Solução:** Certifique-se de que o status da pauta é "APROVADA"

### Problema: Não consigo criar ata manual
**Solução:** Verifique se selecionou pelo menos 1 integrante e preencheu todos os campos obrigatórios

### Problema: Erro ao importar portaria
**Solução:** Verifique se o arquivo é PDF e tem menos de 10MB

---

**Desenvolvido com ❤️ seguindo os princípios SOLID, DRY e KISS**

