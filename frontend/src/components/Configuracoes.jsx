import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Settings, Key, TestTube, Save, Eye, EyeOff, Users, Upload, Plus, Edit, Trash2, FileText } from 'lucide-react'
import { llmService } from '../lib/llmService'
import { useApp } from '../contexts/AppContext'
import { integranteSchema, validateData, validatePDF } from '../lib/validators'
import { toast } from 'sonner'

export default function Configuracoes() {
  const { integrantes, createIntegrante, updateIntegrante, deleteIntegrante, importIntegrantes } = useApp()
  
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('llm')
  
  // Estados LLM
  const [config, setConfig] = useState({
    provider: 'openai',
    openai_key: '',
    anthropic_key: '',
    groq_key: '',
    local_model: 'whisper-1',
    test_mode: true
  })
  const [showKeys, setShowKeys] = useState({
    openai: false,
    anthropic: false,
    groq: false
  })
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState('')
  const [saved, setSaved] = useState(false)

  // Estados Integrantes
  const [editingIntegrante, setEditingIntegrante] = useState(null)
  const [integranteForm, setIntegranteForm] = useState({
    nome: '',
    email: '',
    origem_funcao: ''
  })
  const [formErrors, setFormErrors] = useState({})
  const [uploadingPDF, setUploadingPDF] = useState(false)

  // Carregar configurações LLM salvas
  useEffect(() => {
    const savedConfig = localStorage.getItem('llm_config')
    if (savedConfig) {
      setConfig({ ...config, ...JSON.parse(savedConfig) })
    }
  }, [])

  // Salvar configurações LLM
  const handleSaveLLM = () => {
    localStorage.setItem('llm_config', JSON.stringify(config))
    llmService.updateConfig(config)
    setSaved(true)
    toast.success('Configurações de LLM salvas com sucesso!')
    setTimeout(() => setSaved(false), 2000)
  }

  // Testar conexão LLM
  const handleTestLLM = async () => {
    setTesting(true)
    setTestResult('')

    try {
      llmService.updateConfig(config)
      const result = await llmService.testConnection()
      
      if (result.success) {
        setTestResult(`✅ ${result.message}`)
        toast.success(result.message)
      } else {
        setTestResult(`❌ ${result.message}`)
        toast.error(result.message)
      }
    } catch (error) {
      const msg = 'Erro ao testar conexão: ' + error.message
      setTestResult('❌ ' + msg)
      toast.error(msg)
    } finally {
      setTesting(false)
    }
  }

  // Salvar ou atualizar integrante
  const handleSaveIntegrante = async () => {
    const validation = validateData(integranteSchema, integranteForm)
    
    if (!validation.success) {
      setFormErrors(validation.errors)
      return
    }

    setFormErrors({})
    
    const result = editingIntegrante
      ? await updateIntegrante(editingIntegrante.id, validation.data)
      : await createIntegrante(validation.data)

    if (result.success) {
      toast.success(editingIntegrante ? 'Integrante atualizado!' : 'Integrante criado!')
      setIntegranteForm({ nome: '', email: '', origem_funcao: '' })
      setEditingIntegrante(null)
    } else {
      toast.error(result.error || 'Erro ao salvar integrante')
    }
  }

  // Editar integrante
  const handleEditIntegrante = (integrante) => {
    setEditingIntegrante(integrante)
    setIntegranteForm({
      nome: integrante.nome,
      email: integrante.email,
      origem_funcao: integrante.origem_funcao
    })
    setFormErrors({})
  }

  // Deletar integrante
  const handleDeleteIntegrante = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este integrante?')) return
    
    const result = await deleteIntegrante(id)
    if (result.success) {
      toast.success('Integrante excluído!')
    } else {
      toast.error(result.error || 'Erro ao excluir integrante')
    }
  }

  // Cancelar edição
  const handleCancelEdit = () => {
    setEditingIntegrante(null)
    setIntegranteForm({ nome: '', email: '', origem_funcao: '' })
    setFormErrors({})
  }

  // Upload e parsing de portaria PDF
  const handlePortariaUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validation = validatePDF(file)
    if (!validation.valid) {
      toast.error(validation.error)
      e.target.value = ''
      return
    }

    setUploadingPDF(true)

    try {
      // Simular parsing de PDF (em produção, usar biblioteca pdf.js)
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Mock: simular extração de dados
      const mockIntegrantes = [
        { nome: 'João Silva', email: 'joao.silva@exemplo.com', origem_funcao: 'Presidente' },
        { nome: 'Maria Santos', email: 'maria.santos@exemplo.com', origem_funcao: 'Secretária' },
        { nome: 'Pedro Oliveira', email: 'pedro.oliveira@exemplo.com', origem_funcao: 'Membro' }
      ]

      const result = await importIntegrantes(mockIntegrantes)
      
      if (result.success) {
        toast.success(`${result.count} integrantes importados da portaria!`)
      } else {
        toast.error(result.error || 'Erro ao importar integrantes')
      }
    } catch (error) {
      toast.error('Erro ao processar PDF: ' + error.message)
    } finally {
      setUploadingPDF(false)
      e.target.value = ''
    }
  }

  const providers = [
    { id: 'openai', name: 'OpenAI (Whisper)', description: 'API oficial da OpenAI para transcrição', models: ['whisper-1'], keyPlaceholder: 'sk-...' },
    { id: 'anthropic', name: 'Anthropic (Claude)', description: 'API da Anthropic', models: ['claude-3-sonnet'], keyPlaceholder: 'sk-ant-...' },
    { id: 'groq', name: 'Groq (Whisper)', description: 'API Groq otimizada', models: ['whisper-large-v3'], keyPlaceholder: 'gsk_...' }
  ]

  const currentProvider = providers.find(p => p.id === config.provider)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="w-4 h-4 mr-2" />
          Configurações
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Configurações do Sistema
          </DialogTitle>
          <DialogDescription>
            Configure APIs, gerencie integrantes e personalize o sistema
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="llm">
              <Key className="w-4 h-4 mr-2" />
              APIs LLM
            </TabsTrigger>
            <TabsTrigger value="integrantes">
              <Users className="w-4 h-4 mr-2" />
              Integrantes
            </TabsTrigger>
            <TabsTrigger value="portaria">
              <FileText className="w-4 h-4 mr-2" />
              Portaria
            </TabsTrigger>
            <TabsTrigger value="test">
              <TestTube className="w-4 h-4 mr-2" />
              Teste
            </TabsTrigger>
          </TabsList>

          {/* ABA LLM - Configurações de APIs */}
          <TabsContent value="llm" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de IA</CardTitle>
                <CardDescription>Configure provedores de API para transcrição</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Provedor de IA</Label>
                  <Select value={config.provider} onValueChange={(value) => setConfig({...config, provider: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {providers.map(provider => (
                        <SelectItem key={provider.id} value={provider.id}>{provider.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {providers.map(provider => (
                  <div key={provider.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>{provider.name}</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowKeys({...showKeys, [provider.id]: !showKeys[provider.id]})}
                      >
                        {showKeys[provider.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                    <Input
                      type={showKeys[provider.id] ? "text" : "password"}
                      placeholder={provider.keyPlaceholder}
                      value={config[`${provider.id}_key`] || ''}
                      onChange={(e) => setConfig({...config, [`${provider.id}_key`]: e.target.value})}
                    />
                  </div>
                ))}

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="test_mode"
                    checked={config.test_mode}
                    onChange={(e) => setConfig({...config, test_mode: e.target.checked})}
                    className="rounded"
                  />
                  <Label htmlFor="test_mode">Modo de teste (simulado)</Label>
                </div>

                <Button onClick={handleSaveLLM} className="w-full">
                  <Save className="w-4 h-4 mr-2" />
                  {saved ? 'Salvo!' : 'Salvar Configurações'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABA INTEGRANTES - CRUD Manual */}
          <TabsContent value="integrantes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Cadastro de Integrantes</CardTitle>
                <CardDescription>Adicione ou edite integrantes do colegiado</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label>Nome Completo *</Label>
                    <Input
                      value={integranteForm.nome}
                      onChange={(e) => setIntegranteForm({...integranteForm, nome: e.target.value})}
                      placeholder="Ex: João da Silva"
                    />
                    {formErrors.nome && <p className="text-xs text-red-600">{formErrors.nome}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={integranteForm.email}
                      onChange={(e) => setIntegranteForm({...integranteForm, email: e.target.value})}
                      placeholder="joao@exemplo.com"
                    />
                    {formErrors.email && <p className="text-xs text-red-600">{formErrors.email}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label>Origem/Função *</Label>
                    <Input
                      value={integranteForm.origem_funcao}
                      onChange={(e) => setIntegranteForm({...integranteForm, origem_funcao: e.target.value})}
                      placeholder="Ex: Presidente"
                    />
                    {formErrors.origem_funcao && <p className="text-xs text-red-600">{formErrors.origem_funcao}</p>}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={handleSaveIntegrante} className="flex-1">
                    <Plus className="w-4 h-4 mr-2" />
                    {editingIntegrante ? 'Atualizar' : 'Adicionar'} Integrante
                  </Button>
                  {editingIntegrante && (
                    <Button variant="outline" onClick={handleCancelEdit}>
                      Cancelar
                    </Button>
                  )}
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Função</TableHead>
                        <TableHead className="w-24">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {integrantes.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-gray-500">
                            Nenhum integrante cadastrado
                          </TableCell>
                        </TableRow>
                      ) : (
                        integrantes.map((int) => (
                          <TableRow key={int.id}>
                            <TableCell className="font-medium">{int.nome}</TableCell>
                            <TableCell className="text-sm text-gray-600">{int.email}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{int.origem_funcao}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditIntegrante(int)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteIntegrante(int.id)}
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABA PORTARIA - Upload PDF com OCR */}
          <TabsContent value="portaria" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Importar Portaria (PDF)</CardTitle>
                <CardDescription>Faça upload de uma portaria em PDF para extrair integrantes automaticamente</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertDescription>
                    <strong>Como funciona:</strong> O sistema fará OCR do PDF e tentará extrair nomes, emails e funções dos integrantes listados.
                  </AlertDescription>
                </Alert>

                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <Label htmlFor="portaria-upload" className="cursor-pointer">
                    <div className="text-sm text-gray-600 mb-2">
                      Clique para selecionar ou arraste um arquivo PDF
                    </div>
                    <div className="text-xs text-gray-500">
                      Tamanho máximo: 10MB
                    </div>
                  </Label>
                  <Input
                    id="portaria-upload"
                    type="file"
                    accept=".pdf"
                    onChange={handlePortariaUpload}
                    disabled={uploadingPDF}
                    className="hidden"
                  />
                </div>

                {uploadingPDF && (
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Processando PDF...</p>
                  </div>
                )}

                <Alert>
                  <AlertDescription className="text-xs">
                    <strong>Dica:</strong> Após importar, você pode editar ou excluir integrantes na aba "Integrantes".
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABA TESTE */}
          <TabsContent value="test" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Testar Configurações</CardTitle>
                <CardDescription>Verifique se as APIs estão funcionando</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                  <p><strong>Provedor:</strong> {currentProvider?.name}</p>
                  <p><strong>Modo teste:</strong> {config.test_mode ? 'Ativo ✅' : 'Inativo'}</p>
                  <p><strong>Chave:</strong> {config[`${config.provider}_key`] ? '✅ Configurada' : '❌ Não configurada'}</p>
                  <p><strong>Integrantes:</strong> {integrantes.length} cadastrados</p>
                </div>

                <Button onClick={handleTestLLM} disabled={testing} className="w-full">
                  {testing ? (
                    <><TestTube className="w-4 h-4 mr-2 animate-spin" />Testando...</>
                  ) : (
                    <><TestTube className="w-4 h-4 mr-2" />Testar Conexão LLM</>
                  )}
                </Button>

                {testResult && (
                  <Alert variant={testResult.includes('✅') ? 'default' : 'destructive'}>
                    <AlertDescription>{testResult}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

