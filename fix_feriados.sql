-- Cria a tabela de exceções de horário (feriados) se não existir
CREATE TABLE IF NOT EXISTS excecoes_horario (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    data DATE NOT NULL,
    motivo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilita RLS (Row Level Security)
ALTER TABLE excecoes_horario ENABLE ROW LEVEL SECURITY;

-- Cria política permissiva (permitir tudo para todos - ideal para dev/test, ajuste conforme necessidade)
CREATE POLICY "Permitir acesso total a excecoes_horario" ON excecoes_horario
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Garante permissões para roles anon e authenticated
GRANT ALL ON excecoes_horario TO anon;
GRANT ALL ON excecoes_horario TO authenticated;
GRANT ALL ON excecoes_horario TO service_role;

-- Força o recarregamento do cache do esquema
NOTIFY pgrst, 'reload schema';
