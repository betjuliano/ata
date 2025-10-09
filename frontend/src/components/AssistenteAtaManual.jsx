import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ChevronLeft, ChevronRight, Save, Check, FileText } from 'lucide-react'
import { toast } from 'sonner'

export default function AssistenteAtaManual({ pautas, onSave, onCancel, numeroSessao }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [pautasRedacao, setPautasRedacao] = useState([])
  const [assuntosGerais, setAssuntosGerais] = useState({
    trechos: [''],
    redacao_final: ''
  })

  // Inicializar pautas + assuntos gerais
  useEffect(() => {
    // Se não tiver pautas, criar estrutura básica para redação livre
    const pautasBase = pautas && pautas.length > 0 
      ? pautas.map(p => ({
          pauta_id: p.id,
          pauta_tema: p.tema,
          pauta_descricao: p.descricao,
          transcricao_trecho: '',
          deliberacao: '',
          observacoes: '',
          concluido: false
        }))
      : [
          // Se não tem pautas, criar pauta genérica
          {
            pauta_id: null,
            pauta_tema: 'Conteúdo da Reunião',
            pauta_descricao: 'Registre aqui o conteúdo discutido na reunião',
            transcricao_trecho: '',
            deliberacao: '',
            observacoes: '',
            concluido: false
          }
        ]

    const pautasComAssuntosGerais = [
      ...pautasBase,
      {
        pauta_id: null,
        pauta_tema: 'Assuntos Gerais',
        pauta_descricao: 'Discussões e encaminhamentos diversos não previstos na pauta',
        transcricao_trecho: '',
        deliberacao: '',
        observacoes: '',
        is_assuntos_gerais: true,
        concluido: false
      }
    ]
    setPautasRedacao(pautasComAssuntosGerais)
  }, [pautas])

  const currentPauta = pautasRedacao[currentStep]
  const totalSteps = pautasRedacao.length
  const progress = ((currentStep + 1) / totalSteps) * 100

  // Salvar pauta atual
  const handleSalvarPauta = () => {
    const updated = [...pautasRedacao]
    
    if (currentPauta.is_assuntos_gerais) {
      // Assuntos gerais: combinar trechos
      const trechosValidos = assuntosGerais.trechos.filter(t => t.trim())
      if (trechosValidos.length === 0 && !assuntosGerais.redacao_final.trim()) {
        toast.warning('Assuntos Gerais está vazio. Isso é permitido, mas você pode adicionar conteúdo.')
      }
      
      updated[currentStep] = {
        ...currentPauta,
        transcricao_trecho: assuntosGerais.redacao_final || trechosValidos.join('\n\n'),
        concluido: true
      }
    } else {
      // Pauta normal
      if (!currentPauta.transcricao_trecho.trim()) {
        toast.error('Preencha a transcrição do trecho referente a esta pauta')
        return
      }
      
      updated[currentStep] = {
        ...currentPauta,
        concluido: true
      }
    }
    
    setPautasRedacao(updated)
    toast.success(`Pauta "${currentPauta.pauta_tema}" salva!`)
    
    // Avançar automaticamente se não for a última
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  // Atualizar campo da pauta atual
  const handleUpdateField = (field, value) => {
    const updated = [...pautasRedacao]
    updated[currentStep] = {
      ...updated[currentStep],
      [field]: value
    }
    setPautasRedacao(updated)
  }

  // Adicionar novo trecho em Assuntos Gerais
  const handleAddTrecho = () => {
    setAssuntosGerais({
      ...assuntosGerais,
      trechos: [...assuntosGerais.trechos, '']
    })
  }

  // Atualizar trecho específico
  const handleUpdateTrecho = (index, value) => {
    const updated = [...assuntosGerais.trechos]
    updated[index] = value
    setAssuntosGerais({
      ...assuntosGerais,
      trechos: updated
    })
  }

  // Remover trecho
  const handleRemoveTrecho = (index) => {
    const updated = assuntosGerais.trechos.filter((_, i) => i !== index)
    setAssuntosGerais({
      ...assuntosGerais,
      trechos: updated.length > 0 ? updated : ['']
    })
  }

  // Finalizar e gerar ata completa
  const handleFinalizar = () => {
    const pautasIncompletas = pautasRedacao.filter(p => !p.concluido && !p.is_assuntos_gerais)
    
    if (pautasIncompletas.length > 0) {
      toast.error(`Você ainda tem ${pautasIncompletas.length} pauta(s) não concluída(s)`)
      return
    }

    // Gerar texto completo da ata
    const texto = gerarTextoAta()
    onSave(texto, pautasRedacao)
  }

  // Gerar texto completo formatado
  const gerarTextoAta = () => {
    let texto = `ATA DA ${numeroSessao}\n\n`
    
    pautasRedacao.forEach((pauta, index) => {
      if (pauta.is_assuntos_gerais) {
        texto += `\n## ASSUNTOS GERAIS\n\n`
        texto += pauta.transcricao_trecho || 'Nada a registrar.\n'
      } else {
        texto += `\n## PAUTA ${index + 1}: ${pauta.pauta_tema}\n\n`
        texto += `**Descrição:** ${pauta.pauta_descricao}\n\n`
        texto += `**Discussão:**\n${pauta.transcricao_trecho}\n\n`
        
        if (pauta.deliberacao) {
          texto += `**Deliberação:** ${pauta.deliberacao}\n\n`
        }
        
        if (pauta.observacoes) {
          texto += `**Observações:** ${pauta.observacoes}\n\n`
        }
      }
    })
    
    return texto
  }

  if (pautasRedacao.length === 0 || !currentPauta) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando assistente...</p>
        </CardContent>
      </Card>
    )
  }

  const allConcluido = pautasRedacao.every(p => p.concluido)

  return (
    <div className="space-y-6">
      {/* Progresso */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Assistente de Redação por Pauta</CardTitle>
              <CardDescription>
                Passo {currentStep + 1} de {totalSteps} - {currentPauta.pauta_tema}
              </CardDescription>
            </div>
            <Badge variant={currentPauta.concluido ? 'success' : 'secondary'}>
              {currentPauta.concluido ? <><Check className="w-3 h-3 mr-1" />Concluído</> : 'Pendente'}
            </Badge>
          </div>
          <Progress value={progress} className="mt-4" />
        </CardHeader>
      </Card>

      {/* Navegação de Pautas */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {pautasRedacao.map((pauta, index) => (
          <Button
            key={index}
            variant={currentStep === index ? 'default' : pauta.concluido ? 'outline' : 'ghost'}
            size="sm"
            onClick={() => setCurrentStep(index)}
            className="min-w-fit"
          >
            {pauta.concluido && <Check className="w-3 h-3 mr-1" />}
            {index + 1}. {pauta.pauta_tema.substring(0, 20)}
            {pauta.pauta_tema.length > 20 && '...'}
          </Button>
        ))}
      </div>

      {/* Conteúdo da Pauta Atual */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {currentPauta.is_assuntos_gerais ? '📌 Assuntos Gerais' : `📋 Pauta ${currentStep + 1}: ${currentPauta.pauta_tema}`}
          </CardTitle>
          {!currentPauta.is_assuntos_gerais && (
            <CardDescription className="mt-2">
              <strong>Descrição da Pauta:</strong> {currentPauta.pauta_descricao}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {currentPauta.is_assuntos_gerais ? (
            // Interface para Assuntos Gerais
            <>
              <Alert>
                <AlertDescription>
                  <strong>Assuntos Gerais</strong> é um espaço para tópicos não previstos na pauta. 
                  Você pode deixar em branco se não houver nada a registrar, ou organizar em trechos separados.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <Label>Organizar por Trechos (opcional)</Label>
                {assuntosGerais.trechos.map((trecho, index) => (
                  <div key={index} className="flex gap-2">
                    <Textarea
                      value={trecho}
                      onChange={(e) => handleUpdateTrecho(index, e.target.value)}
                      placeholder={`Trecho ${index + 1} - Ex: Discussão sobre...`}
                      className="flex-1"
                      rows={3}
                    />
                    {assuntosGerais.trechos.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveTrecho(index)}
                      >
                        Remover
                      </Button>
                    )}
                  </div>
                ))}
                
                <Button variant="outline" size="sm" onClick={handleAddTrecho}>
                  + Adicionar Trecho
                </Button>
              </div>

              <div className="border-t pt-4">
                <Label>OU Redação Final Livre</Label>
                <Textarea
                  value={assuntosGerais.redacao_final}
                  onChange={(e) => setAssuntosGerais({...assuntosGerais, redacao_final: e.target.value})}
                  placeholder="Digite diretamente a redação final dos assuntos gerais..."
                  className="mt-2"
                  rows={6}
                />
              </div>
            </>
          ) : (
            // Interface para Pauta Normal
            <>
              <div className="space-y-2">
                <Label>Transcrição do Trecho Referente a Esta Pauta *</Label>
                <Textarea
                  value={currentPauta.transcricao_trecho}
                  onChange={(e) => handleUpdateField('transcricao_trecho', e.target.value)}
                  placeholder="Cole ou digite o trecho da transcrição que trata desta pauta..."
                  className="min-h-[200px] font-mono text-sm"
                />
                <p className="text-xs text-gray-500">
                  {currentPauta.transcricao_trecho.length} caracteres
                </p>
              </div>

              <div className="space-y-2">
                <Label>Deliberação (opcional)</Label>
                <Textarea
                  value={currentPauta.deliberacao}
                  onChange={(e) => handleUpdateField('deliberacao', e.target.value)}
                  placeholder="Ex: Aprovado por unanimidade, Aprovado com 8 votos favoráveis..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Observações (opcional)</Label>
                <Textarea
                  value={currentPauta.observacoes}
                  onChange={(e) => handleUpdateField('observacoes', e.target.value)}
                  placeholder="Observações adicionais sobre esta pauta..."
                  rows={2}
                />
              </div>
            </>
          )}

          {/* Botões de Ação */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Anterior
            </Button>

            <div className="flex gap-2">
              <Button onClick={handleSalvarPauta}>
                <Save className="w-4 h-4 mr-2" />
                Salvar Pauta
              </Button>

              {currentStep < totalSteps - 1 ? (
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(currentStep + 1)}
                >
                  Próxima
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  variant="default"
                  onClick={handleFinalizar}
                  disabled={!allConcluido}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Finalizar Ata
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-sm">Resumo do Progresso</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Total de Pautas</p>
              <p className="text-2xl font-bold">{totalSteps}</p>
            </div>
            <div>
              <p className="text-gray-600">Concluídas</p>
              <p className="text-2xl font-bold text-green-600">
                {pautasRedacao.filter(p => p.concluido).length}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Pendentes</p>
              <p className="text-2xl font-bold text-orange-600">
                {pautasRedacao.filter(p => !p.concluido).length}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Progresso</p>
              <p className="text-2xl font-bold">{Math.round(progress)}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botão Cancelar */}
      <div className="flex justify-center">
        <Button variant="ghost" onClick={onCancel}>
          Cancelar e Voltar
        </Button>
      </div>
    </div>
  )
}

