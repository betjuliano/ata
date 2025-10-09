import { useState } from 'react'
import { localClient } from './lib/localClient'

export default function TestLogin() {
  const [email, setEmail] = useState('admjulianoo@gmail.com')
  const [password, setPassword] = useState('Adm4125')
  const [user, setUser] = useState(null)
  const [message, setMessage] = useState('')

  const handleLogin = async () => {
    try {
      console.log('Tentando login...')
      const result = await localClient.auth.signInWithPassword({ email, password })
      console.log('Resultado do login:', result)
      
      if (result.error) {
        setMessage(`Erro: ${result.error.message}`)
      } else {
        setUser(result.data.user)
        setMessage('Login bem-sucedido!')
      }
    } catch (error) {
      console.error('Erro no login:', error)
      setMessage(`Erro: ${error.message}`)
    }
  }

  const handleCadastro = async () => {
    try {
      const testEmail = 'teste@teste.com'
      const testPassword = '123456'
      
      console.log('Tentando cadastro...')
      const result = await localClient.auth.signUp({ 
        email: testEmail, 
        password: testPassword,
        options: {
          data: {
            nome_completo: 'Usuário Teste'
          }
        }
      })
      console.log('Resultado do cadastro:', result)
      
      if (result.error) {
        setMessage(`Erro no cadastro: ${result.error.message}`)
      } else {
        setUser(result.data.user)
        setMessage('Cadastro bem-sucedido!')
      }
    } catch (error) {
      console.error('Erro no cadastro:', error)
      setMessage(`Erro: ${error.message}`)
    }
  }

  const handleLogout = async () => {
    await localClient.auth.signOut()
    setUser(null)
    setMessage('Logout realizado')
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Teste do Sistema Local</h1>
      
      {!user ? (
        <div>
          <h2>Login</h2>
          <div style={{ marginBottom: '10px' }}>
            <label>Email:</label><br />
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '300px', padding: '5px' }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Senha:</label><br />
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '300px', padding: '5px' }}
            />
          </div>
          <button onClick={handleLogin} style={{ padding: '10px 20px', marginRight: '10px' }}>
            Fazer Login
          </button>
          <button onClick={handleCadastro} style={{ padding: '10px 20px' }}>
            Testar Cadastro
          </button>
        </div>
      ) : (
        <div>
          <h2>Usuário Logado</h2>
          <p><strong>ID:</strong> {user.id}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Nome:</strong> {user.nome_completo}</p>
          <button onClick={handleLogout} style={{ padding: '10px 20px' }}>
            Fazer Logout
          </button>
        </div>
      )}
      
      {message && (
        <div style={{ 
          marginTop: '20px', 
          padding: '10px', 
          backgroundColor: message.includes('Erro') ? '#ffebee' : '#e8f5e8',
          border: `1px solid ${message.includes('Erro') ? '#f44336' : '#4caf50'}`,
          borderRadius: '4px'
        }}>
          {message}
        </div>
      )}
      
      <div style={{ marginTop: '30px' }}>
        <h3>Dados no localStorage:</h3>
        <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', fontSize: '12px' }}>
          {JSON.stringify({
            currentUser: localStorage.getItem('currentUser'),
            localUsers: localStorage.getItem('localUsers'),
            localAtas: localStorage.getItem('localAtas')
          }, null, 2)}
        </pre>
      </div>
    </div>
  )
}