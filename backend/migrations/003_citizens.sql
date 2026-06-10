-- Cidadãos autenticáveis.
-- CPF nunca é armazenado puro. A aplicação normaliza e salva apenas cpf_hash.

CREATE TABLE citizens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  cpf_hash TEXT NOT NULL UNIQUE,
  birth_date DATE NOT NULL,
  phone TEXT,
  email TEXT UNIQUE,
  territory_id UUID REFERENCES territories(id) ON DELETE SET NULL,
  role TEXT NOT NULL DEFAULT 'citizen',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_citizens_cpf_hash ON citizens(cpf_hash);
CREATE INDEX idx_citizens_email ON citizens(email);
CREATE INDEX idx_citizens_territory_id ON citizens(territory_id);

CREATE TRIGGER set_updated_at_citizens
BEFORE UPDATE ON citizens
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
