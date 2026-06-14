-- Migration 008: senha de cidadão (bcrypt).
-- A coluna é opcional para preservar contas criadas no login MVP (CPF + data
-- de nascimento). Quando password_hash está definido, a senha passa a ser o
-- único fator aceito no login; o fallback por data de nascimento vale apenas
-- para contas legadas sem senha.

ALTER TABLE citizens
  ADD COLUMN IF NOT EXISTS password_hash TEXT;

COMMENT ON COLUMN citizens.password_hash IS
  'Hash bcrypt da senha do cidadão. NULL = conta legada que ainda autentica por CPF + data de nascimento.';
