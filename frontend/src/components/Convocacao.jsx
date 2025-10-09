import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Send, Copy, Check, Plus, Trash2 } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { convocacaoSchema, validateData } from '../lib/validators'
import { toast } from 'sonner'

export default function Convocacao() {
  const { pautas, createConvocacao } = useApp()
  
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [modoEntrada, setModoEntrada] = useState('cadastradas') // 'cadastradas' ou 'manual'
  
  const [convocacaoForm, setConvocacaoForm] = useState({
    titulo: '',
    formato: 'PRESENCIAL',
    data_reuniao: '',
    horario: '',
    pautas_texto: ''
  })
  
  const [pautasSelecionadas, setPautasSelecionadas] = useState([])
  const [formErrors, setFormErrors] = useState({})
  const [textoGerado, setTextoGerado] = useState('')

  // Pautas aprovadas disponíveis
  const pautasAprovadas = pautas.filter(p => p.status === 'APROVADA')

  // Adicionar pauta selecionada
  const handleAddPauta = (pautaId) => {
    const pauta = pautas.find(p => p.id === parseInt(pautaId))
    if (pauta && !pautasSelecionadas.find(p => p.id === pauta.id)) {
      setPautasSelecionadas([...pautasSelecionadas, pauta])
    }
  }

  // Remover pauta selecionada
  const handleRemovePauta = (pautaId) => {
    setPautasSelecionadas(pautasSelecionadas.filter(p => p.id !== pautaId))
  }

  // Gerar texto de convocação
  const handleGerarTexto = () => {
    const validation = validateData(convocacaoSchema, convocacaoForm)
    
    if (!validation.success) {
      setFormErrors(validation.errors)
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    // Construir texto das pautas
    let pautasTexto = ''
    
    if (modoEntrada === 'cadastradas') {
      if (pautasSelecionadas.length === 0) {
        toast.error('Selecione pelo menos uma pauta')
        return
      }
      
      pautasTexto = pautasSelecionadas.map((pauta, index) => {
        return `PAUTA ${index + 1}: ${pauta.tema}\n${pauta.descricao}\n`
      }).join('\n')
    } else {
      pautasTexto = convocacaoForm.pautas_texto
    }

    // Formato conforme modelo fornecido pelo usuário
    const texto = `${convocacaoForm.titulo}
Formato: ${convocacaoForm.formato.toLowerCase()}
Data: ${convocacaoForm.data_reuniao}
Horário: ${convocacaoForm.horario}

${pautasTexto}

At.te
${localStorage.getItem('currentUser') ? JSON.parse(localStorage.getItem('currentUser')).nome_completo : 'Coordenação'}`

    setTextoGerado(texto)
    setFormErrors({})
  }

  // Copiar texto para área de transferência
  const handleCopiarTexto = async () => {
    try {
      await navigator.clipboard.writeText(textoGerado)
      setCopied(true)
      toast.success('Texto copiado para a área de transferência!')
      setTimeout(() => setCopied(false), 2000)
      
      // Salvar no histórico
      await createConvocacao({
        titulo: convocacaoForm.titulo,
        formato: convocacaoForm.formato,
        data_reuniao: convocacaoForm.data_reuniao,
        horario: convocacaoForm.horario,
        pautas_texto: textoGerado
      })
    } catch (error) {
      toast.error('Erro ao copiar texto')
    }
  }

  // Limpar formulário
  const handleLimpar = () => {
    setConvocacaoForm({
      titulo: '',
      formato: 'PRESENCIAL',
      data_reuniao: '',
      horario: '',
      pautas_texto: ''
    })
    setPautasSelecionadas([])
    setTextoGerado('')
    setFormErrors({})
  }

  // Formatar data input para DD/MM/AAAA
  const handleDataChange = (e) => {
    let value = e.target.value.replace(/\D/g, '')
    
    if (value.length >= 2) {
      value = value.slice(0, 2) + '/' + value.slice(2)
    }
    if (value.length >= 5) {
      value = value.slice(0, 5) + '/' + value.slice(5, 9)
    }
    
    setConvocacaoForm({...convocacaoForm, data_reuniao: value})
  }

  // Formatar horário HH:MM
  const handleHorarioChange = (e) => {
    let value = e.target.value.replace(/\D/g, '')
    
    if (value.length >= 2) {
      value = value.slice(0, 2) + ':' + value.slice(2, 4)
    }
    
    setConvocacaoForm({...convocacaoForm, horario: value})
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Send className="w-4 h-4 mr-2" />
          Convocar Reunião
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Convocação de Reunião</DialogTitle>
          <DialogDescription>
            Gere automaticamente o texto de convocação com as pautas
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações da Reunião</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="titulo">Título da Convocação *</Label>
                <Input
                  id="titulo"
                  value={convocacaoForm.titulo}
                  onChange={(e) => setConvocacaoForm({...convocacaoForm, titulo: e.target.value})}
                  placeholder="Ex: Pauta reunião do colegiado dos cursos de Administração Setembro/2025"
                />
                {formErrors.titulo && <p className="text-xs text-red-600">{formErrors.titulo}</p>}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="formato">Formato *</Label>
                  <Select value={convocacaoForm.formato} onValueChange={(value) => setConvocacaoForm({...convocacaoForm, formato: value})}>
                    <SelectTrigger id="formato">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PRESENCIAL">Presencial</SelectItem>
                      <SelectItem value="VIRTUAL">Virtual</SelectItem>
                      <SelectItem value="HIBRIDO">Híbrido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data">Data (DD/MM/AAAA) *</Label>
                  <Input
                    id="data"
                    value={convocacaoForm.data_reuniao}
                    onChange={handleDataChange}
                    placeholder="12/09/2025"
                    maxLength={10}
                  />
                  {formErrors.data_reuniao && <p className="text-xs text-red-600">{formErrors.data_reuniao}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="horario">Horário (HH:MM) *</Label>
                  <Input
                    id="horario"
                    value={convocacaoForm.horario}
                    onChange={handleHorarioChange}
                    placeholder="10:00"
                    maxLength={5}
                  />
                  {formErrors.horario && <p className="text-xs text-red-600">{formErrors.horario}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pautas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pautas da Reunião</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={modoEntrada} onValueChange={setModoEntrada}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="cadastradas">Pautas Cadastradas</TabsTrigger>
                  <TabsTrigger value="manual">Digitar Manualmente</TabsTrigger>
                </TabsList>

                <TabsContent value="cadastradas" className="space-y-4">
                  {pautasAprovadas.length === 0 ? (
                    <Alert>
                      <AlertDescription>
                        Nenhuma pauta aprovada encontrada. Crie pautas com status "Aprovada" na área de Pautas.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <>
                      <div className="flex gap-2">
                        <Select onValueChange={handleAddPauta}>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Selecione uma pauta para adicionar" />
                          </SelectTrigger>
                          <SelectContent>
                            {pautasAprovadas.map(pauta => (
                              <SelectItem key={pauta.id} value={pauta.id.toString()}>
                                {pauta.tema} ({pauta.reuniao_prevista})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        {pautasSelecionadas.length === 0 ? (
                          <p className="text-sm text-gray-500 italic">Nenhuma pauta selecionada</p>
                        ) : (
                          pautasSelecionadas.map((pauta, index) => (
                            <div key={pauta.id} className="border rounded p-3 bg-gray-50">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <p className="font-medium">PAUTA {index + 1}: {pauta.tema}</p>
                                  <p className="text-sm text-gray-600 mt-1">{pauta.descricao}</p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemovePauta(pauta.id)}
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </>
                  )}
                </TabsContent>

                <TabsContent value="manual" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="pautas_texto">Pautas (texto livre) *</Label>
                    <Textarea
                      id="pautas_texto"
                      value={convocacaoForm.pautas_texto}
                      onChange={(e) => setConvocacaoForm({...convocacaoForm, pautas_texto: e.target.value})}
                      placeholder="Digite as pautas da reunião..."
                      className="min-h-[200px] font-mono text-sm"
                    />
                    {formErrors.pautas_texto && <p className="text-xs text-red-600">{formErrors.pautas_texto}</p>}
                  </div>

                  <Alert>
                    <AlertDescription className="text-xs">
                      <strong>Dica:</strong> Você pode formatar o texto livremente. Exemplo:
                      <pre className="mt-2 text-xs bg-white p-2 rounded">
{`PAUTA 1: Homologação da ata anterior
PAUTA 2: Processos acadêmicos
PAUTA 3: Assuntos gerais`}
                      </pre>
                    </AlertDescription>
                  </Alert>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Botão Gerar */}
          <div className="flex gap-2">
            <Button onClick={handleGerarTexto} className="flex-1">
              <Send className="w-4 h-4 mr-2" />
              Gerar Texto de Convocação
            </Button>
            <Button variant="outline" onClick={handleLimpar}>
              Limpar
            </Button>
          </div>

          {/* Preview do Texto Gerado */}
          {textoGerado && (
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Texto Gerado</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopiarTexto}
                  >
                    {copied ? (
                      <><Check className="w-4 h-4 mr-2" />Copiado!</>
                    ) : (
                      <><Copy className="w-4 h-4 mr-2" />Copiar Texto</>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-white rounded p-4 border">
                  <pre className="whitespace-pre-wrap font-sans text-sm">
                    {textoGerado}
                  </pre>
                </div>
                <Alert className="mt-4">
                  <AlertDescription className="text-xs">
                    O texto foi salvo no histórico de convocações e está pronto para ser copiado e enviado por email.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => {
            setIsOpen(false)
            handleLimpar()
          }}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

