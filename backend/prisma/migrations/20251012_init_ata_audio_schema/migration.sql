-- Create schema if not exists
CREATE SCHEMA IF NOT EXISTS "ata_audio";

-- Users table
CREATE TABLE IF NOT EXISTS "ata_audio"."users" (
  "id" SERIAL PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "senha" TEXT NOT NULL,
  "nome_completo" TEXT,
  "cargo" TEXT,
  "colegiado" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pautas table
CREATE TABLE IF NOT EXISTS "ata_audio"."pautas" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL,
  "tema" TEXT NOT NULL,
  "descricao" TEXT NOT NULL,
  "reuniao_prevista" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDENTE',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "pautas_user_id_fkey" FOREIGN KEY ("user_id")
    REFERENCES "ata_audio"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Atas table
CREATE TABLE IF NOT EXISTS "ata_audio"."atas" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL,
  "numero_sessao" TEXT NOT NULL,
  "tipo_sessao" TEXT NOT NULL,
  "data_reuniao" TEXT,
  "horario_reuniao" TEXT,
  "modo_criacao" TEXT NOT NULL,
  "pauta_id" INTEGER,
  "pauta_texto" TEXT,
  "pauta_path" TEXT,
  "audio_path" TEXT,
  "transcricao_texto" TEXT,
  "integrantes" JSONB,
  "pautas_redacao" JSONB,
  "rascunho_gerado" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDENTE',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "atas_user_id_fkey" FOREIGN KEY ("user_id")
    REFERENCES "ata_audio"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "atas_pauta_id_fkey" FOREIGN KEY ("pauta_id")
    REFERENCES "ata_audio"."pautas"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Integrantes table
CREATE TABLE IF NOT EXISTS "ata_audio"."integrantes" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL,
  "nome" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "origem" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "integrantes_user_id_fkey" FOREIGN KEY ("user_id")
    REFERENCES "ata_audio"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Convocacoes table
CREATE TABLE IF NOT EXISTS "ata_audio"."convocacoes" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL,
  "titulo" TEXT NOT NULL,
  "formato" TEXT,
  "data_reuniao" TEXT NOT NULL,
  "horario" TEXT NOT NULL,
  "local" TEXT,
  "pauta_texto" TEXT NOT NULL,
  "texto_gerado" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "convocacoes_user_id_fkey" FOREIGN KEY ("user_id")
    REFERENCES "ata_audio"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS "idx_atas_user_id" ON "ata_audio"."atas" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_pautas_user_id" ON "ata_audio"."pautas" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_integrantes_user_id" ON "ata_audio"."integrantes" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_convocacoes_user_id" ON "ata_audio"."convocacoes" ("user_id");

