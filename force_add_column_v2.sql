-- Tenta adicionar a coluna novamente (sem IF NOT EXISTS para termos certeza do erro se já existir)
ALTER TABLE clientes ADD COLUMN anamnese JSONB DEFAULT '{}'::jsonb;

-- Força o recarregamento do cache do esquema
NOTIFY pgrst, 'reload schema';
