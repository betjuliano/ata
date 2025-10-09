// Cliente unificado - usa API real do backend
import { createSupabaseCompatibleClient } from './apiClient'

// Criar cliente compatível com Supabase mas usando API real
export const supabase = createSupabaseCompatibleClient()

// Para compatibilidade com código antigo
export default supabase
