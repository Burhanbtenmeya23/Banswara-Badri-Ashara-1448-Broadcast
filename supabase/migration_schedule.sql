-- Add scheduling columns to settings table
ALTER TABLE public.settings
  ADD COLUMN IF NOT EXISTS broadcast_start_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS broadcast_end_at   TIMESTAMPTZ;
