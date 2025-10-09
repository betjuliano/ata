// Edge Function para processar atas de reunião
// Versão inicial com simulação (mock) para desenvolvimento sem custos de IA

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

Deno.serve(async (req) => {
  try {
    // Verificar se é uma requisição POST
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }

    // Obter dados do webhook
    const payload = await req.json()
    console.log('Payload recebido:', payload)

    // Verificar se é um evento de INSERT na tabela atas
    if (payload.type !== 'INSERT' || payload.table !== 'atas') {
      return new Response('Event not handled', { status: 200 })
    }

    const ataRecord: AtaRecord = payload.record
    const ataId = ataRecord.id

    console.log(`Processando ata ID: ${ataId}`)

    // Criar cliente Supabase com privilégios de serviço
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Atualizar status para PROCESSANDO
    console.log('Atualizando status para PROCESSANDO...')
    await supabaseAdmin
      .from('atas')
      .update({ status: 'PROCESSANDO' })
      .eq('id', ataId)

    // 2. SIMULAÇÃO: Aguardar um tempo para simular processamento
    console.log('Simulando processamento de áudio e IA...')
    await new Promise(resolve => setTimeout(resolve, 8000)) // 8 segundos

    // 3. SIMULAÇÃO: Gerar rascunho de ata mockado
    const rascunhoSimulado = gerarRascunhoSimulado(ataRecord)

    // 4. Atualizar ata com o rascunho gerado e status CONCLUIDO
    console.log('Salvando rascunho e finalizando...')
    const { error: updateError } = await supabaseAdmin
      .from('atas')
      .update({ 
        status: 'CONCLUIDO', 
        rascunho_gerado: rascunhoSimulado 
      })
      .eq('id', ataId)

    if (updateError) {
      throw updateError
    }

    console.log(`Ata ${ataId} processada com sucesso!`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Ata ${ataId} processada com sucesso` 
      }), 
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Erro no processamento:', error)

    // Em caso de erro, tentar atualizar o status para FALHA
    try {
      const payload = await req.json()
      const ataId = payload.record?.id

      if (ataId) {
        const supabaseAdmin = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        await supabaseAdmin
          .from('atas')
          .update({ 
            status: 'FALHA',
            error_message: error.message 
          })
          .eq('id', ataId)
      }
    } catch (updateError) {
      console.error('Erro ao atualizar status de falha:', updateError)
    }

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
})

// Função para gerar um rascunho simulado da ata
function gerarRascunhoSimulado(ata: AtaRecord): string {
  const dataAtual = new Date().toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  const horaAtual = new Date().toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  })

  return `ATA DA ${ata.numero_sessao} SESSÃO ${ata.tipo_sessao.toUpperCase()}

Aos ${dataAtual}, às ${horaAtual}, reuniu-se o Colegiado do Curso, sob a Presidência do(a) Coordenador(a), com a presença dos membros do colegiado. O Presidente cumprimentou a todos os presentes, conferiu o quórum e deu início à reunião.

PAUTA 1: Homologação da ata anterior
Após análise, a ata da sessão anterior foi homologada por unanimidade, sem alterações.

PAUTA 2: Análise de processos acadêmicos
Foram apresentados diversos processos para análise do colegiado. Após discussão, os seguintes encaminhamentos foram deliberados:
- Processo de dispensa de disciplina: Deferido conforme parecer técnico apresentado.
- Solicitação de aproveitamento de estudos: Aprovado por unanimidade após verificação da equivalência curricular.

PAUTA 3: Assuntos gerais
Foram discutidos assuntos diversos relacionados ao funcionamento do curso. Ficou acordado que será formada uma comissão para estudar as propostas apresentadas.

Nada mais havendo a tratar, eu, Secretário(a) do Colegiado, lavrei a presente ata, que vai assinada por mim, pelo Senhor Presidente e pelos demais membros do Colegiado presentes na reunião.

---
NOTA: Esta é uma versão simulada gerada automaticamente. 
Para ativar o processamento real com IA, configure as chaves de API no sistema.`
}
