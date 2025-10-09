import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft, Save, Download, FileText, Plus, Trash2, 
  FileDown, FilePlus, Edit3, Eye
} from 'lucide-react'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, ImageRun } from 'docx'
import { saveAs } from 'file-saver'
import { toast } from 'sonner'

export default function EditorAtaEstruturado() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [ata, setAta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Seções estruturadas da ata
  const [cabecalho, setCabecalho] = useState({
    titulo: '',
    dataReuniao: '',
    horario: '',
    local: '',
    presidente: '',
    participantes: ''
  })

  const [pautas, setPautas] = useState([
    {
      numero: 1,
      titulo: '',
      descricao: '',
      deliberacao: ''
    }
  ])

  const [assuntosGerais, setAssuntosGerais] = useState('')
  const [encerramento, setEncerramento] = useState('')

  // Carregar dados da ata
  useEffect(() => {
    const loadAta = async () => {
      try {
        const { data, error } = await supabase
          .from('atas')
          .select('*')
          .eq('id', id)
          .single()

        if (error) {
          console.error('Erro ao buscar ata:', error)
          toast.error('Ata não encontrada')
          navigate('/dashboard')
          return
        }

        if (!data) {
          toast.error('Ata não encontrada')
          navigate('/dashboard')
          return
        }

        if (data.user_id !== user.id) {
          toast.error('Você não tem permissão para editar esta ata')
          navigate('/dashboard')
          return
        }

        setAta(data)
        
        // Parse do conteúdo markdown para estrutura editável
        if (data.rascunho_gerado) {
          parseMarkdownToSections(data.rascunho_gerado)
        } else {
          // Inicializar com dados básicos
          setCabecalho(prev => ({
            ...prev,
            titulo: `ATA DA ${data.numero_sessao} SESSÃO ${data.tipo_sessao.toUpperCase()}`,
            dataReuniao: data.data_reuniao || '',
            horario: data.horario_reuniao || ''
          }))
        }
      } catch (err) {
        console.error('Erro ao carregar ata:', err)
        const errorMessage = err?.message || err?.error?.message || 'Erro desconhecido'
        toast.error('Erro ao carregar ata: ' + errorMessage)
      } finally {
        setLoading(false)
      }
    }

    if (id && user) {
      loadAta()
    }
  }, [id, user, navigate])

  // Parse do markdown para seções estruturadas
  const parseMarkdownToSections = (markdown) => {
    const lines = markdown.split('\n')
    let currentSection = 'cabecalho'
    let pautasTemp = []
    let currentPauta = null
    let cabecalhoTemp = { ...cabecalho }
    let assuntosTemp = ''
    let encerramentoTemp = ''

    lines.forEach((line, index) => {
      const trimmed = line.trim()
      
      // Detectar título principal
      if (trimmed.startsWith('# ATA DA') || trimmed.startsWith('ATA DA')) {
        cabecalhoTemp.titulo = trimmed.replace(/^#\s*/, '')
        currentSection = 'cabecalho'
      }
      // Detectar pautas
      else if (/^PAUTA\s+\d+:/i.test(trimmed) || /^PAUTA\s+\d+\s*-/i.test(trimmed)) {
        if (currentPauta) {
          pautasTemp.push(currentPauta)
        }
        const pautaMatch = trimmed.match(/^PAUTA\s+(\d+)[:\s-]+(.+)/i)
        currentPauta = {
          numero: pautaMatch ? parseInt(pautaMatch[1]) : pautasTemp.length + 1,
          titulo: pautaMatch ? pautaMatch[2] : trimmed,
          descricao: '',
          deliberacao: ''
        }
        currentSection = 'pauta'
      }
      // Detectar assuntos gerais
      else if (/assuntos?\s+gerais?/i.test(trimmed)) {
        if (currentPauta) {
          pautasTemp.push(currentPauta)
          currentPauta = null
        }
        currentSection = 'assuntos_gerais'
      }
      // Detectar encerramento
      else if (/nada mais havendo/i.test(trimmed) || /lavrei a presente ata/i.test(trimmed)) {
        currentSection = 'encerramento'
        encerramentoTemp += line + '\n'
      }
      // Conteúdo
      else if (trimmed) {
        if (currentSection === 'cabecalho' && index < 10) {
          if (trimmed.includes('horas')) cabecalhoTemp.horario = trimmed
          if (trimmed.includes('reuniu-se')) cabecalhoTemp.participantes += trimmed + '\n'
          if (trimmed.includes('sala')) cabecalhoTemp.local = trimmed
        } else if (currentSection === 'pauta' && currentPauta) {
          if (trimmed.toLowerCase().includes('deliberação') || 
              trimmed.toLowerCase().includes('em regime de deliberação')) {
            currentPauta.deliberacao += trimmed + '\n'
          } else {
            currentPauta.descricao += line + '\n'
          }
        } else if (currentSection === 'assuntos_gerais') {
          assuntosTemp += line + '\n'
        } else if (currentSection === 'encerramento') {
          encerramentoTemp += line + '\n'
        }
      }
    })

    if (currentPauta) {
      pautasTemp.push(currentPauta)
    }

    setCabecalho(cabecalhoTemp)
    if (pautasTemp.length > 0) {
      setPautas(pautasTemp)
    }
    setAssuntosGerais(assuntosTemp)
    setEncerramento(encerramentoTemp)
  }

  // Adicionar nova pauta
  const handleAddPauta = () => {
    setPautas([...pautas, {
      numero: pautas.length + 1,
      titulo: '',
      descricao: '',
      deliberacao: ''
    }])
  }

  // Remover pauta
  const handleRemovePauta = (index) => {
    const newPautas = pautas.filter((_, i) => i !== index)
    // Renumerar
    setPautas(newPautas.map((p, i) => ({ ...p, numero: i + 1 })))
  }

  // Atualizar pauta
  const handleUpdatePauta = (index, field, value) => {
    const newPautas = [...pautas]
    newPautas[index][field] = value
    setPautas(newPautas)
  }

  // Gerar markdown completo
  const gerarMarkdownCompleto = () => {
    let markdown = `# ${cabecalho.titulo}\n\n`
    
    if (cabecalho.dataReuniao || cabecalho.horario) {
      markdown += `${cabecalho.dataReuniao} ${cabecalho.horario}\n\n`
    }
    
    if (cabecalho.local) {
      markdown += `${cabecalho.local}\n\n`
    }
    
    if (cabecalho.participantes) {
      markdown += `${cabecalho.participantes}\n\n`
    }

    pautas.forEach(pauta => {
      markdown += `## PAUTA ${pauta.numero}: ${pauta.titulo}\n\n`
      if (pauta.descricao) {
        markdown += `${pauta.descricao}\n\n`
      }
      if (pauta.deliberacao) {
        markdown += `**Deliberação:** ${pauta.deliberacao}\n\n`
      }
    })

    if (assuntosGerais.trim()) {
      markdown += `## ASSUNTOS GERAIS\n\n${assuntosGerais}\n\n`
    }

    if (encerramento.trim()) {
      markdown += `---\n\n${encerramento}`
    }

    return markdown
  }

  // Salvar alterações
  const handleSave = async () => {
    setSaving(true)

    try {
      const markdownCompleto = gerarMarkdownCompleto()

      const { error } = await supabase
        .from('atas')
        .update({ rascunho_gerado: markdownCompleto })
        .eq('id', id)

      if (error) throw error

      toast.success('Ata salva com sucesso!')
    } catch (err) {
      console.error('Erro ao salvar:', err)
      toast.error('Erro ao salvar: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  // Exportar como TXT
  const handleExportTXT = () => {
    const markdown = gerarMarkdownCompleto()
    const blob = new Blob([markdown], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `ata_${ata.numero_sessao.replace('/', '-')}_${ata.tipo_sessao.toLowerCase()}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success('Arquivo TXT gerado!')
  }

  // Exportar como PDF
  const handleExportPDF = () => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 20
    let y = margin

    // Adicionar logo no topo (centralizada)
    try {
      const imgWidth = 50
      const imgHeight = 15
      const imgX = (pageWidth - imgWidth) / 2
      doc.addImage('/logo-sistema.png', 'PNG', imgX, y, imgWidth, imgHeight)
      y += imgHeight + 10
    } catch (err) {
      console.warn('Erro ao adicionar logo ao PDF:', err)
    }

    // Título
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    const titleLines = doc.splitTextToSize(cabecalho.titulo, pageWidth - 2 * margin)
    doc.text(titleLines, pageWidth / 2, y, { align: 'center' })
    y += titleLines.length * 7 + 10

    // Cabeçalho
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    if (cabecalho.dataReuniao || cabecalho.horario) {
      doc.text(`Data: ${cabecalho.dataReuniao} - Horário: ${cabecalho.horario}`, margin, y)
      y += 7
    }
    if (cabecalho.local) {
      const localLines = doc.splitTextToSize(cabecalho.local, pageWidth - 2 * margin)
      doc.text(localLines, margin, y)
      y += localLines.length * 5 + 5
    }
    if (cabecalho.participantes) {
      const partLines = doc.splitTextToSize(cabecalho.participantes, pageWidth - 2 * margin)
      doc.text(partLines, margin, y)
      y += partLines.length * 5 + 10
    }

    // Pautas
    pautas.forEach(pauta => {
      if (y > 270) {
        doc.addPage()
        y = margin
      }

      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text(`PAUTA ${pauta.numero}: ${pauta.titulo}`, margin, y)
      y += 8

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      
      if (pauta.descricao) {
        const descLines = doc.splitTextToSize(pauta.descricao, pageWidth - 2 * margin)
        descLines.forEach(line => {
          if (y > 270) {
            doc.addPage()
            y = margin
          }
          doc.text(line, margin, y)
          y += 5
        })
        y += 5
      }

      if (pauta.deliberacao) {
        doc.setFont('helvetica', 'bold')
        doc.text('Deliberação:', margin, y)
        y += 5
        doc.setFont('helvetica', 'normal')
        const delibLines = doc.splitTextToSize(pauta.deliberacao, pageWidth - 2 * margin)
        delibLines.forEach(line => {
          if (y > 270) {
            doc.addPage()
            y = margin
          }
          doc.text(line, margin, y)
          y += 5
        })
        y += 7
      }
    })

    // Assuntos Gerais
    if (assuntosGerais.trim()) {
      if (y > 250) {
        doc.addPage()
        y = margin
      }
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('ASSUNTOS GERAIS', margin, y)
      y += 8
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      const agLines = doc.splitTextToSize(assuntosGerais, pageWidth - 2 * margin)
      agLines.forEach(line => {
        if (y > 270) {
          doc.addPage()
          y = margin
        }
        doc.text(line, margin, y)
        y += 5
      })
    }

    // Encerramento
    if (encerramento.trim()) {
      if (y > 250) {
        doc.addPage()
        y = margin
      }
      y += 10
      const encLines = doc.splitTextToSize(encerramento, pageWidth - 2 * margin)
      encLines.forEach(line => {
        if (y > 270) {
          doc.addPage()
          y = margin
        }
        doc.text(line, margin, y)
        y += 5
      })
    }

    doc.save(`ata_${ata.numero_sessao.replace('/', '-')}_${ata.tipo_sessao.toLowerCase()}.pdf`)
    toast.success('PDF gerado com sucesso!')
  }

  // Exportar como DOCX
  const handleExportDOCX = async () => {
    const sections = []

    // Logo no topo (centralizada)
    try {
      // Buscar a imagem e converter para base64
      const response = await fetch('/logo-sistema.png')
      const blob = await response.blob()
      const reader = new FileReader()
      
      await new Promise((resolve) => {
        reader.onloadend = () => {
          const base64data = reader.result.split(',')[1]
          
          sections.push(
            new Paragraph({
              children: [
                new ImageRun({
                  data: Uint8Array.from(atob(base64data), c => c.charCodeAt(0)),
                  transformation: {
                    width: 200,
                    height: 60
                  }
                })
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 300 }
            })
          )
          resolve()
        }
        reader.readAsDataURL(blob)
      })
    } catch (err) {
      console.warn('Erro ao adicionar logo ao DOCX:', err)
    }

    // Título
    sections.push(
      new Paragraph({
        text: cabecalho.titulo,
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      })
    )

    // Cabeçalho
    if (cabecalho.dataReuniao || cabecalho.horario) {
      sections.push(
        new Paragraph({
          text: `Data: ${cabecalho.dataReuniao} - Horário: ${cabecalho.horario}`,
          spacing: { after: 100 }
        })
      )
    }

    if (cabecalho.local) {
      sections.push(
        new Paragraph({
          text: cabecalho.local,
          spacing: { after: 100 }
        })
      )
    }

    if (cabecalho.participantes) {
      cabecalho.participantes.split('\n').forEach(line => {
        if (line.trim()) {
          sections.push(
            new Paragraph({
              text: line,
              spacing: { after: 50 }
            })
          )
        }
      })
      sections.push(new Paragraph({ text: '', spacing: { after: 200 } }))
    }

    // Pautas
    pautas.forEach(pauta => {
      sections.push(
        new Paragraph({
          text: `PAUTA ${pauta.numero}: ${pauta.titulo}`,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 }
        })
      )

      if (pauta.descricao) {
        pauta.descricao.split('\n').forEach(line => {
          if (line.trim()) {
            sections.push(
              new Paragraph({
                text: line,
                spacing: { after: 50 }
              })
            )
          }
        })
      }

      if (pauta.deliberacao) {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Deliberação: ', bold: true }),
              new TextRun({ text: pauta.deliberacao })
            ],
            spacing: { before: 100, after: 200 }
          })
        )
      }
    })

    // Assuntos Gerais
    if (assuntosGerais.trim()) {
      sections.push(
        new Paragraph({
          text: 'ASSUNTOS GERAIS',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 }
        })
      )

      assuntosGerais.split('\n').forEach(line => {
        if (line.trim()) {
          sections.push(
            new Paragraph({
              text: line,
              spacing: { after: 50 }
            })
          )
        }
      })
    }

    // Encerramento
    if (encerramento.trim()) {
      sections.push(new Paragraph({ text: '', spacing: { before: 200 } }))
      encerramento.split('\n').forEach(line => {
        if (line.trim()) {
          sections.push(
            new Paragraph({
              text: line,
              spacing: { after: 50 }
            })
          )
        }
      })
    }

    const doc = new Document({
      sections: [{
        properties: {},
        children: sections
      }]
    })

    const blob = await Packer.toBlob(doc)
    saveAs(blob, `ata_${ata.numero_sessao.replace('/', '-')}_${ata.tipo_sessao.toLowerCase()}.docx`)
    toast.success('DOCX gerado com sucesso!')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!ata) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Erro</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">Ata não encontrada</p>
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
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
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
                  Editor de Ata Estruturado
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
                onClick={handleExportTXT}
              >
                <FileText className="w-4 h-4 mr-2" />
                TXT
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExportPDF}
              >
                <FileDown className="w-4 h-4 mr-2" />
                PDF
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExportDOCX}
              >
                <FilePlus className="w-4 h-4 mr-2" />
                DOCX
              </Button>
              <Button 
                size="sm" 
                onClick={handleSave}
                disabled={saving}
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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="cabecalho" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-2xl">
            <TabsTrigger value="cabecalho">Cabeçalho</TabsTrigger>
            <TabsTrigger value="pautas">Pautas</TabsTrigger>
            <TabsTrigger value="assuntos">Assuntos Gerais</TabsTrigger>
            <TabsTrigger value="encerramento">Encerramento</TabsTrigger>
          </TabsList>

          {/* CABEÇALHO */}
          <TabsContent value="cabecalho">
            <Card>
              <CardHeader>
                <CardTitle>Cabeçalho da Ata</CardTitle>
                <CardDescription>
                  Informações iniciais da ata: título, data, local e participantes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="titulo">Título da Ata</Label>
                  <Input
                    id="titulo"
                    value={cabecalho.titulo}
                    onChange={(e) => setCabecalho({ ...cabecalho, titulo: e.target.value })}
                    placeholder="ATA DA 42ª SESSÃO ORDINÁRIA DO COLEGIADO..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dataReuniao">Data da Reunião</Label>
                    <Input
                      id="dataReuniao"
                      value={cabecalho.dataReuniao}
                      onChange={(e) => setCabecalho({ ...cabecalho, dataReuniao: e.target.value })}
                      placeholder="12 de setembro de 2025"
                    />
                  </div>
                  <div>
                    <Label htmlFor="horario">Horário</Label>
                    <Input
                      id="horario"
                      value={cabecalho.horario}
                      onChange={(e) => setCabecalho({ ...cabecalho, horario: e.target.value })}
                      placeholder="às 10 horas"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="local">Local da Reunião</Label>
                  <Textarea
                    id="local"
                    value={cabecalho.local}
                    onChange={(e) => setCabecalho({ ...cabecalho, local: e.target.value })}
                    placeholder="Na sala 4125, reuniu-se o Colegiado..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="participantes">Participantes</Label>
                  <Textarea
                    id="participantes"
                    value={cabecalho.participantes}
                    onChange={(e) => setCabecalho({ ...cabecalho, participantes: e.target.value })}
                    placeholder="Estavam presentes: Professor..., Coordenador..."
                    rows={5}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PAUTAS */}
          <TabsContent value="pautas">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold">Pautas da Reunião</h2>
                  <p className="text-sm text-gray-600">
                    {pautas.length} {pautas.length === 1 ? 'pauta cadastrada' : 'pautas cadastradas'}
                  </p>
                </div>
                <Button onClick={handleAddPauta} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Pauta
                </Button>
              </div>

              {pautas.map((pauta, index) => (
                <Card key={index}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle className="text-base">
                      Pauta {pauta.numero}
                    </CardTitle>
                    {pautas.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemovePauta(index)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Título da Pauta</Label>
                      <Input
                        value={pauta.titulo}
                        onChange={(e) => handleUpdatePauta(index, 'titulo', e.target.value)}
                        placeholder="Homologação de ata, Recurso ao Colegiado, etc."
                      />
                    </div>

                    <div>
                      <Label>Descrição / Conteúdo</Label>
                      <Textarea
                        value={pauta.descricao}
                        onChange={(e) => handleUpdatePauta(index, 'descricao', e.target.value)}
                        placeholder="Detalhes da pauta, processos, discussões..."
                        rows={6}
                        className="font-mono text-sm"
                      />
                    </div>

                    <div>
                      <Label>Deliberação</Label>
                      <Textarea
                        value={pauta.deliberacao}
                        onChange={(e) => handleUpdatePauta(index, 'deliberacao', e.target.value)}
                        placeholder="Decisão tomada: Deferido, Indeferido, Aprovado por unanimidade..."
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ASSUNTOS GERAIS */}
          <TabsContent value="assuntos">
            <Card>
              <CardHeader>
                <CardTitle>Assuntos Gerais</CardTitle>
                <CardDescription>
                  Outros assuntos tratados que não fazem parte das pautas específicas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={assuntosGerais}
                  onChange={(e) => setAssuntosGerais(e.target.value)}
                  placeholder="Descreva os assuntos gerais discutidos na reunião..."
                  rows={10}
                  className="font-mono text-sm"
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ENCERRAMENTO */}
          <TabsContent value="encerramento">
            <Card>
              <CardHeader>
                <CardTitle>Encerramento e Assinaturas</CardTitle>
                <CardDescription>
                  Texto de encerramento e informações de assinatura da ata
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={encerramento}
                  onChange={(e) => setEncerramento(e.target.value)}
                  placeholder="Nada mais havendo a tratar, eu, [nome], lavrei a presente ata..."
                  rows={8}
                  className="font-mono text-sm"
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Preview */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Eye className="w-5 h-5 mr-2" />
              Pré-visualização
            </CardTitle>
            <CardDescription>
              Visualize como a ata ficará após a geração
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-white border rounded-lg p-6 max-h-96 overflow-y-auto">
              <div className="prose prose-sm max-w-none">
                {/* Logo centralizada */}
                <div className="flex justify-center mb-6">
                  <img 
                    src="/logo-sistema.png" 
                    alt="Logo Institucional" 
                    className="h-16 object-contain"
                  />
                </div>
                <h1 className="text-center text-lg font-bold">{cabecalho.titulo}</h1>
                {(cabecalho.dataReuniao || cabecalho.horario) && (
                  <p className="text-sm">{cabecalho.dataReuniao} {cabecalho.horario}</p>
                )}
                {cabecalho.local && <p className="text-sm whitespace-pre-wrap">{cabecalho.local}</p>}
                {cabecalho.participantes && <p className="text-sm whitespace-pre-wrap">{cabecalho.participantes}</p>}
                
                {pautas.map(pauta => (
                  <div key={pauta.numero} className="mt-4">
                    <h2 className="text-base font-bold">PAUTA {pauta.numero}: {pauta.titulo}</h2>
                    {pauta.descricao && <p className="text-sm whitespace-pre-wrap">{pauta.descricao}</p>}
                    {pauta.deliberacao && (
                      <p className="text-sm">
                        <strong>Deliberação:</strong> {pauta.deliberacao}
                      </p>
                    )}
                  </div>
                ))}
                
                {assuntosGerais.trim() && (
                  <div className="mt-4">
                    <h2 className="text-base font-bold">ASSUNTOS GERAIS</h2>
                    <p className="text-sm whitespace-pre-wrap">{assuntosGerais}</p>
                  </div>
                )}
                
                {encerramento.trim() && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm whitespace-pre-wrap">{encerramento}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

