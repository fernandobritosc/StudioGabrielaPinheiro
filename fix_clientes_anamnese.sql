-- Adiciona a coluna anamnese como JSONB na tabela clientes
ALTER TABLE clientes 
ADD COLUMN IF NOT EXISTS anamnese JSONB DEFAULT '{}'::jsonb;
