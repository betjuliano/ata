import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Save, Download, FileText, Edit } from 'lucide-react'

export default function EditorAta() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [ata, setAta] = useState(null)
  const [conteudo, setConteudo] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Carregar dados da ata
  useEffect(() => {
    const loadAta = async () => {
      try {
        const { data, error } = await supabase
          .from('atas')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error

        if (!data) {
          setError('Ata não encontrada')
          return
        }

        if (data.user_id !== user.id) {
          setError('Você não tem permissão para editar esta ata')
          return
        }

        if (data.status !== 'CONCLUIDO') {
          setError('Esta ata ainda não foi processada')
          return
        }

        setAta(data)
        setConteudo(data.rascunho_gerado || '')
      } catch (err) {
        setError('Erro ao carregar ata: ' + err.message)
      } finally {
        setLoading(false)
      }
    }

    if (id && user) {
      loadAta()
    }
  }, [id, user])

  // Salvar alterações
  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const { error } = await supabase
        .from('atas')
        .update({ rascunho_gerado: conteudo })
        .eq('id', id)

      if (error) throw error

      setSuccess('Ata salva com sucesso!')
      
      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Erro ao salvar: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  // Exportar como texto
  const handleExport = () => {
    const blob = new Blob([conteudo], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `ata_${ata.numero_sessao}_sessao_${ata.tipo_sessao.toLowerCase()}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error && !ata) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Erro</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => navigate('/dashboard')} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/dashboard')}
                className="mr-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <img 
                src="/logo-sistema.png" 
                alt="Logo" 
                className="w-10 h-10 object-contain mr-3"
              />
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Editor de Ata
                </h1>
                <p className="text-sm text-gray-600">
                  {ata?.numero_sessao} Sessão {ata?.tipo_sessao}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExport}
                disabled={!conteudo.trim()}
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
              <Button 
                size="sm" 
                onClick={handleSave}
                disabled={saving || !conteudo.trim()}
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alertas */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Editor */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Edit className="w-5 h-5 mr-2" />
              Editar Conteúdo da Ata
            </CardTitle>
            <CardDescription>
              Revise e edite o conteúdo gerado automaticamente. Suas alterações serão salvas automaticamente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Informações da Ata */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-gray-600">Sessão</label>
                  <p className="text-sm text-gray-900">{ata?.numero_sessao}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Tipo</label>
                  <p className="text-sm text-gray-900">{ata?.tipo_sessao}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Data de Criação</label>
                  <p className="text-sm text-gray-900">
                    {ata?.created_at ? new Date(ata.created_at).toLocaleDateString('pt-BR') : '-'}
                  </p>
                </div>
              </div>

              {/* Editor de Texto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Conteúdo da Ata
                </label>
                <Textarea
                  value={conteudo}
                  onChange={(e) => setConteudo(e.target.value)}
                  placeholder="O conteúdo da ata aparecerá aqui após o processamento..."
                  className="min-h-[600px] font-mono text-sm"
                  style={{ whiteSpace: 'pre-wrap' }}
                />
                <p className="text-xs text-gray-500 mt-2">
                  {conteudo.length} caracteres
                </p>
              </div>

              {/* Dicas de Edição */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-800 mb-2">Dicas de Edição</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Revise os nomes dos participantes e cargos</li>
                  <li>• Verifique se todas as deliberações estão corretas</li>
                  <li>• Confirme os números dos processos mencionados</li>
                  <li>• Ajuste a formatação conforme necessário</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
