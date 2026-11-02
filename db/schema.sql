CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE IF NOT EXISTS laws (
 id UUID PRIMARY KEY, title TEXT NOT NULL, law_number TEXT,
 jurisdiction TEXT NOT NULL DEFAULT '黃名帝國', category TEXT,
 status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','draft','repealed','archived')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS law_versions (
 id UUID PRIMARY KEY, law_id UUID NOT NULL REFERENCES laws(id) ON DELETE CASCADE,
 version_label TEXT NOT NULL DEFAULT '初始版本',
 validity_status TEXT NOT NULL DEFAULT 'current' CHECK(validity_status IN ('current','historical','draft','repealed','unknown')),
 effective_date DATE, source_name TEXT, original_text TEXT NOT NULL, checksum TEXT NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS provisions (
 id UUID PRIMARY KEY, law_id UUID NOT NULL REFERENCES laws(id) ON DELETE CASCADE,
 version_id UUID NOT NULL REFERENCES law_versions(id) ON DELETE CASCADE,
 order_index INTEGER NOT NULL, chapter TEXT, article_number TEXT, heading TEXT,
 content TEXT NOT NULL, embedding VECTOR(1536), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS analyses (
 id UUID PRIMARY KEY, title TEXT NOT NULL, objective TEXT NOT NULL,
 policy_principles TEXT, drafting_preferences TEXT, status TEXT NOT NULL DEFAULT 'completed',
 result JSONB NOT NULL, cited_provision_ids UUID[] NOT NULL DEFAULT '{}',
 model_name TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS laws_status_idx ON laws(status);
CREATE INDEX IF NOT EXISTS law_versions_law_idx ON law_versions(law_id);
CREATE INDEX IF NOT EXISTS provisions_law_idx ON provisions(law_id);
CREATE INDEX IF NOT EXISTS provisions_version_idx ON provisions(version_id);
CREATE INDEX IF NOT EXISTS provisions_content_trgm_idx ON provisions USING GIN(content gin_trgm_ops);
CREATE INDEX IF NOT EXISTS analyses_created_idx ON analyses(created_at DESC);
