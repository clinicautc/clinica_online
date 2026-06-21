-- Fase B: migracion a JWT
-- Tabla para persistir refresh tokens (opacos, no JWT) con rotacion y revocacion.
-- El valor del token nunca se guarda en claro: se guarda el hash SHA-256.

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id serial PRIMARY KEY,
  usuario_id integer NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expira_en timestamptz NOT NULL,
  revocado boolean NOT NULL DEFAULT false,
  creado_en timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_usuario_id ON refresh_tokens (usuario_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens (token_hash);
