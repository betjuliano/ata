import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Settings, Key, TestTube, Save, Eye, EyeOff } from 'lucide-react'
import { llmService } from '../lib/llmService'

export default function ConfiguracaoLLM() {
  const [isOpen, setIsOpen] = useState(false)
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

  // Carregar configurações salvas
  useEffect(() => {
    const savedConfig = localStorage.getItem('llm_config')
    if (savedConfig) {
      setConfig({ ...config, ...JSON.parse(savedConfig) })
    }
  }, [])

  // Salvar configurações
  const handleSave = () => {
    localStorage.setItem('llm_config', JSON.stringify(config))
    llmService.updateConfig(config)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  // Testar conexão com a API
  const handleTest = async () => {
    setTesting(true)
    setTestResult('')

    try {
      // Atualizar configuração no serviço
      llmService.updateConfig(config)
      
      // Testar conexão
      const result = await llmService.testConnection()
      
      if (result.success) {
        setTestResult(`✅ ${result.message}`)
      } else {
        setTestResult(`❌ ${result.message}`)
      }
    } catch (error) {
      setTestResult('❌ Erro ao testar conexão: ' + error.message)
    } finally {
      setTesting(false)
    }
  }

  const providers = [
    {
      id: 'openai',
      name: 'OpenAI (Whisper)',
      description: 'API oficial da OpenAI para transcrição de áudio',
      models: ['whisper-1'],
      keyPlaceholder: 'sk-...'
    },
    {
      id: 'anthropic',
      name: 'Anthropic (Claude)',
      description: 'API da Anthropic - Requer conversão de áudio para texto primeiro',
      models: ['claude-3-sonnet', 'claude-3-haiku'],
      keyPlaceholder: 'sk-ant-...'
    },
    {
      id: 'groq',
      name: 'Groq (Whisper)',
      description: 'API Groq com modelos Whisper otimizados',
      models: ['whisper-large-v3', 'whisper-large-v2'],
      keyPlaceholder: 'gsk_...'
    }
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
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Configurações de LLM
          </DialogTitle>
          <DialogDescription>
            Configure as chaves de API para transcrição de áudio e geração de atas
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="provider" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="provider">Provedor</TabsTrigger>
            <TabsTrigger value="keys">Chaves API</TabsTrigger>
            <TabsTrigger value="test">Teste</TabsTrigger>
          </TabsList>

          <TabsContent value="provider" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Selecionar Provedor de IA</CardTitle>
                <CardDescription>
                  Escolha o serviço de IA para transcrição de áudio
                </CardDescription>
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
                        <SelectItem key={provider.id} value={provider.id}>
                          {provider.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {currentProvider && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900">{currentProvider.name}</h4>
                    <p className="text-sm text-blue-700 mt-1">{currentProvider.description}</p>
                    <div className="mt-2">
                      <Label className="text-sm text-blue-800">Modelos disponíveis:</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {currentProvider.models.map(model => (
                          <span key={model} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            {model}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="test_mode"
                    checked={config.test_mode}
                    onChange={(e) => setConfig({...config, test_mode: e.target.checked})}
                    className="rounded"
                  />
                  <Label htmlFor="test_mode" className="text-sm">
                    Modo de teste (usar transcrição simulada)
                  </Label>
                </div>
                
                {config.test_mode && (
                  <Alert>
                    <AlertDescription>
                      No modo de teste, o sistema gerará transcrições simuladas sem usar APIs externas.
                      Ideal para desenvolvimento e demonstrações.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="keys" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Chaves de API</CardTitle>
                <CardDescription>
                  Configure suas chaves de API para os diferentes provedores
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {providers.map(provider => (
                  <div key={provider.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`${provider.id}_key`}>{provider.name}</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowKeys({...showKeys, [provider.id]: !showKeys[provider.id]})}
                      >
                        {showKeys[provider.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                    <div className="relative">
                      <Key className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <Input
                        id={`${provider.id}_key`}
                        type={showKeys[provider.id] ? "text" : "password"}
                        placeholder={provider.keyPlaceholder}
                        value={config[`${provider.id}_key`] || ''}
                        onChange={(e) => setConfig({...config, [`${provider.id}_key`]: e.target.value})}
                        className="pl-10"
                      />
                    </div>
                    <p className="text-xs text-gray-500">{provider.description}</p>
                  </div>
                ))}

                <Alert>
                  <AlertDescription>
                    <strong>Segurança:</strong> As chaves são armazenadas localmente no seu navegador e não são enviadas para servidores externos.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="test" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Testar Configuração</CardTitle>
                <CardDescription>
                  Verifique se suas configurações estão funcionando corretamente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium">Configuração Atual</h4>
                  <div className="mt-2 space-y-1 text-sm">
                    <p><strong>Provedor:</strong> {currentProvider?.name}</p>
                    <p><strong>Modo de teste:</strong> {config.test_mode ? 'Ativo' : 'Inativo'}</p>
                    <p><strong>Chave configurada:</strong> {config[`${config.provider}_key`] ? '✅ Sim' : '❌ Não'}</p>
                  </div>
                </div>

                <Button onClick={handleTest} disabled={testing} className="w-full">
                  {testing ? (
                    <>
                      <TestTube className="w-4 h-4 mr-2 animate-spin" />
                      Testando...
                    </>
                  ) : (
                    <>
                      <TestTube className="w-4 h-4 mr-2" />
                      Testar Conexão
                    </>
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

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} className="flex items-center">
            <Save className="w-4 h-4 mr-2" />
            {saved ? 'Salvo!' : 'Salvar Configurações'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}