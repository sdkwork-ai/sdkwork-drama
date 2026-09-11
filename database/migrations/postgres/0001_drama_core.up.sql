-- drama core schema (first baseline migration).
-- Identity per SUBJECT_ID_SPEC.md: snowflake BIGINT entity ids and
-- positive tenant/user subject columns. Table names are unqualified; the
-- target schema comes from SDKWORK_DATABASE_SCHEMA via the pool search_path.

CREATE TABLE IF NOT EXISTS episodes (
    id          BIGINT PRIMARY KEY CHECK (id > 0),
    tenant_id   BIGINT NOT NULL CHECK (tenant_id > 0),
    user_id     BIGINT NOT NULL CHECK (user_id > 0),
    title       TEXT NOT NULL,
    synopsis    TEXT,
    status      TEXT NOT NULL DEFAULT 'draft',
    created_at  TIMESTAMPTZ NOT NULL,
    updated_at  TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS episodes_tenant_id_id_idx ON episodes (tenant_id, id);
CREATE INDEX IF NOT EXISTS episodes_tenant_status_idx ON episodes (tenant_id, status);

CREATE TABLE IF NOT EXISTS media_assets (
    id             BIGINT PRIMARY KEY CHECK (id > 0),
    tenant_id      BIGINT NOT NULL CHECK (tenant_id > 0),
    user_id        BIGINT NOT NULL CHECK (user_id > 0),
    episode_id     BIGINT NOT NULL REFERENCES episodes (id) ON DELETE CASCADE,
    asset_kind     TEXT NOT NULL,
    drive_uri      TEXT NOT NULL,
    drive_space_id TEXT NOT NULL,
    drive_node_id  TEXT NOT NULL,
    object_bucket  TEXT,
    object_key     TEXT,
    file_name      TEXT NOT NULL,
    content_type   TEXT NOT NULL,
    content_length BIGINT NOT NULL CHECK (content_length >= 0),
    status         TEXT NOT NULL DEFAULT 'ready',
    created_at     TIMESTAMPTZ NOT NULL,
    updated_at     TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS media_assets_tenant_episode_idx ON media_assets (tenant_id, episode_id, id);
