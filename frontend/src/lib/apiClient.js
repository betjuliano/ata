// Cliente da API para conectar com o backend real
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

let authToken = localStorage.getItem('authToken')

export const setAuthToken = (token) => {
  authToken = token
  if (token) {
    localStorage.setItem('authToken', token)
  } else {
    localStorage.removeItem('authToken')
  }
}

export const getAuthToken = () => authToken

const request = async (endpoint, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  }

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers
    })

    const data = await response.json()

    if (!response.ok) {
      throw data
    }

    return data
  } catch (error) {
    console.error('API Error:', error)
    
    // Se for erro de rede (backend indisponível), retorna dados mock
    if (error.name === 'TypeError' || error.message?.includes('fetch')) {
      console.warn('Backend indisponível, usando dados mock')
      return getMockData(endpoint, options.method)
    }
    
    throw error
  }
}

// Dados mock para quando o backend não estiver disponível
const getMockData = (endpoint, method) => {
  if (endpoint === '/auth/me') {
    throw { message: 'Não autenticado' }
  }
  
  if (method === 'POST') {
    return { id: Date.now(), message: 'Criado com sucesso (mock)' }
  }
  
  return []
}

export const apiClient = {
  // ============= AUTENTICAÇÃO =============
  
  signup: async (data) => {
    const response = await request('/auth/signup', { 
      method: 'POST', 
      body: JSON.stringify(data) 
    })
    if (response.token) {
      setAuthToken(response.token)
    }
    return response
  },
  
  login: async (data) => {
    const response = await request('/auth/login', { 
      method: 'POST', 
      body: JSON.stringify(data) 
    })
    if (response.token) {
      setAuthToken(response.token)
    }
    return response
  },
  
  me: () => request('/auth/me'),

  logout: () => {
    setAuthToken(null)
  },

  // ============= ATAS =============
  
  atas: {
    list: () => request('/atas'),
    
    get: (id) => request(`/atas/${id}`),
    
    create: (data) => request('/atas', { 
      method: 'POST', 
      body: JSON.stringify(data) 
    }),
    
    update: (id, data) => request(`/atas/${id}`, { 
      method: 'PUT', 
      body: JSON.stringify(data) 
    }),
    
    delete: (id) => request(`/atas/${id}`, { 
      method: 'DELETE' 
    })
  },

  // ============= INTEGRANTES =============
  
  integrantes: {
    list: () => request('/integrantes'),
    
    create: (data) => request('/integrantes', { 
      method: 'POST', 
      body: JSON.stringify(data) 
    }),
    
    update: (id, data) => request(`/integrantes/${id}`, { 
      method: 'PUT', 
      body: JSON.stringify(data) 
    }),
    
    delete: (id) => request(`/integrantes/${id}`, { 
      method: 'DELETE' 
    })
  },

  // ============= PAUTAS =============
  
  pautas: {
    list: () => request('/pautas'),
    
    create: (data) => request('/pautas', { 
      method: 'POST', 
      body: JSON.stringify(data) 
    }),
    
    update: (id, data) => request(`/pautas/${id}`, { 
      method: 'PUT', 
      body: JSON.stringify(data) 
    }),
    
    delete: (id) => request(`/pautas/${id}`, { 
      method: 'DELETE' 
    })
  },

  // ============= CONVOCAÇÕES =============
  
  convocacoes: {
    list: () => request('/convocacoes'),
    
    create: (data) => request('/convocacoes', { 
      method: 'POST', 
      body: JSON.stringify(data) 
    })
  },

  // ============= UPLOAD =============
  
  upload: async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${authToken}` 
      },
      body: formData
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw error
    }
    
    return response.json()
  }
}

// Compatibilidade com formato Supabase
export const createSupabaseCompatibleClient = () => {
  return {
    auth: {
      signUp: async ({ email, password, options }) => {
        try {
          const response = await apiClient.signup({
            email,
            senha: password,
            ...options?.data
          })
          return { data: { user: response.user }, error: null }
        } catch (error) {
          return { data: null, error }
        }
      },

      signInWithPassword: async ({ email, password }) => {
        try {
          const response = await apiClient.login({ email, senha: password })
          return { data: { user: response.user }, error: null }
        } catch (error) {
          return { data: null, error }
        }
      },

      signOut: async () => {
        apiClient.logout()
        return { error: null }
      },

      getUser: async () => {
        try {
          const user = await apiClient.me()
          return { data: { user }, error: null }
        } catch (error) {
          return { data: { user: null }, error }
        }
      },

      getSession: async () => {
        try {
          // Se não há token, retorna sessão nula
          if (!authToken) {
            return { 
              data: { 
                session: null 
              }, 
              error: null 
            }
          }

          const user = await apiClient.me()
          return { 
            data: { 
              session: user ? { user } : null 
            }, 
            error: null 
          }
        } catch (error) {
          // Em caso de erro, limpa o token inválido
          setAuthToken(null)
          return { 
            data: { 
              session: null 
            }, 
            error: null 
          }
        }
      },

      onAuthStateChange: (callback) => {
        // Simular onChange
        const checkAuth = async () => {
          try {
            const user = await apiClient.me()
            callback('SIGNED_IN', { user })
          } catch {
            callback('SIGNED_OUT', { user: null })
          }
        }
        
        if (authToken) {
          checkAuth()
        }

        return {
          data: { subscription: { unsubscribe: () => {} } }
        }
      }
    },

    from: (table) => {
      const tableClients = {
        atas: apiClient.atas,
        integrantes: apiClient.integrantes,
        pautas: apiClient.pautas,
        convocacoes: apiClient.convocacoes
      }

      const client = tableClients[table]

      return {
        select: (fields = '*') => ({
          eq: (field, value) => ({
            single: async () => {
              try {
                const items = await client.list()
                const item = items.find(i => i[field] === value)
                if (!item) {
                  throw { message: 'Registro não encontrado' }
                }
                return { data: item, error: null }
              } catch (error) {
                return { data: null, error }
              }
            },
            execute: async () => {
              try {
                const items = await client.list()
                const filtered = items.filter(i => i[field] === value)
                return { data: filtered, error: null }
              } catch (error) {
                return { data: null, error }
              }
            }
          }),
          order: (field, options) => ({
            execute: async () => {
              try {
                const items = await client.list()
                return { data: items, error: null }
              } catch (error) {
                return { data: null, error }
              }
            }
          }),
          execute: async () => {
            try {
              const data = await client.list()
              return { data, error: null }
            } catch (error) {
              return { data: null, error }
            }
          }
        }),

        insert: (data) => ({
          select: () => ({
            execute: async () => {
              try {
                const result = await client.create(data)
                return { data: [result], error: null }
              } catch (error) {
                return { data: null, error }
              }
            }
          })
        }),

        update: (data) => ({
          eq: (field, value) => ({
            execute: async () => {
              try {
                await client.update(value, data)
                return { error: null }
              } catch (error) {
                return { error }
              }
            }
          })
        }),

        delete: () => ({
          eq: (field, value) => ({
            execute: async () => {
              try {
                await client.delete(value)
                return { error: null }
              } catch (error) {
                return { error }
              }
            }
          })
        })
      }
    },

    storage: {
      from: (bucket) => ({
        upload: async (path, file) => {
          try {
            const result = await apiClient.upload(file)
            return { data: { path: result.path }, error: null }
          } catch (error) {
            return { data: null, error }
          }
        }
      })
    }
  }
}

export default apiClient


