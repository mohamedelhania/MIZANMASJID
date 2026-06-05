-- Run this in your Supabase SQL Editor to add the map coordinates
ALTER TABLE public.mosques ADD COLUMN IF NOT EXISTS lat NUMERIC(10, 6);
ALTER TABLE public.mosques ADD COLUMN IF NOT EXISTS lng NUMERIC(10, 6);
