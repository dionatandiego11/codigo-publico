-- Migration 023: Expand budget_demands status constraint to support full lifecycle (voting and execution stages)
ALTER TABLE budget_demands DROP CONSTRAINT IF EXISTS budget_demands_status_check;

ALTER TABLE budget_demands ADD CONSTRAINT budget_demands_status_check CHECK (
    status = ANY (ARRAY[
        'Recebida'::text,
        'Engajamento inicial'::text,
        'Precisa de informações'::text,
        'Agrupada'::text,
        'Maturação territorial'::text,
        'Validada territorialmente'::text,
        'Apta para priorização'::text,
        'Em votação'::text,
        'Aprovada'::text,
        'Não aprovada'::text,
        'Em planejamento'::text,
        'Em execução'::text,
        'Concluída'::text,
        'Frustrada'::text,
        'Dormente'::text,
        'Arquivada'::text
    ])
);
