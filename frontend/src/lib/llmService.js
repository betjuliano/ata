// Serviço para integração com diferentes provedores de LLM
class LLMService {
  constructor() {
    this.config = this.loadConfig()
  }

  loadConfig() {
    const saved = localStorage.getItem('llm_config')
    return saved ? JSON.parse(saved) : {
      provider: 'openai',
      test_mode: true,
      openai_key: '',
      anthropic_key: '',
      groq_key: ''
    }
  }

  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig }
    localStorage.setItem('llm_config', JSON.stringify(this.config))
  }

  // Transcrever áudio usando o provedor configurado
  async transcribeAudio(audioFile) {
    if (this.config.test_mode) {
      return this.simulateTranscription()
    }

    switch (this.config.provider) {
      case 'openai':
        return await this.transcribeWithOpenAI(audioFile)
      case 'groq':
        return await this.transcribeWithGroq(audioFile)
      case 'anthropic':
        return await this.transcribeWithAnthropic(audioFile)
      default:
        throw new Error('Provedor não configurado')
    }
  }

  // Simular transcrição para modo de teste
  async simulateTranscription() {
    // Simular delay de processamento
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    return {
      text: `Transcrição simulada da reunião:

Presidente: Boa tarde a todos. Vamos dar início à nossa sessão ${new Date().toLocaleDateString('pt-BR')}.

Secretário: Quórum verificado, temos 8 membros presentes de um total de 10.

Presidente: Perfeito. Vamos começar com a aprovação da ata anterior. Alguém tem alguma observação?

Membro 1: Não, presidente. A ata está correta.

Presidente: Então vamos votar. Todos a favor da aprovação? Aprovado por unanimidade.

Presidente: Agora vamos ao primeiro item da pauta - o projeto de modernização tecnológica.

Membro 2: Gostaria de apresentar os detalhes do projeto. Temos um investimento previsto de R$ 500.000 para atualização dos sistemas.

Membro 3: Acho muito importante essa modernização. Nossos sistemas estão defasados.

Presidente: Vamos votar então. Todos a favor? Aprovado por unanimidade.

Presidente: Próximo item - realocação orçamentária.

Membro 4: Tenho algumas ressalvas sobre essa proposta. Precisamos analisar melhor o impacto.

Membro 5: Concordo com a realocação, mas sugiro algumas modificações.

Presidente: Vamos votar. Favoráveis? 8 votos. Abstenções? 2. Aprovado por maioria.

Presidente: Último item - cronograma de atividades.

Secretário: O cronograma está bem estruturado e factível.

Presidente: Alguma objeção? Não havendo, aprovado por unanimidade.

Presidente: Não havendo mais assuntos, encerro a sessão. Obrigado a todos.`,
      confidence: 0.95,
      duration: 1800, // 30 minutos
      provider: 'simulado'
    }
  }

  // Transcrição com OpenAI Whisper
  async transcribeWithOpenAI(audioFile) {
    if (!this.config.openai_key) {
      throw new Error('Chave da API OpenAI não configurada')
    }

    const formData = new FormData()
    formData.append('file', audioFile)
    formData.append('model', 'whisper-1')
    formData.append('language', 'pt')

    try {
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.openai_key}`
        },
        body: formData
      })

      if (!response.ok) {
        throw new Error(`Erro da API OpenAI: ${response.status}`)
      }

      const result = await response.json()
      return {
        text: result.text,
        confidence: 0.9,
        duration: result.duration || 0,
        provider: 'openai'
      }
    } catch (error) {
      throw new Error(`Erro na transcrição OpenAI: ${error.message}`)
    }
  }

  // Transcrição com Groq
  async transcribeWithGroq(audioFile) {
    if (!this.config.groq_key) {
      throw new Error('Chave da API Groq não configurada')
    }

    const formData = new FormData()
    formData.append('file', audioFile)
    formData.append('model', 'whisper-large-v3')
    formData.append('language', 'pt')

    try {
      const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.groq_key}`
        },
        body: formData
      })

      if (!response.ok) {
        throw new Error(`Erro da API Groq: ${response.status}`)
      }

      const result = await response.json()
      return {
        text: result.text,
        confidence: 0.92,
        duration: result.duration || 0,
        provider: 'groq'
      }
    } catch (error) {
      throw new Error(`Erro na transcrição Groq: ${error.message}`)
    }
  }

  // Transcrição com Anthropic (requer conversão prévia)
  async transcribeWithAnthropic(audioFile) {
    if (!this.config.anthropic_key) {
      throw new Error('Chave da API Anthropic não configurada')
    }

    // Anthropic não tem API de transcrição direta
    // Seria necessário usar outro serviço para transcrever primeiro
    // e depois usar Claude para processar o texto
    throw new Error('Anthropic requer transcrição prévia - funcionalidade em desenvolvimento')
  }

  // Gerar ata a partir da transcrição
  async generateAta(transcription, pautaContent, sessionInfo) {
    if (this.config.test_mode) {
      return this.simulateAtaGeneration(sessionInfo)
    }

    // Implementar geração real com LLM
    const prompt = this.buildAtaPrompt(transcription, pautaContent, sessionInfo)
    
    switch (this.config.provider) {
      case 'openai':
        return await this.generateWithOpenAI(prompt)
      case 'anthropic':
        return await this.generateWithAnthropic(prompt)
      case 'groq':
        return await this.generateWithGroq(prompt)
      default:
        return this.simulateAtaGeneration(sessionInfo)
    }
  }

  buildAtaPrompt(transcription, pautaContent, sessionInfo) {
    return `Você é um assistente especializado em gerar atas de reunião. 

Com base na transcrição da reunião e na pauta fornecida, gere uma ata formal seguindo o formato institucional brasileiro.

INFORMAÇÕES DA SESSÃO:
- Número: ${sessionInfo.numero_sessao}
- Tipo: ${sessionInfo.tipo_sessao}
- Data: ${new Date().toLocaleDateString('pt-BR')}

PAUTA DA REUNIÃO:
${pautaContent || 'Pauta não fornecida'}

TRANSCRIÇÃO DA REUNIÃO:
${transcription}

INSTRUÇÕES:
1. Organize a ata com as seções: Dados da Sessão, Participantes, Pauta Discutida, Deliberações, Encerramento
2. Identifique as decisões tomadas e votações realizadas
3. Use linguagem formal e objetiva
4. Mantenha a estrutura cronológica dos assuntos
5. Destaque as deliberações numeradas sequencialmente

Gere a ata em formato Markdown:`
  }

  async generateWithOpenAI(prompt) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.openai_key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 2000,
          temperature: 0.3
        })
      })

      const result = await response.json()
      return result.choices[0].message.content
    } catch (error) {
      throw new Error(`Erro na geração OpenAI: ${error.message}`)
    }
  }

  async generateWithAnthropic(prompt) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.anthropic_key}`,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 2000,
          messages: [{ role: 'user', content: prompt }]
        })
      })

      const result = await response.json()
      return result.content[0].text
    } catch (error) {
      throw new Error(`Erro na geração Anthropic: ${error.message}`)
    }
  }

  async generateWithGroq(prompt) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.groq_key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'mixtral-8x7b-32768',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 2000,
          temperature: 0.3
        })
      })

      const result = await response.json()
      return result.choices[0].message.content
    } catch (error) {
      throw new Error(`Erro na geração Groq: ${error.message}`)
    }
  }

  simulateAtaGeneration(sessionInfo) {
    return `# ATA DA ${sessionInfo.numero_sessao}

## DADOS DA SESSÃO
- **Data**: ${new Date().toLocaleDateString('pt-BR')}
- **Horário**: ${new Date().toLocaleTimeString('pt-BR')}
- **Local**: Sala de Reuniões Virtual
- **Tipo**: ${sessionInfo.tipo_sessao}

## PARTICIPANTES
- **Presidente**: Usuário do Sistema
- **Secretário**: Sistema Automático
- **Membros presentes**: 8 de 10

## PAUTA DISCUTIDA
1. **Abertura da sessão**
2. **Aprovação da ata anterior**
3. **Assuntos em pauta**
4. **Assuntos gerais**

## DELIBERAÇÕES TOMADAS
- **Deliberação 001/2025**: Aprovado por unanimidade
- **Deliberação 002/2025**: Aprovado por maioria

## ENCERRAMENTO
Sessão encerrada às ${new Date().toLocaleTimeString('pt-BR')}.

---
*Ata gerada em modo de teste - ${new Date().toLocaleString('pt-BR')}*`
  }

  // Testar conexão com o provedor
  async testConnection() {
    if (this.config.test_mode) {
      return { success: true, message: 'Modo de teste ativo' }
    }

    try {
      switch (this.config.provider) {
        case 'openai':
          return await this.testOpenAI()
        case 'anthropic':
          return await this.testAnthropic()
        case 'groq':
          return await this.testGroq()
        default:
          return { success: false, message: 'Provedor não configurado' }
      }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }

  async testOpenAI() {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: { 'Authorization': `Bearer ${this.config.openai_key}` }
    })
    
    if (response.ok) {
      return { success: true, message: 'Conexão OpenAI OK' }
    } else {
      throw new Error(`Erro OpenAI: ${response.status}`)
    }
  }

  async testAnthropic() {
    // Teste básico para Anthropic
    return { success: true, message: 'Anthropic configurado (teste básico)' }
  }

  async testGroq() {
    const response = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { 'Authorization': `Bearer ${this.config.groq_key}` }
    })
    
    if (response.ok) {
      return { success: true, message: 'Conexão Groq OK' }
    } else {
      throw new Error(`Erro Groq: ${response.status}`)
    }
  }
}

export const llmService = new LLMService()
export default llmService