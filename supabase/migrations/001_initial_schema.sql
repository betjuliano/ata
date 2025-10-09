-- Criação das tabelas para o Sistema Ata Audio

-- Tabela de perfis dos usuários (extensão da auth.users)
CREATE TABLE IF NOT EXISTS public.perfis (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    nome_completo TEXT,
    cargo TEXT,
    colegiado TEXT
);

-- Tabela principal das atas
CREATE TABLE IF NOT EXISTS public.atas (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES public.perfis(id) ON DELETE CASCADE NOT NULL,
    numero_sessao TEXT NOT NULL,
    tipo_sessao TEXT NOT NULL DEFAULT 'Ordinária',
    audio_path TEXT,
    pauta_path TEXT,
    status TEXT NOT NULL DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'PROCESSANDO', 'CONCLUIDO', 'FALHA')),
    rascunho_gerado TEXT,
    documento_final_path TEXT,
    error_message TEXT
);

-- Criar buckets no Storage
INSERT INTO storage.buckets (id, name, public) 
VALUES 
    ('audios', 'audios', false),
    ('pautas', 'pautas', false),
    ('atas-geradas', 'atas-geradas', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas de segurança (RLS)

-- Ativar RLS nas tabelas
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atas ENABLE ROW LEVEL SECURITY;

-- Políticas para perfis
CREATE POLICY "Permitir leitura pública de perfis" ON public.perfis
    FOR SELECT USING (true);

CREATE POLICY "Permitir que o próprio usuário atualize seu perfil" ON public.perfis
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Permitir que usuários criem seu perfil" ON public.perfis
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Políticas para atas
CREATE POLICY "Permitir que usuários criem atas" ON public.atas
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Permitir que usuários leiam suas próprias atas" ON public.atas
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Permitir que usuários atualizem suas atas" ON public.atas
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Permitir que usuários deletem suas atas" ON public.atas
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para Storage

-- Política para bucket de áudios
CREATE POLICY "Usuários podem fazer upload de áudios" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'audios' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Usuários podem ler seus próprios áudios" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'audios' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Política para bucket de pautas
CREATE POLICY "Usuários podem fazer upload de pautas" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'pautas' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Usuários podem ler suas próprias pautas" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'pautas' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Política para bucket de atas geradas
CREATE POLICY "Usuários podem fazer upload de atas geradas" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'atas-geradas' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Usuários podem ler suas próprias atas geradas" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'atas-geradas' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Função para criar perfil automaticamente quando um usuário se cadastra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.perfis (id, nome_completo)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'nome_completo');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para executar a função quando um novo usuário é criado
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Função para atualizar o timestamp updated_at automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at na tabela perfis
CREATE OR REPLACE TRIGGER handle_updated_at_perfis
    BEFORE UPDATE ON public.perfis
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
