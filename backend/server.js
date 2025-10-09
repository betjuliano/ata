import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const prisma = new PrismaClient()
const PORT = process.env.PORT || 3001

// Middlewares
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000' }))
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Configuração do Multer para upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/')
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({ storage })

// Middleware de Autenticação
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  
  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' })
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.userId = decoded.userId
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' })
  }
}

// ============= ROTAS DE AUTENTICAÇÃO =============

// Registrar usuário
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, senha, nomeCompleto, cargo, colegiado } = req.body
    
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return res.status(400).json({ error: 'Email já cadastrado' })
    }
    
    const hashedPassword = await bcrypt.hash(senha, 10)
    
    const user = await prisma.user.create({
      data: {
        email,
        senha: hashedPassword,
        nomeCompleto,
        cargo,
        colegiado
      }
    })
    
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' })
    
    res.json({
      user: { id: user.id, email: user.email, nomeCompleto: user.nomeCompleto },
      token
    })
  } catch (error) {
    console.error('Erro no signup:', error)
    res.status(500).json({ error: 'Erro ao criar usuário' })
  }
})

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, senha } = req.body
    
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return res.status(401).json({ error: 'Email ou senha incorretos' })
    }
    
    const validPassword = await bcrypt.compare(senha, user.senha)
    if (!validPassword) {
      return res.status(401).json({ error: 'Email ou senha incorretos' })
    }
    
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' })
    
    res.json({
      user: { id: user.id, email: user.email, nomeCompleto: user.nomeCompleto },
      token
    })
  } catch (error) {
    console.error('Erro no login:', error)
    res.status(500).json({ error: 'Erro ao fazer login' })
  }
})

// Obter usuário atual
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, nomeCompleto: true, cargo: true, colegiado: true }
    })
    res.json(user)
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar usuário' })
  }
})

// ============= ROTAS DE ATAS =============

// Listar atas do usuário
app.get('/api/atas', authMiddleware, async (req, res) => {
  try {
    const atas = await prisma.ata.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      include: { pauta: true }
    })
    res.json(atas)
  } catch (error) {
    console.error('Erro ao listar atas:', error)
    res.status(500).json({ error: 'Erro ao listar atas' })
  }
})

// Buscar ata por ID
app.get('/api/atas/:id', authMiddleware, async (req, res) => {
  try {
    const ata = await prisma.ata.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { pauta: true, user: { select: { email: true, nomeCompleto: true } } }
    })
    
    if (!ata) {
      return res.status(404).json({ error: 'Ata não encontrada' })
    }
    
    if (ata.userId !== req.userId) {
      return res.status(403).json({ error: 'Sem permissão' })
    }
    
    res.json(ata)
  } catch (error) {
    console.error('Erro ao buscar ata:', error)
    res.status(500).json({ error: 'Erro ao buscar ata' })
  }
})

// Criar ata
app.post('/api/atas', authMiddleware, async (req, res) => {
  try {
    const ata = await prisma.ata.create({
      data: {
        ...req.body,
        userId: req.userId
      }
    })
    res.json(ata)
  } catch (error) {
    console.error('Erro ao criar ata:', error)
    res.status(500).json({ error: 'Erro ao criar ata' })
  }
})

// Atualizar ata
app.put('/api/atas/:id', authMiddleware, async (req, res) => {
  try {
    const ata = await prisma.ata.findUnique({ where: { id: parseInt(req.params.id) } })
    
    if (!ata || ata.userId !== req.userId) {
      return res.status(403).json({ error: 'Sem permissão' })
    }
    
    const updated = await prisma.ata.update({
      where: { id: parseInt(req.params.id) },
      data: req.body
    })
    
    res.json(updated)
  } catch (error) {
    console.error('Erro ao atualizar ata:', error)
    res.status(500).json({ error: 'Erro ao atualizar ata' })
  }
})

// Deletar ata
app.delete('/api/atas/:id', authMiddleware, async (req, res) => {
  try {
    const ata = await prisma.ata.findUnique({ where: { id: parseInt(req.params.id) } })
    
    if (!ata || ata.userId !== req.userId) {
      return res.status(403).json({ error: 'Sem permissão' })
    }
    
    await prisma.ata.delete({ where: { id: parseInt(req.params.id) } })
    res.json({ message: 'Ata deletada' })
  } catch (error) {
    console.error('Erro ao deletar ata:', error)
    res.status(500).json({ error: 'Erro ao deletar ata' })
  }
})

// ============= ROTAS DE INTEGRANTES =============

app.get('/api/integrantes', authMiddleware, async (req, res) => {
  try {
    const integrantes = await prisma.integrante.findMany({
      where: { userId: req.userId },
      orderBy: { nome: 'asc' }
    })
    res.json(integrantes)
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar integrantes' })
  }
})

app.post('/api/integrantes', authMiddleware, async (req, res) => {
  try {
    const integrante = await prisma.integrante.create({
      data: { ...req.body, userId: req.userId }
    })
    res.json(integrante)
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar integrante' })
  }
})

app.put('/api/integrantes/:id', authMiddleware, async (req, res) => {
  try {
    const integrante = await prisma.integrante.update({
      where: { id: parseInt(req.params.id) },
      data: req.body
    })
    res.json(integrante)
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar integrante' })
  }
})

app.delete('/api/integrantes/:id', authMiddleware, async (req, res) => {
  try {
    await prisma.integrante.delete({ where: { id: parseInt(req.params.id) } })
    res.json({ message: 'Integrante deletado' })
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar integrante' })
  }
})

// ============= ROTAS DE PAUTAS =============

app.get('/api/pautas', authMiddleware, async (req, res) => {
  try {
    const pautas = await prisma.pauta.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' }
    })
    res.json(pautas)
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar pautas' })
  }
})

app.post('/api/pautas', authMiddleware, async (req, res) => {
  try {
    const pauta = await prisma.pauta.create({
      data: { ...req.body, userId: req.userId }
    })
    res.json(pauta)
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar pauta' })
  }
})

app.put('/api/pautas/:id', authMiddleware, async (req, res) => {
  try {
    const pauta = await prisma.pauta.update({
      where: { id: parseInt(req.params.id) },
      data: req.body
    })
    res.json(pauta)
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar pauta' })
  }
})

app.delete('/api/pautas/:id', authMiddleware, async (req, res) => {
  try {
    await prisma.pauta.delete({ where: { id: parseInt(req.params.id) } })
    res.json({ message: 'Pauta deletada' })
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar pauta' })
  }
})

// ============= ROTAS DE CONVOCAÇÕES =============

app.get('/api/convocacoes', authMiddleware, async (req, res) => {
  try {
    const convocacoes = await prisma.convocacao.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' }
    })
    res.json(convocacoes)
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar convocações' })
  }
})

app.post('/api/convocacoes', authMiddleware, async (req, res) => {
  try {
    const convocacao = await prisma.convocacao.create({
      data: { ...req.body, userId: req.userId }
    })
    res.json(convocacao)
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar convocação' })
  }
})

// ============= UPLOAD DE ARQUIVOS =============

app.post('/api/upload', authMiddleware, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado' })
  }
  res.json({ path: `/uploads/${req.file.filename}` })
})

// ============= HEALTH CHECK =============

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', database: 'Connected' })
})

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`)
  console.log(`📊 Banco de dados: ${process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'Configurar .env'}`)
})

// Tratamento de erros não capturados
process.on('unhandledRejection', (error) => {
  console.error('Erro não tratado:', error)
})


