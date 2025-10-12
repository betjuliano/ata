import { z } from 'zod'

// Regex para validar email (RFC 5322 simplificado)
const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

// Schema para Integrante
export const integranteSchema = z.object({
  nome: z.string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim(),
  email: z.string()
    .regex(emailRegex, 'Email inválido')
    .toLowerCase()
    .trim(),
  origem_funcao: z.string()
    .min(2, 'Origem/Função deve ter no mínimo 2 caracteres')
    .max(100, 'Origem/Função deve ter no máximo 100 caracteres')
    .trim()
})

// Schema para Pauta
export const pautaSchema = z.object({
  tema: z.string()
    .min(3, 'Tema deve ter no mínimo 3 caracteres')
    .max(200, 'Tema deve ter no máximo 200 caracteres')
    .trim(),
  descricao: z.string()
    .min(5, 'Descrição deve ter no mínimo 5 caracteres')
    .max(2000, 'Descrição deve ter no máximo 2000 caracteres')
    .trim(),
  reuniao_prevista: z.string()
    .regex(/^(0[1-9]|1[0-2])\/\d{4}$/, 'Formato deve ser MM/AAAA (ex: 09/2025)')
    .trim(),
  status: z.enum(['PENDENTE', 'DISCUTIDA', 'APROVADA'], {
    errorMap: () => ({ message: 'Status inválido' })
  })
})

// Schema para Convocação
export const convocacaoSchema = z.object({
  titulo: z.string()
    .min(5, 'Título deve ter no mínimo 5 caracteres')
    .max(200, 'Título deve ter no máximo 200 caracteres')
    .trim(),
  formato: z.enum(['PRESENCIAL', 'VIRTUAL', 'HIBRIDO'], {
    errorMap: () => ({ message: 'Formato inválido' })
  }),
  data_reuniao: z.string()
    .regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Formato deve ser DD/MM/AAAA')
    .refine((date) => {
      const [day, month, year] = date.split('/').map(Number)
      const inputDate = new Date(year, month - 1, day)
      return inputDate >= new Date(new Date().setHours(0, 0, 0, 0))
    }, 'Data não pode ser no passado'),
  horario: z.string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato deve ser HH:MM (ex: 14:30)')
    .trim(),
  pautas_texto: z.string()
    .min(10, 'Pautas devem ter no mínimo 10 caracteres')
    .max(5000, 'Pautas devem ter no máximo 5000 caracteres')
    .trim()
})

// Schema para Ata (modo manual, áudio e transcrição)
export const ataSchema = z.object({
  numero_sessao: z.string()
    .min(1, 'Número da sessão é obrigatório')
    .max(50, 'Número da sessão deve ter no máximo 50 caracteres')
    .trim(),
  tipo_sessao: z.enum(['Ordinária', 'Extraordinária'], {
    errorMap: () => ({ message: 'Tipo de sessão inválido' })
  }),
  data_reuniao: z.string()
    .regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Formato deve ser DD/MM/AAAA'),
  horario_reuniao: z.string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato deve ser HH:MM'),
  modo_criacao: z.enum(['AUDIO', 'TRANSCRICAO', 'MANUAL']),
  pauta_id: z.number().optional(),
  pauta_texto: z.string().optional(),
  transcricao_texto: z.string().optional(),
  integrantes: z.array(z.object({
    integrante_id: z.number(),
    presente: z.boolean(),
    justificativa_ausencia: z.string().optional()
  })).min(1, 'Selecione pelo menos um integrante')
})

// Schema para item de pauta na redação
export const itemPautaAtaSchema = z.object({
  pauta_tema: z.string().min(1, 'Tema da pauta é obrigatório'),
  transcricao_trecho: z.string()
    .min(10, 'Transcrição deve ter no mínimo 10 caracteres')
    .max(5000, 'Transcrição deve ter no máximo 5000 caracteres'),
  deliberacao: z.string().optional(),
  observacoes: z.string().optional()
})

// Função helper para validar e retornar erros formatados
export function validateData(schema, data) {
  try {
    const validated = schema.parse(data)
    return { success: true, data: validated, errors: null }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.reduce((acc, err) => {
        const path = err.path.join('.')
        acc[path] = err.message
        return acc
      }, {})
      return { success: false, data: null, errors: formattedErrors }
    }
    return { success: false, data: null, errors: { _global: 'Erro de validação' } }
  }
}

// Validador de portaria PDF (verificar se é PDF válido)
export function validatePDF(file) {
  if (!file) {
    return { valid: false, error: 'Nenhum arquivo selecionado' }
  }
  
  if (file.type !== 'application/pdf') {
    return { valid: false, error: 'Arquivo deve ser um PDF' }
  }
  
  // Limite de 10MB
  if (file.size > 10 * 1024 * 1024) {
    return { valid: false, error: 'Arquivo deve ter no máximo 10MB' }
  }
  
  return { valid: true, error: null }
}

// Validador de arquivo de áudio
export function validateAudio(file) {
  if (!file) {
    return { valid: false, error: 'Nenhum arquivo selecionado' }
  }
  
  const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-m4a']
  if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|m4a)$/i)) {
    return { valid: false, error: 'Arquivo deve ser MP3, WAV ou M4A' }
  }
  
  // Limite de 100MB
  if (file.size > 100 * 1024 * 1024) {
    return { valid: false, error: 'Arquivo deve ter no máximo 100MB' }
  }
  
  return { valid: true, error: null }
}

// Validador de documento de pauta
export function validatePautaDocument(file) {
  if (!file) {
    return { valid: false, error: 'Nenhum arquivo selecionado' }
  }
  
  const validTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
  
  if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|doc|docx)$/i)) {
    return { valid: false, error: 'Arquivo deve ser PDF, DOC ou DOCX' }
  }
  
  // Limite de 10MB
  if (file.size > 10 * 1024 * 1024) {
    return { valid: false, error: 'Arquivo deve ter no máximo 10MB' }
  }
  
  return { valid: true, error: null }
}

