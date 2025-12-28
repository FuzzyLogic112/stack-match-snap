-- Add daily_streak column to track consecutive daily challenge completions
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS daily_streak integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_daily_date date;