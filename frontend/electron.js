const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')
const Database = require('better-sqlite3')

// Configuração do banco de dados local
let db
let mainWindow

function createDatabase() {
  const dbPath = path.join(app.getPath('userData'), 'ata-audio.db')
  db = new Database(dbPath)
  
  // Criar tabelas se não existirem
  db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      senha TEXT NOT NULL,
      nome_completo TEXT,
      cargo TEXT,
      colegiado TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS atas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      numero_sessao TEXT NOT NULL,
      tipo_sessao TEXT DEFAULT 'Ordinária',
      audio_path TEXT,
      pauta_path TEXT,
      status TEXT DEFAULT 'PENDENTE',
      rascunho_gerado TEXT,
      documento_final_path TEXT,
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES usuarios (id)
    );
  `)

  // Criar usuário administrador se não existir
  const adminExists = db.prepare('SELECT id FROM usuarios WHERE email = ?').get('admjulianoo@gmail.com')
  if (!adminExists) {
    db.prepare(`
      INSERT INTO usuarios (email, senha, nome_completo, cargo, colegiado)
      VALUES (?, ?, ?, ?, ?)
    `).run('admjulianoo@gmail.com', 'Adm4125', 'Administrador', 'Administrador do Sistema', 'Administração')
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    icon: path.join(__dirname, 'public/favicon.ico')
  })

  // Em desenvolvimento, carrega do servidor Vite
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    // Em produção, carrega os arquivos buildados
    mainWindow.loadFile('dist/index.html')
  }
}

app.whenReady().then(() => {
  createDatabase()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// IPC Handlers para comunicação com o frontend

// Autenticação
ipcMain.handle('auth-login', async (event, { email, senha }) => {
  try {
    const user = db.prepare('SELECT * FROM usuarios WHERE email = ? AND senha = ?').get(email, senha)
    if (user) {
      return { success: true, user: { id: user.id, email: user.email, nome_completo: user.nome_completo } }
    } else {
      return { success: false, error: 'Credenciais inválidas' }
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// Cadastro de usuário
ipcMain.handle('auth-register', async (event, { email, senha, nome_completo, cargo, colegiado }) => {
  try {
    const stmt = db.prepare(`
      INSERT INTO usuarios (email, senha, nome_completo, cargo, colegiado)
      VALUES (?, ?, ?, ?, ?)
    `)
    const result = stmt.run(email, senha, nome_completo, cargo, colegiado)
    return { success: true, user: { id: result.lastInsertRowid, email, nome_completo } }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// Listar atas do usuário
ipcMain.handle('get-atas', async (event, userId) => {
  try {
    const atas = db.prepare('SELECT * FROM atas WHERE user_id = ? ORDER BY created_at DESC').all(userId)
    return { success: true, data: atas }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// Criar nova ata
ipcMain.handle('create-ata', async (event, { userId, numeroSessao, tipoSessao }) => {
  try {
    const stmt = db.prepare(`
      INSERT INTO atas (user_id, numero_sessao, tipo_sessao, status)
      VALUES (?, ?, ?, 'PENDENTE')
    `)
    const result = stmt.run(userId, numeroSessao, tipoSessao)
    return { success: true, id: result.lastInsertRowid }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// Upload de arquivo
ipcMain.handle('upload-file', async (event, { ataId, tipo }) => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: tipo === 'audio' 
        ? [{ name: 'Arquivos de Áudio', extensions: ['mp3', 'wav', 'm4a'] }]
        : [{ name: 'Documentos', extensions: ['pdf', 'docx'] }]
    })

    if (!result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0]
      const fileName = path.basename(filePath)
      
      // Criar diretório de uploads se não existir
      const uploadsDir = path.join(app.getPath('userData'), 'uploads')
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true })
      }
      
      // Copiar arquivo para diretório local
      const destPath = path.join(uploadsDir, `${ataId}_${tipo}_${fileName}`)
      fs.copyFileSync(filePath, destPath)
      
      // Atualizar banco de dados
      const column = tipo === 'audio' ? 'audio_path' : 'pauta_path'
      db.prepare(`UPDATE atas SET ${column} = ? WHERE id = ?`).run(destPath, ataId)
      
      return { success: true, path: destPath, fileName }
    }
    
    return { success: false, error: 'Nenhum arquivo selecionado' }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// Processar ata (simulado)
ipcMain.handle('process-ata', async (event, ataId) => {
  try {
    // Simular processamento
    db.prepare('UPDATE atas SET status = ? WHERE id = ?').run('PROCESSANDO', ataId)
    
    // Simular delay de processamento
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // Gerar rascunho simulado
    const rascunhoSimulado = `
# ATA DA ${Math.floor(Math.random() * 100)}ª SESSÃO ORDINÁRIA

## DADOS DA SESSÃO
- **Data**: ${new Date().toLocaleDateString('pt-BR')}
- **Horário**: ${new Date().toLocaleTimeString('pt-BR')}
- **Local**: Sala de Reuniões Virtual

## PARTICIPANTES
- Presidente: Prof. Dr. João Silva
- Secretário: Prof. Dr. Maria Santos
- Membros presentes: 8 de 10

## PAUTA
1. **Abertura da sessão**
   - Sessão aberta às ${new Date().toLocaleTimeString('pt-BR')}
   
2. **Aprovação da ata anterior**
   - Ata da sessão anterior aprovada por unanimidade
   
3. **Assuntos gerais**
   - Discussão sobre novos projetos
   - Aprovação de recursos orçamentários
   - Planejamento para próximo semestre

## DELIBERAÇÕES
- **Deliberação 001**: Aprovado por unanimidade o projeto X
- **Deliberação 002**: Aprovado por maioria a proposta Y

## ENCERRAMENTO
Nada mais havendo a tratar, a sessão foi encerrada às ${new Date().toLocaleTimeString('pt-BR')}.

---
*Ata gerada automaticamente pelo Sistema Ata Audio*
    `
    
    db.prepare('UPDATE atas SET status = ?, rascunho_gerado = ? WHERE id = ?')
      .run('CONCLUIDO', rascunhoSimulado, ataId)
    
    return { success: true }
  } catch (error) {
    db.prepare('UPDATE atas SET status = ?, error_message = ? WHERE id = ?')
      .run('FALHA', error.message, ataId)
    return { success: false, error: error.message }
  }
})

// Obter ata específica
ipcMain.handle('get-ata', async (event, ataId) => {
  try {
    const ata = db.prepare('SELECT * FROM atas WHERE id = ?').get(ataId)
    return { success: true, data: ata }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// Salvar rascunho editado
ipcMain.handle('save-ata', async (event, { ataId, rascunho }) => {
  try {
    db.prepare('UPDATE atas SET rascunho_gerado = ? WHERE id = ?').run(rascunho, ataId)
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
})