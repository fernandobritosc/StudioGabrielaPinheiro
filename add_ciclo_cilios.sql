-- Adiciona a coluna ciclo_cilios na tabela agendamentos
ALTER TABLE agendamentos 
ADD COLUMN IF NOT EXISTS ciclo_cilios TEXT;

-- Recarrega o schema do PostgREST para reconhecer a nova coluna
NOTIFY pgrst, 'reload schema';
