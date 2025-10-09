import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const AppContext = createContext()

export function AppProvider({ children }) {
  const { user } = useAuth()
  const [integrantes, setIntegrantes] = useState([])
  const [pautas, setPautas] = useState([])
  const [convocacoes, setConvocacoes] = useState([])
  const [loading, setLoading] = useState(false)

  // Carregar integrantes
  const loadIntegrantes = async () => {
    if (!user) return
    
    try {
      const { data, error } = await supabase
        .from('integrantes')
        .select('*')
        .order('nome', { ascending: true })
        .execute()

      if (error) throw error
      setIntegrantes(data || [])
    } catch (err) {
      console.error('Erro ao carregar integrantes:', err)
    }
  }

  // Carregar pautas
  const loadPautas = async () => {
    if (!user) return
    
    try {
      const { data, error } = await supabase
        .from('pautas')
        .select('*')
        .order('created_at', { ascending: false })
        .execute()

      if (error) throw error
      setPautas(data || [])
    } catch (err) {
      console.error('Erro ao carregar pautas:', err)
    }
  }

  // Carregar convocações
  const loadConvocacoes = async () => {
    if (!user) return
    
    try {
      const { data, error } = await supabase
        .from('convocacoes')
        .select('*')
        .order('created_at', { ascending: false })
        .execute()

      if (error) throw error
      setConvocacoes(data || [])
    } catch (err) {
      console.error('Erro ao carregar convocações:', err)
    }
  }

  // Criar integrante
  const createIntegrante = async (integranteData) => {
    try {
      const { data, error } = await supabase
        .from('integrantes')
        .insert(integranteData)
        .select()
        .execute()

      if (error) throw error
      
      await loadIntegrantes()
      return { success: true, data: data[0] }
    } catch (err) {
      console.error('Erro ao criar integrante:', err)
      return { success: false, error: err.message }
    }
  }

  // Atualizar integrante
  const updateIntegrante = async (id, integranteData) => {
    try {
      const { data, error } = await supabase
        .from('integrantes')
        .update(integranteData)
        .eq('id', id)
        .execute()

      if (error) throw error
      
      await loadIntegrantes()
      return { success: true, data: data[0] }
    } catch (err) {
      console.error('Erro ao atualizar integrante:', err)
      return { success: false, error: err.message }
    }
  }

  // Deletar integrante
  const deleteIntegrante = async (id) => {
    try {
      const { error } = await supabase
        .from('integrantes')
        .delete()
        .eq('id', id)
        .execute()

      if (error) throw error
      
      await loadIntegrantes()
      return { success: true }
    } catch (err) {
      console.error('Erro ao deletar integrante:', err)
      return { success: false, error: err.message }
    }
  }

  // Importar integrantes em lote
  const importIntegrantes = async (integrantesArray) => {
    try {
      const { data, error } = await supabase
        .from('integrantes')
        .insert(integrantesArray)
        .select()
        .execute()

      if (error) throw error
      
      await loadIntegrantes()
      return { success: true, count: data.length }
    } catch (err) {
      console.error('Erro ao importar integrantes:', err)
      return { success: false, error: err.message }
    }
  }

  // Criar pauta
  const createPauta = async (pautaData) => {
    try {
      const { data, error } = await supabase
        .from('pautas')
        .insert(pautaData)
        .select()
        .execute()

      if (error) throw error
      
      await loadPautas()
      return { success: true, data: data[0] }
    } catch (err) {
      console.error('Erro ao criar pauta:', err)
      return { success: false, error: err.message }
    }
  }

  // Atualizar pauta
  const updatePauta = async (id, pautaData) => {
    try {
      const { data, error } = await supabase
        .from('pautas')
        .update(pautaData)
        .eq('id', id)
        .execute()

      if (error) throw error
      
      await loadPautas()
      return { success: true, data: data[0] }
    } catch (err) {
      console.error('Erro ao atualizar pauta:', err)
      return { success: false, error: err.message }
    }
  }

  // Deletar pauta
  const deletePauta = async (id) => {
    try {
      const { error } = await supabase
        .from('pautas')
        .delete()
        .eq('id', id)
        .execute()

      if (error) throw error
      
      await loadPautas()
      return { success: true }
    } catch (err) {
      console.error('Erro ao deletar pauta:', err)
      return { success: false, error: err.message }
    }
  }

  // Criar convocação
  const createConvocacao = async (convocacaoData) => {
    try {
      const { data, error } = await supabase
        .from('convocacoes')
        .insert(convocacaoData)
        .select()
        .execute()

      if (error) throw error
      
      await loadConvocacoes()
      return { success: true, data: data[0] }
    } catch (err) {
      console.error('Erro ao criar convocação:', err)
      return { success: false, error: err.message }
    }
  }

  // Carregar dados quando usuário faz login
  useEffect(() => {
    if (user) {
      setLoading(true)
      Promise.all([
        loadIntegrantes(),
        loadPautas(),
        loadConvocacoes()
      ]).finally(() => setLoading(false))
    } else {
      setIntegrantes([])
      setPautas([])
      setConvocacoes([])
    }
  }, [user])

  const value = {
    // Estado
    integrantes,
    pautas,
    convocacoes,
    loading,
    
    // Funções de reload
    loadIntegrantes,
    loadPautas,
    loadConvocacoes,
    
    // CRUD Integrantes
    createIntegrante,
    updateIntegrante,
    deleteIntegrante,
    importIntegrantes,
    
    // CRUD Pautas
    createPauta,
    updatePauta,
    deletePauta,
    
    // CRUD Convocações
    createConvocacao
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp deve ser usado dentro de AppProvider')
  }
  return context
}

