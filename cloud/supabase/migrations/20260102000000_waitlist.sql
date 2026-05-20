-- Waitlist table — collects pre-launch interest + survey data
CREATE TABLE IF NOT EXISTS public.waitlist (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  tools TEXT[] NOT NULL DEFAULT '{}',
  pain TEXT,
  willing_to_pay TEXT,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notified_beta_at TIMESTAMPTZ,
  notified_launch_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_waitlist_created ON public.waitlist(created_at);
CREATE INDEX IF NOT EXISTS idx_waitlist_willing ON public.waitlist(willing_to_pay);
