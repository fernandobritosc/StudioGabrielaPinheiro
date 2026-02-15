-- Script para adicionar colunas financeiras e de sinal na tabela de agendamentos
-- Execute este script no SQL Editor do seu projeto Supabase

ALTER TABLE agendamentos 
ADD COLUMN IF NOT EXISTS valor_final NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS metodo_pagamento TEXT,
ADD COLUMN IF NOT EXISTS data_pagamento TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS pago BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS sinal_valor NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS sinal_metodo TEXT,
ADD COLUMN IF NOT EXISTS sinal_pago BOOLEAN DEFAULT FALSE;
