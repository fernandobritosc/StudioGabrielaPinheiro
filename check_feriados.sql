-- Verifica se a tabela existe e suas colunas
SELECT 
    table_name, 
    column_name, 
    data_type 
FROM 
    information_schema.columns 
WHERE 
    table_name = 'excecoes_horario';

-- Verifica as políticas RLS existentes
select * from pg_policies where tablename = 'excecoes_horario';
