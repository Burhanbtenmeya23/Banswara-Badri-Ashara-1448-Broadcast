-- ============================================================
-- Banswara Badri Ashara 1448 Broadcast — Supabase Schema
-- Run this in: Supabase Dashboard > SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  its_id               VARCHAR(8) UNIQUE NOT NULL,
  password_hash        TEXT NOT NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login           TIMESTAMPTZ,
  active_session_token TEXT
);

-- Index for fast ITS ID lookups
CREATE UNIQUE INDEX IF NOT EXISTS users_its_id_idx ON public.users(its_id);

-- ============================================================
-- SETTINGS TABLE (single-row for broadcast config)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.settings (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  youtube_url       TEXT NOT NULL DEFAULT '',
  youtube_video_id  TEXT NOT NULL DEFAULT '',
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SESSIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sessions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token       TEXT NOT NULL UNIQUE,
  ip_address  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast token verification
CREATE INDEX IF NOT EXISTS sessions_token_idx ON public.sessions(token);
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS sessions_last_seen_idx ON public.sessions(last_seen);

-- ============================================================
-- ROW LEVEL SECURITY
-- Disable RLS (we use service_role key from server only)
-- ============================================================
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- CLEANUP: Auto-delete sessions older than 48 hours
-- (Optional — run manually or via pg_cron if available)
-- ============================================================
-- DELETE FROM public.sessions WHERE last_seen < NOW() - INTERVAL '48 hours';

-- ============================================================
-- VERIFY TABLES CREATED
-- ============================================================
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
