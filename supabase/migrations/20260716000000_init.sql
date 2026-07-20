-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "vector"; -- pgvector (for semantic roadmaps)

-- 2. Create PL/pgSQL function to generate UUID v7
CREATE OR REPLACE FUNCTION uuid_generate_v7()
RETURNS uuid AS $$
DECLARE
  unix_time_ms bytea;
  uuid_bytes bytea;
BEGIN
  -- 48-bit unix timestamp in milliseconds
  unix_time_ms := substring(decode(lpad(to_hex(floor(extract(epoch from clock_timestamp()) * 1000)::bigint), 16, '0'), 'hex') from 3 for 6);
  -- 80-bit random payload
  uuid_bytes := unix_time_ms || gen_random_bytes(10);
  -- set version to 7 (0111) -> byte 6 is high 4 bits version
  uuid_bytes := set_byte(uuid_bytes, 6, (get_byte(uuid_bytes, 6) & 15) | 112);
  -- set variant to RFC 4122 (10xx) -> byte 8 is high 2 bits variant
  uuid_bytes := set_byte(uuid_bytes, 8, (get_byte(uuid_bytes, 8) & 63) | 128);
  
  RETURN encode(uuid_bytes, 'hex')::uuid;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- 3. Reference to auth.users is handled natively by Supabase, no need to mock auth schema here.

-- 4. Create Tables
-- 4.1 Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nickname VARCHAR(50) NOT NULL UNIQUE,
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- 4.2 Jobs (Occupation Hierarchy) Table
CREATE TABLE IF NOT EXISTS public.jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    parent_job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
    title VARCHAR(100) NOT NULL UNIQUE,
    industry VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    search_tags TEXT, -- 동의어/키워드 검색용 컬럼 (ex. 'backend, 백엔드, 백앤드, 서버')
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- 4.3 Profile Target Jobs Table
CREATE TABLE IF NOT EXISTS public.profile_target_jobs (
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    priority INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (profile_id, job_id)
);

-- 4.4 Standard Events Table
CREATE TABLE IF NOT EXISTS public.standard_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    category VARCHAR(50) NOT NULL,
    standard_title VARCHAR(200) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.5 Events Table
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    standard_event_id UUID REFERENCES public.standard_events(id) ON DELETE SET NULL,
    category VARCHAR(50) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    visibility VARCHAR(20) NOT NULL DEFAULT 'public',
    status VARCHAR(20) NOT NULL DEFAULT 'completed',
    attributes JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- 4.6 Event Sequences Table
CREATE TABLE IF NOT EXISTS public.event_sequences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    previous_event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
    next_event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.7 Event Edges (Statistics) Table
CREATE TABLE IF NOT EXISTS public.event_edges (
    from_standard_event_id UUID NOT NULL REFERENCES public.standard_events(id) ON DELETE CASCADE,
    to_standard_event_id UUID NOT NULL REFERENCES public.standard_events(id) ON DELETE CASCADE,
    edge_type VARCHAR(30) NOT NULL DEFAULT 'default',
    weight NUMERIC(5,2) NOT NULL DEFAULT 1.00,
    connection_count BIGINT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (from_standard_event_id, to_standard_event_id, edge_type)
);

-- 4.8 Skills Table
CREATE TABLE IF NOT EXISTS public.skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL,
    icon_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.9 Event Skills Junction Table
CREATE TABLE IF NOT EXISTS public.event_skills (
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
    PRIMARY KEY (event_id, skill_id)
);

-- 4.10 Event Attachments Table
CREATE TABLE IF NOT EXISTS public.event_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.11 Roadmap Nodes Table
CREATE TABLE IF NOT EXISTS public.roadmap_nodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    standard_event_id UUID REFERENCES public.standard_events(id) ON DELETE SET NULL,
    node_title VARCHAR(200) NOT NULL,
    node_type VARCHAR(50) NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.12 Roadmap Edges Table
CREATE TABLE IF NOT EXISTS public.roadmap_edges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    from_node_id UUID NOT NULL REFERENCES public.roadmap_nodes(id) ON DELETE CASCADE,
    to_node_id UUID NOT NULL REFERENCES public.roadmap_nodes(id) ON DELETE CASCADE,
    connection_count BIGINT NOT NULL DEFAULT 0,
    avg_transition_days INTEGER NOT NULL DEFAULT 0,
    weight NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.13 Roadmap Cache Table
CREATE TABLE IF NOT EXISTS public.roadmap_cache (
    job_id UUID PRIMARY KEY REFERENCES public.jobs(id) ON DELETE CASCADE,
    tree_data JSONB NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.14 Notion Connections Table
CREATE TABLE IF NOT EXISTS public.notion_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    encrypted_access_token TEXT NOT NULL,
    workspace_name VARCHAR(200),
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.15 Notion Databases Table
CREATE TABLE IF NOT EXISTS public.notion_databases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    connection_id UUID NOT NULL REFERENCES public.notion_connections(id) ON DELETE CASCADE,
    notion_database_id VARCHAR(100) NOT NULL,
    parser_rules JSONB NOT NULL DEFAULT '{}',
    last_cursor TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.16 Notion Sync Logs Table
CREATE TABLE IF NOT EXISTS public.notion_sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    database_id UUID NOT NULL REFERENCES public.notion_databases(id) ON DELETE CASCADE,
    import_source_type VARCHAR(20) NOT NULL DEFAULT 'notion_db',
    status VARCHAR(20) NOT NULL,
    records_processed INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.17 Community Tables (Comments, Likes, Bookmarks, Follows, Notifications, Reports)
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES public.comments(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.likes (
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_type VARCHAR(30) NOT NULL,
    target_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (profile_id, target_type, target_id)
);

CREATE TABLE IF NOT EXISTS public.bookmarks (
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (profile_id, target_event_id)
);

CREATE TABLE IF NOT EXISTS public.follows (
    follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id)
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL,
    content TEXT NOT NULL,
    target_url TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_type VARCHAR(30) NOT NULL,
    target_id UUID NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Indexes for Performance & Search
-- 5.1 GIN Trigram Indexes for Fuzzy Search
CREATE INDEX IF NOT EXISTS idx_skills_name_trgm ON public.skills USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_jobs_title_trgm ON public.jobs USING gin (title gin_trgm_ops);

-- 5.2 Full Text Search Index for Events
CREATE INDEX IF NOT EXISTS idx_events_fts ON public.events USING gin (to_tsvector('simple', title || ' ' || coalesce(description, '')));

-- 5.3 JSONB Path Ops GIN Index for Event Attributes
CREATE INDEX IF NOT EXISTS idx_events_attributes_path ON public.events USING gin (attributes jsonb_path_ops);

-- 5.4 Covering & Composite Indexes
CREATE INDEX IF NOT EXISTS idx_events_profile_category ON public.events (profile_id, category) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_roadmap_nodes_job_event ON public.roadmap_nodes (job_id, standard_event_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_edges_from ON public.roadmap_edges (from_node_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_edges_to ON public.roadmap_edges (to_node_id);
CREATE INDEX IF NOT EXISTS idx_profile_target_jobs_priority ON public.profile_target_jobs (profile_id, priority);
CREATE INDEX IF NOT EXISTS idx_event_sequences_chain ON public.event_sequences (profile_id, previous_event_id, next_event_id);
