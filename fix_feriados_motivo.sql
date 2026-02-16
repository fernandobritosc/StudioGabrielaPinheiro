-- Adiciona a coluna motivo se ela não existir
ALTER TABLE excecoes_horario 
ADD COLUMN IF NOT EXISTS motivo TEXT;

-- Força o recarregamento do cache do esquema
NOTIFY pgrst, 'reload schema';
