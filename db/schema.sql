CREATE TABLE links (
  id         BIGSERIAL PRIMARY KEY,
  code       VARCHAR(30) NOT NULL,
  long_url   TEXT NOT NULL,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_links_code ON links (code);