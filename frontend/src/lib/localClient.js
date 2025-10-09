// Sistema Local Simplificado - Substitui completamente o Supabase
class LocalClient {
  constructor() {
    this.currentUser = null
    this.initLocalStorage()
    this.loadCurrentUser()
  }

  // Inicializar dados locais
  initLocalStorage() {
    if (!localStorage.getItem('localUsers')) {
      const defaultUsers = [
        {
          id: 1,
          email: 'admjulianoo@gmail.com',
          senha: 'Adm4125',
          nome_completo: 'Administrador',
          cargo: 'Administrador do Sistema',
          colegiado: 'Administração',
          created_at: new Date().toISOString()
        }
      ]
      localStorage.setItem('localUsers', JSON.stringify(defaultUsers))
    }

    // Inicializar integrantes
    if (!localStorage.getItem('localIntegrantes')) {
      localStorage.setItem('localIntegrantes', JSON.stringify([]))
    }

    // Inicializar pautas
    if (!localStorage.getItem('localPautas')) {
      localStorage.setItem('localPautas', JSON.stringify([]))
    }

    // Inicializar convocações
    if (!localStorage.getItem('localConvocacoes')) {
      localStorage.setItem('localConvocacoes', JSON.stringify([]))
    }

    if (!localStorage.getItem('localAtas')) {
      const defaultAtas = [
        {
          id: 1,
          user_id: 1,
          numero_sessao: '001/2025',
          tipo_sessao: 'Ordinária',
          status: 'CONCLUIDO',
          created_at: new Date().toISOString(),
          rascunho_gerado: `# ATA DA 1ª SESSÃO ORDINÁRIA

## DADOS DA SESSÃO
- **Data**: ${new Date().toLocaleDateString('pt-BR')}
- **Horário**: 14:00h
- **Local**: Sala de Reuniões

## PARTICIPANTES
- Presidente: Administrador
- Secretário: Sistema Local
- Membros presentes: 5 de 5

## PAUTA
1. **Abertura da sessão**
2. **Aprovação da ata anterior** 
3. **Assuntos gerais**

## DELIBERAÇÕES
- **Deliberação 001**: Aprovado sistema de atas automáticas

## ENCERRAMENTO
Sessão encerrada às 16:00h.

---
*Ata gerada pelo Sistema Ata Audio Local*`
        }
      ]
      localStorage.setItem('localAtas', JSON.stringify(defaultAtas))
    }
  }

  // Carregar usuário atual se existir
  loadCurrentUser() {
    const savedUser = localStorage.getItem('currentUser')
    if (savedUser) {
      this.currentUser = JSON.parse(savedUser)
    }
  }

  // Métodos auxiliares
  getUsers() {
    return JSON.parse(localStorage.getItem('localUsers') || '[]')
  }

  saveUsers(users) {
    localStorage.setItem('localUsers', JSON.stringify(users))
  }

  getAtas() {
    return JSON.parse(localStorage.getItem('localAtas') || '[]')
  }

  saveAtas(atas) {
    localStorage.setItem('localAtas', JSON.stringify(atas))
  }

  // Métodos para Integrantes
  getIntegrantes() {
    return JSON.parse(localStorage.getItem('localIntegrantes') || '[]')
  }

  saveIntegrantes(integrantes) {
    localStorage.setItem('localIntegrantes', JSON.stringify(integrantes))
  }

  // Métodos para Pautas
  getPautas() {
    return JSON.parse(localStorage.getItem('localPautas') || '[]')
  }

  savePautas(pautas) {
    localStorage.setItem('localPautas', JSON.stringify(pautas))
  }

  // Métodos para Convocações
  getConvocacoes() {
    return JSON.parse(localStorage.getItem('localConvocacoes') || '[]')
  }

  saveConvocacoes(convocacoes) {
    localStorage.setItem('localConvocacoes', JSON.stringify(convocacoes))
  }

  // API de autenticação compatível com Supabase
  auth = {
    getSession: async () => {
      return { data: { session: this.currentUser ? { user: this.currentUser } : null } }
    },

    getUser: async () => {
      return { data: { user: this.currentUser } }
    },

    signInWithPassword: async ({ email, password }) => {
      console.log('Tentando login com:', email)
      const users = this.getUsers()
      const user = users.find(u => u.email === email && u.senha === password)
      
      if (user) {
        this.currentUser = { 
          id: user.id, 
          email: user.email, 
          nome_completo: user.nome_completo,
          cargo: user.cargo,
          colegiado: user.colegiado
        }
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser))
        console.log('Login bem-sucedido:', this.currentUser)
        return { data: { user: this.currentUser }, error: null }
      }
      
      console.log('Login falhou - credenciais inválidas')
      return { data: null, error: { message: 'Credenciais inválidas' } }
    },

    signUp: async ({ email, password, options = {} }) => {
      console.log('Tentando cadastro com:', email)
      const users = this.getUsers()
      
      // Verificar se email já existe
      if (users.find(u => u.email === email)) {
        return { data: null, error: { message: 'Email já cadastrado' } }
      }

      const userData = options.data || {}
      const newUser = {
        id: Math.max(...users.map(u => u.id), 0) + 1,
        email,
        senha: password,
        nome_completo: userData.nome_completo || email.split('@')[0],
        cargo: userData.cargo || 'Usuário',
        colegiado: userData.colegiado || 'Geral',
        created_at: new Date().toISOString()
      }

      users.push(newUser)
      this.saveUsers(users)

      this.currentUser = {
        id: newUser.id,
        email: newUser.email,
        nome_completo: newUser.nome_completo,
        cargo: newUser.cargo,
        colegiado: newUser.colegiado
      }
      localStorage.setItem('currentUser', JSON.stringify(this.currentUser))
      
      console.log('Cadastro bem-sucedido:', this.currentUser)
      return { data: { user: this.currentUser }, error: null }
    },

    signOut: async () => {
      this.currentUser = null
      localStorage.removeItem('currentUser')
      console.log('Logout realizado')
      return { error: null }
    },

    onAuthStateChange: (callback) => {
      // Chamar callback imediatamente com estado atual
      if (this.currentUser) {
        setTimeout(() => callback('SIGNED_IN', { user: this.currentUser }), 0)
      } else {
        setTimeout(() => callback('SIGNED_OUT', null), 0)
      }

      // Retornar subscription mock
      return {
        data: {
          subscription: {
            unsubscribe: () => console.log('Auth listener removido')
          }
        }
      }
    }
  }

  // Operações de banco simplificadas
  from(table) {
    const handlers = {
      atas: {
        getData: () => this.getAtas(),
        saveData: (data) => this.saveAtas(data),
        filterUser: (items) => items.filter(item => item.user_id === this.currentUser?.id)
      },
      integrantes: {
        getData: () => this.getIntegrantes(),
        saveData: (data) => this.saveIntegrantes(data),
        filterUser: (items) => items.filter(item => item.user_id === this.currentUser?.id)
      },
      pautas: {
        getData: () => this.getPautas(),
        saveData: (data) => this.savePautas(data),
        filterUser: (items) => items.filter(item => item.user_id === this.currentUser?.id)
      },
      convocacoes: {
        getData: () => this.getConvocacoes(),
        saveData: (data) => this.saveConvocacoes(data),
        filterUser: (items) => items.filter(item => item.user_id === this.currentUser?.id)
      }
    }

    const handler = handlers[table]
    if (!handler) {
      return { select: () => ({ execute: async () => ({ data: [], error: null }) }) }
    }

    return {
      select: (columns = '*') => ({
        eq: (column, value) => ({
          single: async () => {
            const items = handler.getData()
            const filtered = column === 'user_id' 
              ? handler.filterUser(items)
              : items.filter(item => item[column] === value)
            return filtered.length > 0 
              ? { data: filtered[0], error: null }
              : { data: null, error: { message: 'Registro não encontrado' } }
          },
          execute: async () => {
            const items = handler.getData()
            const filtered = column === 'user_id'
              ? handler.filterUser(items)
              : items.filter(item => item[column] === value)
            return { data: filtered, error: null }
          }
        }),
        order: (column, options = {}) => ({
          execute: async () => {
            const items = handler.filterUser(handler.getData())
            const sorted = [...items].sort((a, b) => {
              if (options.ascending) {
                return a[column] > b[column] ? 1 : -1
              }
              return a[column] < b[column] ? 1 : -1
            })
            return { data: sorted, error: null }
          }
        }),
        execute: async () => {
          const items = handler.filterUser(handler.getData())
          return { data: items, error: null }
        }
      }),

      insert: (data) => ({
        select: () => ({
          execute: async () => {
            const items = handler.getData()
            const newId = Math.max(...items.map(a => a.id), 0) + 1
            const newItem = {
              id: newId,
              user_id: this.currentUser?.id,
              ...data,
              created_at: data.created_at || new Date().toISOString()
            }
            items.push(newItem)
            handler.saveData(items)
            console.log(`Novo(a) ${table} criado(a):`, newItem)
            return { data: [newItem], error: null }
          }
        }),
        execute: async () => {
          const items = handler.getData()
          const newId = Math.max(...items.map(a => a.id), 0) + 1
          const newItem = {
            id: newId,
            user_id: this.currentUser?.id,
            ...data,
            created_at: data.created_at || new Date().toISOString()
          }
          items.push(newItem)
          handler.saveData(items)
          console.log(`Novo(a) ${table} criado(a):`, newItem)
          return { data: [newItem], error: null }
        }
      }),

      update: (data) => ({
        eq: (column, value) => ({
          execute: async () => {
            const items = handler.getData()
            const itemIndex = items.findIndex(a => a[column] === (typeof value === 'string' ? parseInt(value) : value))
            if (itemIndex !== -1) {
              items[itemIndex] = { ...items[itemIndex], ...data, updated_at: new Date().toISOString() }
              handler.saveData(items)
              console.log(`${table} atualizado(a):`, items[itemIndex])
              return { data: [items[itemIndex]], error: null }
            }
            return { data: [], error: { message: 'Registro não encontrado' } }
          }
        })
      }),

      delete: () => ({
        eq: (column, value) => ({
          execute: async () => {
            const items = handler.getData()
            const filtered = items.filter(a => a[column] !== (typeof value === 'string' ? parseInt(value) : value))
            handler.saveData(filtered)
            console.log(`${table} deletado(a) com ${column}:`, value)
            return { data: null, error: null }
          }
        })
      })
    }
  }

  // Storage simulado
  storage = {
    from: (bucket) => ({
      upload: async (path, file) => {
        console.log(`Upload simulado para ${bucket}:`, path)
        // Simular upload bem-sucedido
        return { data: { path: `local/${bucket}/${path}` }, error: null }
      }
    })
  }

  // Functions simuladas
  functions = {
    invoke: async (functionName, options) => {
      console.log(`Executando função: ${functionName}`)
      
      if (functionName === 'processar-ata') {
        const result = await this.processAta(options.body.ataId)
        return result.success
          ? { data: { success: true }, error: null }
          : { data: null, error: { message: result.error } }
      }

      return { data: { success: true }, error: null }
    }
  }

  // Método para obter ata específica
  async getAta(id) {
    if (!this.isElectron) {
      const atas = this.getAtas()
      const ata = atas.find(a => a.id === parseInt(id))
      return ata 
        ? { data: ata, error: null }
        : { data: null, error: { message: 'Ata não encontrada' } }
    }

    const result = await ipcRenderer.invoke('get-ata', id)
    return result.success
      ? { data: result.data, error: null }
      : { data: null, error: { message: result.error } }
  }

  // Método para processar ata com configurações de LLM
  async processAta(ataId) {
    if (!this.isElectron) {
      const atas = this.getAtas()
      const ataIndex = atas.findIndex(a => a.id === parseInt(ataId))
      
      if (ataIndex !== -1) {
        // Obter configurações de LLM
        const llmConfig = JSON.parse(localStorage.getItem('llm_config') || '{}')
        const isTestMode = llmConfig.test_mode !== false // Default para true
        
        // Simular processamento
        atas[ataIndex].status = 'PROCESSANDO'
        this.saveAtas(atas)
        
        // Simular delay baseado no provedor
        const delays = {
          openai: 3000,
          anthropic: 4000,
          groq: 2000
        }
        const delay = delays[llmConfig.provider] || 3000
        await new Promise(resolve => setTimeout(resolve, delay))
        
        // Gerar rascunho baseado na configuração
        let providerInfo = ''
        if (isTestMode) {
          providerInfo = 'Modo de Teste - Transcrição Simulada'
        } else {
          const providerNames = {
            openai: 'OpenAI Whisper',
            anthropic: 'Anthropic Claude',
            groq: 'Groq Whisper'
          }
          providerInfo = `${providerNames[llmConfig.provider] || 'IA Configurada'}`
        }
        
        const rascunhoSimulado = `# ATA DA ${atas[ataIndex].numero_sessao}

## DADOS DA SESSÃO
- **Data**: ${new Date().toLocaleDateString('pt-BR')}
- **Horário**: ${new Date().toLocaleTimeString('pt-BR')}
- **Local**: Sala de Reuniões Virtual
- **Tipo**: ${atas[ataIndex].tipo_sessao}

## PARTICIPANTES
- **Presidente**: ${this.currentUser?.nome_completo || 'Usuário'}
- **Secretário**: Sistema Automático
- **Membros presentes**: 8 de 10

## PAUTA DISCUTIDA
1. **Abertura da sessão**
   - Sessão ${atas[ataIndex].tipo_sessao.toLowerCase()} aberta às ${new Date().toLocaleTimeString('pt-BR')}
   - Verificação de quórum
   
2. **Aprovação da ata anterior**
   - Ata da sessão anterior lida e aprovada por unanimidade
   - Sem alterações solicitadas
   
3. **Assuntos em pauta**
   - Apresentação de novos projetos institucionais
   - Discussão sobre alocação de recursos orçamentários
   - Planejamento estratégico para o próximo período
   - Análise de propostas de melhorias operacionais

4. **Assuntos gerais**
   - Discussões sobre políticas internas
   - Avaliação de processos em andamento
   - Propostas de otimização de fluxos de trabalho

## DELIBERAÇÕES TOMADAS
- **Deliberação 001/2025**: Aprovado por unanimidade (10 votos) o projeto de modernização tecnológica
- **Deliberação 002/2025**: Aprovado por maioria (8 votos favoráveis, 2 abstenções) a proposta de realocação orçamentária
- **Deliberação 003/2025**: Aprovado por unanimidade o cronograma de atividades para o próximo trimestre

## ENCAMINHAMENTOS
- Implementação das deliberações aprovadas até ${new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString('pt-BR')}
- Relatório de progresso a ser apresentado na próxima sessão
- Formação de comissão para acompanhamento dos projetos aprovados

## ENCERRAMENTO
Nada mais havendo a tratar, a sessão foi encerrada às ${new Date().toLocaleTimeString('pt-BR')}.

---
**Informações Técnicas:**
- *Ata gerada automaticamente pelo Sistema Ata Audio*
- *Processamento realizado com: ${providerInfo}*
- *Data de processamento: ${new Date().toLocaleString('pt-BR')}*
- *Usuário responsável: ${this.currentUser?.email}*`

        atas[ataIndex].status = 'CONCLUIDO'
        atas[ataIndex].rascunho_gerado = rascunhoSimulado
        this.saveAtas(atas)
        
        return { success: true }
      }
      return { success: false, error: 'Ata não encontrada' }
    }

    const result = await ipcRenderer.invoke('process-ata', ataId)
    return result
  }
}

export const localClient = new LocalClient()
export default localClient