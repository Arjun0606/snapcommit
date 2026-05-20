-- Snapcommit Cloud — initial schema
-- Supabase Postgres. Run via: supabase db push

-- ============================================================================
-- USERS
-- ============================================================================

-- Supabase Auth manages auth.users. We add a parallel `public.profiles` row
-- for snapcommit-specific data, joined on auth.users.id.

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  tier TEXT NOT NULL DEFAULT 'inactive' CHECK (tier IN ('inactive','hobby','pro','studio')),
  monthly_quota INTEGER NOT NULL DEFAULT 0,
  dodo_customer_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_dodo ON public.profiles(dodo_customer_id);

-- Auto-create a profile row when a new auth.users row is inserted.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- API TOKENS
-- ============================================================================
-- Long-lived opaque tokens (sct_live_xxxx) the user pastes into their AI tool.
-- We store the hash, not the cleartext.

CREATE TABLE IF NOT EXISTS public.api_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  token_prefix TEXT NOT NULL,  -- first 12 chars for display (e.g., "sct_live_ab...")
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_api_tokens_user ON public.api_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_api_tokens_hash ON public.api_tokens(token_hash);

-- ============================================================================
-- USAGE TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.usage_monthly (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  year_month TEXT NOT NULL,   -- e.g., '2026-05'
  used INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, year_month)
);

CREATE TABLE IF NOT EXISTS public.extraction_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  model TEXT NOT NULL,
  input_tokens INTEGER,
  output_tokens INTEGER,
  ok BOOLEAN NOT NULL
  -- intentionally NO content column. Ever.
);

CREATE INDEX IF NOT EXISTS idx_extraction_log_user_ts ON public.extraction_log(user_id, ts DESC);

-- ============================================================================
-- DEMO RATE LIMITING (anonymous landing-page demo)
-- ============================================================================
-- IP-based rate limit for the public /functions/v1/demo-extract endpoint.
-- Limit: 3 demo extractions per IP per 24h.

CREATE TABLE IF NOT EXISTS public.demo_usage (
  ip TEXT PRIMARY KEY,
  day TEXT NOT NULL,           -- 'YYYY-MM-DD'
  count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- ROW-LEVEL SECURITY
-- ============================================================================
-- Only the user can read their own profile/tokens/usage.

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_monthly ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extraction_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "users read own tokens"
  ON public.api_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users read own usage"
  ON public.usage_monthly FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users read own logs"
  ON public.extraction_log FOR SELECT
  USING (auth.uid() = user_id);

-- Edge Functions use the service_role key which bypasses RLS for writes.

-- ============================================================================
-- RPC: increment_usage (atomic upsert + increment for quota tracking)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.increment_usage(p_user_id UUID, p_year_month TEXT)
RETURNS INTEGER LANGUAGE plpgsql AS $$
DECLARE
  new_count INTEGER;
BEGIN
  INSERT INTO public.usage_monthly (user_id, year_month, used)
  VALUES (p_user_id, p_year_month, 1)
  ON CONFLICT (user_id, year_month)
  DO UPDATE SET used = usage_monthly.used + 1
  RETURNING used INTO new_count;
  RETURN new_count;
END;
$$;
