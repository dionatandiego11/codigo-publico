-- Migration 017: permite o papel sysadmin no contrato de cidadãos.
-- O backend já trata sysadmin como papel de bootstrap administrativo; o banco
-- precisa aceitar esse valor explicitamente.

ALTER TABLE citizens DROP CONSTRAINT IF EXISTS citizens_role_contract_check;

ALTER TABLE citizens
  ADD CONSTRAINT citizens_role_contract_check
  CHECK (role IN (
    'citizen',
    'sysadmin',
    'admin',
    'institutional_admin',
    'legislative_admin',
    'procurador',
    'secretario',
    'vereador',
    'mesa_diretora'
  ));
