import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useApp } from '../contexts/AppContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { FileText, LogOut, Plus, Edit, Trash2, Send, Filter, ArrowLeft } from 'lucide-react'
import { pautaSchema, validateData } from '../lib/validators'
import { toast } from 'sonner'
import Convocacao from './Convocacao'

export default function Pautas() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { pautas, createPauta, updatePauta, deletePauta, loadPautas } = useApp()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isConvocacaoOpen, setIsConvocacaoOpen] = useState(false)
  const [editingPauta, setEditingPauta] = useState(null)
  const [filterStatus, setFilterStatus] = useState('TODAS')
  const [searchTerm, setSearchTerm] = useState('')

  const [pautaForm, setPautaForm] = useState({
    tema: '',
    descricao: '',
    reuniao_prevista: '',
    status: 'PENDENTE'
  })
  const [formErrors, setFormErrors] = useState({})

  // Recarregar pautas ao montar
  useEffect(() => {
    loadPautas()
  }, [])

  // Filtrar pautas
  const filteredPautas = pautas.filter(pauta => {
    const matchStatus = filterStatus === 'TODAS' || pauta.status === filterStatus
    const matchSearch = !searchTerm || 
      pauta.tema.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pauta.descricao.toLowerCase().includes(searchTerm.toLowerCase())
    return matchStatus && matchSearch
  })

  // Abrir formulário para nova pauta
  const handleNovaPauta = () => {
    setEditingPauta(null)
    setPautaForm({ tema: '', descricao: '', reuniao_prevista: '', status: 'PENDENTE' })
    setFormErrors({})
    setIsDialogOpen(true)
  }

  // Abrir formulário para editar pauta
  const handleEditPauta = (pauta) => {
    setEditingPauta(pauta)
    setPautaForm({
      tema: pauta.tema,
      descricao: pauta.descricao,
      reuniao_prevista: pauta.reuniao_prevista,
      status: pauta.status
    })
    setFormErrors({})
    setIsDialogOpen(true)
  }

  // Salvar pauta (criar ou atualizar)
  const handleSavePauta = async () => {
    const validation = validateData(pautaSchema, pautaForm)
    
    if (!validation.success) {
      setFormErrors(validation.errors)
      return
    }

    setFormErrors({})

    const result = editingPauta
      ? await updatePauta(editingPauta.id, validation.data)
      : await createPauta(validation.data)

    if (result.success) {
      toast.success(editingPauta ? 'Pauta atualizada!' : 'Pauta criada!')
      setIsDialogOpen(false)
      setPautaForm({ tema: '', descricao: '', reuniao_prevista: '', status: 'PENDENTE' })
      setEditingPauta(null)
    } else {
      toast.error(result.error || 'Erro ao salvar pauta')
    }
  }

  // Deletar pauta
  const handleDeletePauta = async (id) => {
    if (!confirm('Tem certeza que deseja excluir esta pauta?')) return

    const result = await deletePauta(id)
    if (result.success) {
      toast.success('Pauta excluída!')
    } else {
      toast.error(result.error || 'Erro ao excluir pauta')
    }
  }

  // Badge de status
  const getStatusBadge = (status) => {
    const variants = {
      'PENDENTE': { variant: 'secondary', label: 'Pendente' },
      'DISCUTIDA': { variant: 'default', label: 'Discutida' },
      'APROVADA': { variant: 'success', label: 'Aprovada' }
    }
    const config = variants[status] || variants['PENDENTE']
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const handleLogout = async () => {
    await signOut()
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
                Dashboard
              </Button>
              <img 
                src="/logo-sistema.png" 
                alt="Logo" 
                className="w-10 h-10 object-contain mr-3"
              />
              <h1 className="text-xl font-semibold text-gray-900">
                Gestão de Pautas
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Barra de Ações */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex-1 w-full md:w-auto">
            <Input
              placeholder="Buscar por tema ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODAS">Todas</SelectItem>
                <SelectItem value="PENDENTE">Pendentes</SelectItem>
                <SelectItem value="DISCUTIDA">Discutidas</SelectItem>
                <SelectItem value="APROVADA">Aprovadas</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={handleNovaPauta}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Pauta
            </Button>

            <Convocacao />
          </div>
        </div>

        {/* Lista de Pautas */}
        <div className="grid grid-cols-1 gap-4">
          {filteredPautas.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma pauta encontrada
                </h3>
                <p className="text-gray-600 mb-4">
                  {filterStatus !== 'TODAS' || searchTerm
                    ? 'Tente ajustar os filtros ou busca'
                    : 'Crie sua primeira pauta para começar'}
                </p>
                {filterStatus === 'TODAS' && !searchTerm && (
                  <Button onClick={handleNovaPauta}>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Primeira Pauta
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredPautas.map((pauta) => (
              <Card key={pauta.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusBadge(pauta.status)}
                        <span className="text-sm text-gray-500">
                          Previsto: {pauta.reuniao_prevista}
                        </span>
                      </div>
                      <CardTitle className="text-lg">{pauta.tema}</CardTitle>
                      <CardDescription className="mt-2">
                        {pauta.descricao}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditPauta(pauta)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePauta(pauta.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Dialog para Criar/Editar Pauta */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingPauta ? 'Editar Pauta' : 'Nova Pauta'}
            </DialogTitle>
            <DialogDescription>
              Preencha as informações da pauta para reunião
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tema">Tema (Tópico da Ata) *</Label>
              <Input
                id="tema"
                value={pautaForm.tema}
                onChange={(e) => setPautaForm({...pautaForm, tema: e.target.value})}
                placeholder="Ex: Homologação de Planos de Ensino 2025/2"
              />
              {formErrors.tema && <p className="text-xs text-red-600">{formErrors.tema}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição (Detalhes da Pauta) *</Label>
              <Textarea
                id="descricao"
                value={pautaForm.descricao}
                onChange={(e) => setPautaForm({...pautaForm, descricao: e.target.value})}
                placeholder="Descreva os detalhes e itens desta pauta..."
                className="min-h-[120px]"
              />
              {formErrors.descricao && <p className="text-xs text-red-600">{formErrors.descricao}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reuniao_prevista">Reunião Prevista (MM/AAAA) *</Label>
                <Input
                  id="reuniao_prevista"
                  value={pautaForm.reuniao_prevista}
                  onChange={(e) => setPautaForm({...pautaForm, reuniao_prevista: e.target.value})}
                  placeholder="Ex: 09/2025"
                  maxLength={7}
                />
                {formErrors.reuniao_prevista && <p className="text-xs text-red-600">{formErrors.reuniao_prevista}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select value={pautaForm.status} onValueChange={(value) => setPautaForm({...pautaForm, status: value})}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDENTE">Pendente</SelectItem>
                    <SelectItem value="DISCUTIDA">Discutida</SelectItem>
                    <SelectItem value="APROVADA">Aprovada</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.status && <p className="text-xs text-red-600">{formErrors.status}</p>}
              </div>
            </div>

            <Alert>
              <AlertDescription className="text-xs">
                <strong>Dica:</strong> Apenas pautas com status "Aprovada" poderão ser utilizadas nas atas.
              </AlertDescription>
            </Alert>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSavePauta}>
              {editingPauta ? 'Atualizar' : 'Criar'} Pauta
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

