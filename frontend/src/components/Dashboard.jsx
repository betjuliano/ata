import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useApp } from '../contexts/AppContext'
import { supabase } from '../lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FileText, Upload, LogOut, Plus, Eye, FileAudio, FilePen, ClipboardList, FileCode } from 'lucide-react'
import { validateAudio, validatePautaDocument } from '../lib/validators'
import { toast } from 'sonner'
import Configuracoes from './Configuracoes'
import AssistenteAtaManual from './AssistenteAtaManual'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { integrantes, pautas, loadIntegrantes, loadPautas } = useApp()
  
  const [atas, setAtas] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [modoCriacao, setModoCriacao] = useState('AUDIO') // 'AUDIO', 'TRANSCRICAO' ou 'MANUAL'
  const [mostrarAssistente, setMostrarAssistente] = useState(false)

  // Estados do formulário (todos os modos)
  const [numeroSessao, setNumeroSessao] = useState('')
  const [tipoSessao, setTipoSessao] = useState('Ordinária')
  const [dataReuniao, setDataReuniao] = useState('')
  const [horarioReuniao, setHorarioReuniao] = useState('')

  // Modo ÁUDIO
  const [audioFile, setAudioFile] = useState(null)
  const [pautaFile, setPautaFile] = useState(null)

  // Modo TRANSCRIÇÃO
  const [transcricaoTexto, setTranscricaoTexto] = useState('')

  // Modo MANUAL
  const [pautaOrigem, setPautaOrigem] = useState('cadastrada') // 'arquivo' ou 'cadastrada'
  const [pautaSelecionadaId, setPautaSelecionadaId] = useState('NENHUMA')
  const [integrantesSelecionados, setIntegrantesSelecionados] = useState([])

  // Carregar dados
  useEffect(() => {
    loadAtas()
    loadIntegrantes()
    loadPautas()
  }, [])

  const loadAtas = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from('atas').select('*').order('created_at', { ascending: false }).execute()
      if (error) throw error
      setAtas(data || [])
    } catch (err) {
      console.error('Erro ao carregar atas:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDataChange = (e) => {
    let value = e.target.value.replace(/\D/g, '')
    if (value.length >= 2) value = value.slice(0, 2) + '/' + value.slice(2)
    if (value.length >= 5) value = value.slice(0, 5) + '/' + value.slice(5, 9)
    setDataReuniao(value)
  }

  const handleHorarioChange = (e) => {
    let value = e.target.value.replace(/\D/g, '')
    if (value.length >= 2) value = value.slice(0, 2) + ':' + value.slice(2, 4)
    setHorarioReuniao(value)
  }

  const handleToggleIntegrante = (integranteId, presente) => {
    const exists = integrantesSelecionados.find(i => i.integrante_id === integranteId)
    if (exists) {
      setIntegrantesSelecionados(integrantesSelecionados.map(i => i.integrante_id === integranteId ? { ...i, presente } : i))
    } else {
      setIntegrantesSelecionados([...integrantesSelecionados, { integrante_id: integranteId, presente, justificativa_ausencia: '' }])
    }
  }

  const handleJustificativaChange = (integranteId, justificativa) => {
    setIntegrantesSelecionados(integrantesSelecionados.map(i => i.integrante_id === integranteId ? { ...i, justificativa_ausencia: justificativa } : i))
  }

  // Criar ata MODO ÁUDIO
  const handleCreateAtaAudio = async (e) => {
    e.preventDefault()
    
    if (!audioFile || !pautaFile) {
      toast.error('Selecione os arquivos de áudio e pauta')
      return
    }

    const audioValidation = validateAudio(audioFile)
    if (!audioValidation.valid) {
      toast.error(audioValidation.error)
      return
    }

    const pautaValidation = validatePautaDocument(pautaFile)
    if (!pautaValidation.valid) {
      toast.error(pautaValidation.error)
      return
    }

    setUploading(true)

    try {
      const audioPath = await uploadFile(audioFile, 'audios', `${user.id}/${Date.now()}_${audioFile.name}`)
      const pautaPath = await uploadFile(pautaFile, 'pautas', `${user.id}/${Date.now()}_${pautaFile.name}`)

      const { data, error } = await supabase.from('atas').insert({
          user_id: user.id,
          numero_sessao: numeroSessao,
          tipo_sessao: tipoSessao,
        data_reuniao: dataReuniao,
        horario_reuniao: horarioReuniao,
        modo_criacao: 'AUDIO',
          audio_path: audioPath,
          pauta_path: pautaPath,
        integrantes: integrantesSelecionados,
        status: 'PENDENTE'
      }).select().execute()

      if (error) throw error

      toast.success('Ata criada! Processamento iniciado.')
      limparFormulario()
      loadAtas()
    } catch (err) {
      toast.error('Erro ao criar ata: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  // Criar ata MODO TRANSCRIÇÃO
  const handleCreateAtaTranscricao = async (e) => {
    e.preventDefault()

    if (!transcricaoTexto.trim()) {
      toast.error('Digite a transcrição da reunião')
      return
    }

    if (!pautaFile) {
      toast.error('Selecione o arquivo de pauta')
      return
    }

    setUploading(true)

    try {
      const pautaPath = await uploadFile(pautaFile, 'pautas', `${user.id}/${Date.now()}_${pautaFile.name}`)

      const { data, error } = await supabase.from('atas').insert({
        user_id: user.id,
        numero_sessao: numeroSessao,
        tipo_sessao: tipoSessao,
        data_reuniao: dataReuniao,
        horario_reuniao: horarioReuniao,
        modo_criacao: 'TRANSCRICAO',
        pauta_path: pautaPath,
        transcricao_texto: transcricaoTexto,
        integrantes: integrantesSelecionados,
          status: 'PENDENTE'
      }).select().execute()

      if (error) throw error

      toast.success('Ata criada! Processamento iniciado.')
      limparFormulario()
      loadAtas()
    } catch (err) {
      toast.error('Erro ao criar ata: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  // Iniciar assistente modo manual
  const handleIniciarAssistente = () => {
    if (!numeroSessao || !dataReuniao || !horarioReuniao) {
      toast.error('Preencha número da sessão, data e horário')
      return
    }

    if (integrantesSelecionados.length === 0) {
      toast.error('Selecione pelo menos um integrante')
      return
    }

    let pautasSelecionadas = []
    
    if (pautaOrigem === 'cadastrada') {
      // Pauta cadastrada é OPCIONAL
      if (pautaSelecionadaId && pautaSelecionadaId !== 'NENHUMA') {
        const pauta = pautas.find(p => p.id === parseInt(pautaSelecionadaId))
        if (pauta) {
          pautasSelecionadas = [pauta]
        }
      }
      // Se não tiver pauta selecionada ou for "NENHUMA", continua sem pauta
    } else {
      // Pauta de arquivo é OPCIONAL
      if (pautaFile) {
        // Modo arquivo: usar pauta genérica
        pautasSelecionadas = [{
          id: 0,
          tema: 'Pauta da Reunião',
          descricao: 'Consulte o arquivo de pauta anexado para detalhes'
        }]
      }
      // Se não tiver arquivo, continua sem pauta
    }

    setMostrarAssistente(true)
  }

  // Salvar ata do assistente
  const handleSalvarAtaAssistente = async (textoAta, pautasRedacao) => {
    setUploading(true)

    try {
      let pautaPath = null
      if (pautaOrigem === 'arquivo' && pautaFile) {
        pautaPath = await uploadFile(pautaFile, 'pautas', `${user.id}/${Date.now()}_${pautaFile.name}`)
      }

      const { data, error } = await supabase.from('atas').insert({
        user_id: user.id,
        numero_sessao: numeroSessao,
        tipo_sessao: tipoSessao,
        data_reuniao: dataReuniao,
        horario_reuniao: horarioReuniao,
        modo_criacao: 'MANUAL',
        pauta_id: (pautaOrigem === 'cadastrada' && pautaSelecionadaId && pautaSelecionadaId !== 'NENHUMA') ? parseInt(pautaSelecionadaId) : null,
        pauta_path: pautaPath,
        integrantes: integrantesSelecionados,
        pautas_redacao: pautasRedacao,
        rascunho_gerado: textoAta,
        status: 'CONCLUIDO'
      }).select().execute()

      if (error) throw error

      toast.success('Ata manual criada com sucesso!')
      limparFormulario()
      setMostrarAssistente(false)
      loadAtas()

      if (data && data[0]) {
        navigate(`/editor/${data[0].id}`)
      }
    } catch (err) {
      toast.error('Erro ao criar ata: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  const uploadFile = async (file, bucket, path) => {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file)
    if (error) throw error
    return data.path
  }

  const limparFormulario = () => {
    setNumeroSessao('')
    setTipoSessao('Ordinária')
    setDataReuniao('')
    setHorarioReuniao('')
    setAudioFile(null)
    setPautaFile(null)
    setTranscricaoTexto('')
    setPautaSelecionadaId('NENHUMA')
    setIntegrantesSelecionados([])
  }

  const getStatusBadge = (status) => {
    const variants = {
      'PENDENTE': { variant: 'secondary', label: 'Pendente' },
      'PROCESSANDO': { variant: 'default', label: 'Processando' },
      'CONCLUIDO': { variant: 'success', label: 'Concluído' },
      'FALHA': { variant: 'destructive', label: 'Falha' }
    }
    const config = variants[status] || variants['PENDENTE']
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const pautasAprovadas = pautas.filter(p => p.status === 'APROVADA')
  const pautasSelecionadasParaAssistente = pautaOrigem === 'cadastrada' && pautaSelecionadaId && pautaSelecionadaId !== 'NENHUMA'
    ? pautas.filter(p => p.id === parseInt(pautaSelecionadaId))
    : []

  // Se está no assistente, mostrar apenas ele
  if (mostrarAssistente) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-4">
          <AssistenteAtaManual
            pautas={pautasSelecionadasParaAssistente}
            numeroSessao={numeroSessao}
            onSave={handleSalvarAtaAssistente}
            onCancel={() => setMostrarAssistente(false)}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <img 
                src="/logo-sistema.png" 
                alt="Logo" 
                className="w-10 h-10 object-contain"
              />
              <h1 className="text-xl font-semibold text-gray-900">Sistema Ata Audio</h1>
              <Button variant="outline" size="sm" onClick={() => navigate('/pautas')}>
                <ClipboardList className="w-4 h-4 mr-2" />Pautas
              </Button>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <Configuracoes />
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="w-4 h-4 mr-2" />Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center"><Plus className="w-5 h-5 mr-2" />Nova Ata</CardTitle>
                <CardDescription>Escolha o modo de criação</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={modoCriacao} onValueChange={setModoCriacao}>
                  <TabsList className="grid w-full grid-cols-3 mb-4">
                    <TabsTrigger value="AUDIO"><FileAudio className="w-4 h-4 mr-1" />Áudio</TabsTrigger>
                    <TabsTrigger value="TRANSCRICAO"><FileCode className="w-4 h-4 mr-1" />Texto</TabsTrigger>
                    <TabsTrigger value="MANUAL"><FilePen className="w-4 h-4 mr-1" />Manual</TabsTrigger>
                  </TabsList>

                  <div className="space-y-4 mb-4">
                    <div className="space-y-2">
                      <Label>Número da Sessão *</Label>
                      <Input value={numeroSessao} onChange={(e) => setNumeroSessao(e.target.value)} placeholder="Ex: 42ª" required />
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo da Sessão *</Label>
                      <Select value={tipoSessao} onValueChange={setTipoSessao}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Ordinária">Ordinária</SelectItem>
                          <SelectItem value="Extraordinária">Extraordinária</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label>Data *</Label>
                        <Input value={dataReuniao} onChange={handleDataChange} placeholder="DD/MM/AAAA" maxLength={10} required />
                      </div>
                  <div className="space-y-2">
                        <Label>Horário *</Label>
                        <Input value={horarioReuniao} onChange={handleHorarioChange} placeholder="HH:MM" maxLength={5} required />
                      </div>
                    </div>
                  </div>

                  <TabsContent value="AUDIO" className="space-y-4">
                    <form onSubmit={handleCreateAtaAudio} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Arquivo de Áudio *</Label>
                        <Input type="file" accept=".mp3,.wav,.m4a" onChange={(e) => setAudioFile(e.target.files[0])} required />
                        {audioFile && <p className="text-xs text-gray-600">{audioFile.name}</p>}
                      </div>
                  <div className="space-y-2">
                        <Label>Arquivo da Pauta *</Label>
                        <Input type="file" accept=".pdf,.docx,.doc" onChange={(e) => setPautaFile(e.target.files[0])} required />
                        {pautaFile && <p className="text-xs text-gray-600">{pautaFile.name}</p>}
                  </div>
                      <Button type="submit" className="w-full" disabled={uploading}>
                        {uploading ? <><Upload className="w-4 h-4 mr-2 animate-spin" />Enviando...</> : <><Upload className="w-4 h-4 mr-2" />Gerar Ata por Áudio</>}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="TRANSCRICAO" className="space-y-4">
                    <form onSubmit={handleCreateAtaTranscricao} className="space-y-4">
                  <div className="space-y-2">
                        <Label>Transcrição da Reunião *</Label>
                        <Textarea
                          value={transcricaoTexto}
                          onChange={(e) => setTranscricaoTexto(e.target.value)}
                          placeholder="Cole aqui a transcrição completa da reunião..."
                          className="min-h-[200px] font-mono text-sm"
                      required
                    />
                        <p className="text-xs text-gray-500">{transcricaoTexto.length} caracteres</p>
                      </div>
                      <div className="space-y-2">
                        <Label>Arquivo da Pauta *</Label>
                        <Input type="file" accept=".pdf,.docx,.doc" onChange={(e) => setPautaFile(e.target.files[0])} required />
                        {pautaFile && <p className="text-xs text-gray-600">{pautaFile.name}</p>}
                      </div>
                      <Button type="submit" className="w-full" disabled={uploading}>
                        {uploading ? <><Upload className="w-4 h-4 mr-2 animate-spin" />Enviando...</> : <><Upload className="w-4 h-4 mr-2" />Gerar Ata por Transcrição</>}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="MANUAL" className="space-y-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Pauta (Opcional)</Label>
                        <p className="text-xs text-gray-500">
                          Você pode criar a ata sem pauta prévia ou selecionar/anexar uma pauta
                        </p>
                        <Tabs value={pautaOrigem} onValueChange={setPautaOrigem}>
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="cadastrada">Cadastrada</TabsTrigger>
                            <TabsTrigger value="arquivo">Arquivo</TabsTrigger>
                          </TabsList>
                          <TabsContent value="cadastrada">
                            <Select value={pautaSelecionadaId || 'NENHUMA'} onValueChange={setPautaSelecionadaId}>
                              <SelectTrigger><SelectValue placeholder="Selecione uma pauta (opcional)" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="NENHUMA">Sem pauta pré-definida</SelectItem>
                                {pautasAprovadas.map(p => (<SelectItem key={p.id} value={p.id.toString()}>{p.tema}</SelectItem>))}
                              </SelectContent>
                            </Select>
                          </TabsContent>
                          <TabsContent value="arquivo">
                            <Input type="file" accept=".pdf,.docx" onChange={(e) => setPautaFile(e.target.files[0])} />
                            <p className="text-xs text-gray-500 mt-1">Opcional: Anexe um arquivo de pauta se tiver</p>
                          </TabsContent>
                        </Tabs>
                  </div>

                  <div className="space-y-2">
                        <Label>Integrantes *</Label>
                        <div className="border rounded p-3 max-h-40 overflow-y-auto space-y-2">
                          {integrantes.map(int => {
                            const selected = integrantesSelecionados.find(i => i.integrante_id === int.id)
                            return (
                              <div key={int.id} className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  <Checkbox checked={selected?.presente} onCheckedChange={(checked) => handleToggleIntegrante(int.id, checked)} />
                                  <span className="text-sm">{int.nome}</span>
                                </div>
                                {selected && !selected.presente && (
                                  <Input placeholder="Justificativa da ausência" value={selected.justificativa_ausencia || ''} onChange={(e) => handleJustificativaChange(int.id, e.target.value)} className="text-xs ml-6" />
                                )}
                              </div>
                            )
                          })}
                        </div>
                  </div>

                      <Button onClick={handleIniciarAssistente} className="w-full" disabled={uploading}>
                        <FilePen className="w-4 h-4 mr-2" />Iniciar Assistente de Redação
                  </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Minhas Atas</CardTitle>
                <CardDescription>Acompanhe o status das suas atas</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Carregando...</p>
                  </div>
                ) : atas.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Nenhuma ata encontrada</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {atas.map((ata) => (
                      <div key={ata.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{ata.numero_sessao} Sessão {ata.tipo_sessao}</h3>
                            <p className="text-sm text-gray-600">
                              {ata.data_reuniao} às {ata.horario_reuniao} | Modo: {ata.modo_criacao === 'AUDIO' ? 'Áudio' : ata.modo_criacao === 'TRANSCRICAO' ? 'Transcrição' : 'Manual'}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getStatusBadge(ata.status)}
                            {ata.status === 'CONCLUIDO' && (
                              <Button size="sm" variant="outline" onClick={() => navigate(`/editor/${ata.id}`)}>
                                <Eye className="w-4 h-4 mr-1" />Ver Ata
                              </Button>
                            )}
                          </div>
                        </div>
                        {ata.status === 'PROCESSANDO' && (
                          <div className="mt-3">
                            <Progress value={65} />
                            <p className="text-xs text-gray-500 mt-1">Processando...</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
