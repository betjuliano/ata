// Edge Function para processamento real de atas com IA
// Esta versão integra com APIs de transcrição e LLMs para processamento real

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface AtaRecord {
  id: number
  user_id: string
  numero_sessao: string
  tipo_sessao: string
  audio_path: string
  pauta_path: string
  status: string
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }

    const payload = await req.json()
    
    if (payload.type !== 'INSERT' || payload.table !== 'atas') {
      return new Response('Event not handled', { status: 200 })
    }

    const ataRecord: AtaRecord = payload.record
    const ataId = ataRecord.id

    console.log(`Processando ata ID: ${ataId} com IA real`)

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Atualizar status para PROCESSANDO
    await supabaseAdmin
      .from('atas')
      .update({ status: 'PROCESSANDO' })
      .eq('id', ataId)

    // 2. Baixar arquivo de áudio
    console.log('Baixando arquivo de áudio...')
    const { data: audioData, error: audioError } = await supabaseAdmin.storage
      .from('audios')
      .download(ataRecord.audio_path)

    if (audioError) throw new Error(`Erro ao baixar áudio: ${audioError.message}`)

    // 3. Baixar arquivo de pauta
    console.log('Baixando arquivo de pauta...')
    const { data: pautaData, error: pautaError } = await supabaseAdmin.storage
      .from('pautas')
      .download(ataRecord.pauta_path)

    if (pautaError) throw new Error(`Erro ao baixar pauta: ${pautaError.message}`)

    // 4. Extrair texto da pauta (assumindo que é um PDF ou DOCX)
    const pautaTexto = await extrairTextoPauta(pautaData)
    console.log('Pauta extraída:', pautaTexto.substring(0, 200) + '...')

    // 5. Transcrever áudio usando OpenAI Whisper
    console.log('Transcrevendo áudio...')
    const transcricao = await transcreverAudio(audioData)
    console.log('Transcrição concluída:', transcricao.substring(0, 200) + '...')

    // 6. Gerar ata usando GPT
    console.log('Gerando ata com IA...')
    const ataGerada = await gerarAtaComIA(transcricao, pautaTexto, ataRecord)

    // 7. Salvar resultado
    const { error: updateError } = await supabaseAdmin
      .from('atas')
      .update({ 
        status: 'CONCLUIDO', 
        rascunho_gerado: ataGerada 
      })
      .eq('id', ataId)

    if (updateError) throw updateError

    console.log(`Ata ${ataId} processada com sucesso usando IA!`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Ata ${ataId} processada com IA` 
      }), 
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Erro no processamento com IA:', error)

    // Fallback para versão simulada em caso de erro
    try {
      const payload = await req.json()
      const ataRecord: AtaRecord = payload.record
      const ataId = ataRecord.id

      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      // Gerar versão simulada como fallback
      const rascunhoFallback = gerarRascunhoFallback(ataRecord, error.message)

      await supabaseAdmin
        .from('atas')
        .update({ 
          status: 'CONCLUIDO',
          rascunho_gerado: rascunhoFallback,
          error_message: `Processamento com IA falhou, usando versão simulada: ${error.message}`
        })
        .eq('id', ataId)

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Ata ${ataId} processada com fallback simulado`,
          warning: 'IA indisponível, versão simulada gerada'
        }), 
        {
          headers: { 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    } catch (fallbackError) {
      console.error('Erro no fallback:', fallbackError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: error.message 
        }), 
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
  }
})

// Função para extrair texto de arquivos de pauta
async function extrairTextoPauta(pautaData: Blob): Promise<string> {
  // Implementação simplificada - em produção, usar bibliotecas específicas
  // para PDF (pdf-parse) ou DOCX (mammoth)
  
  try {
    const text = await pautaData.text()
    return text
  } catch {
    // Se não conseguir extrair como texto, retornar pauta genérica
    return `PAUTA DA REUNIÃO
    1. Homologação da ata anterior
    2. Análise de processos acadêmicos
    3. Assuntos gerais`
  }
}

// Função para transcrever áudio usando OpenAI Whisper
async function transcreverAudio(audioData: Blob): Promise<string> {
  const openaiKey = Deno.env.get('OPENAI_API_KEY')
  
  if (!openaiKey) {
    throw new Error('Chave da OpenAI não configurada')
  }

  const formData = new FormData()
  formData.append('file', audioData, 'audio.mp3')
  formData.append('model', 'whisper-1')
  formData.append('language', 'pt')

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiKey}`,
    },
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`Erro na transcrição: ${response.statusText}`)
  }

  const result = await response.json()
  return result.text
}

// Função para gerar ata usando GPT
async function gerarAtaComIA(transcricao: string, pauta: string, ata: AtaRecord): Promise<string> {
  const openaiKey = Deno.env.get('OPENAI_API_KEY')
  
  if (!openaiKey) {
    throw new Error('Chave da OpenAI não configurada')
  }

  const prompt = `Você é um assistente especializado em redigir atas de reunião acadêmica. 

Com base na transcrição da reunião e na pauta fornecidas, gere uma ata formal seguindo o modelo da UFSM.

INFORMAÇÕES DA SESSÃO:
- Número: ${ata.numero_sessao}
- Tipo: ${ata.tipo_sessao}

PAUTA DA REUNIÃO:
${pauta}

TRANSCRIÇÃO DA REUNIÃO:
${transcricao}

INSTRUÇÕES:
1. Siga o formato formal de ata acadêmica
2. Inclua abertura com data, hora e participantes
3. Para cada item da pauta, identifique:
   - O assunto discutido
   - Os participantes que falaram
   - As deliberações tomadas
4. Inclua encerramento formal
5. Use linguagem formal e objetiva
6. Mantenha a estrutura: PAUTA X: [título] - [discussão] - [deliberação]

Gere a ata completa:`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'Você é um especialista em redação de atas acadêmicas formais.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.3,
    }),
  })

  if (!response.ok) {
    throw new Error(`Erro na geração da ata: ${response.statusText}`)
  }

  const result: OpenAIResponse = await response.json()
  return result.choices[0].message.content
}

// Função de fallback para gerar rascunho simulado
function gerarRascunhoFallback(ata: AtaRecord, errorMessage: string): string {
  const dataAtual = new Date().toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  return `ATA DA ${ata.numero_sessao} SESSÃO ${ata.tipo_sessao.toUpperCase()}

Aos ${dataAtual}, reuniu-se o Colegiado do Curso, sob a Presidência do(a) Coordenador(a), com a presença dos membros do colegiado.

PAUTA 1: Homologação da ata anterior
A ata da sessão anterior foi homologada por unanimidade.

PAUTA 2: Análise de processos acadêmicos
Foram analisados diversos processos acadêmicos com as devidas deliberações.

PAUTA 3: Assuntos gerais
Discussão de assuntos diversos relacionados ao curso.

Nada mais havendo a tratar, a sessão foi encerrada.

---
AVISO: Esta ata foi gerada automaticamente em modo de fallback.
Erro no processamento com IA: ${errorMessage}
Para ativar o processamento completo, verifique as configurações de API.`
}
