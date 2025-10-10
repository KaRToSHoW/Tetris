-- Initial migration: create profiles, player_stats, game_settings, records
-- Run this SQL in your Supabase project's SQL editor (or via your migration tooling).

-- Ensure pgcrypto for gen_random_uuid()
create extension if not exists "pgcrypto";

-- Helper to keep updated_at in sync
create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql stable;

-- Profiles table
create table if not exists public.profiles (
  id uuid primary key,
  email text,
  username text,
  display_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute procedure public.touch_updated_at();

-- Player stats table
create table if not exists public.player_stats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  total_games integer default 0,
  total_score bigint default 0,
  best_score bigint default 0,
  total_lines_cleared integer default 0,
  best_level_reached integer default 0,
  total_time_played integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger player_stats_touch_updated_at
  before update on public.player_stats
  for each row execute procedure public.touch_updated_at();

-- Game settings table
create table if not exists public.game_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  player_name text,
  control_mode text,
  show_grid boolean default true,
  sound_enabled boolean default true,
  difficulty text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger game_settings_touch_updated_at
  before update on public.game_settings
  for each row execute procedure public.touch_updated_at();

-- Records (game results)
create table if not exists public.records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  player_name text,
  score bigint,
  level integer,
  lines_cleared integer,
  time_played integer,
  created_at timestamptz default now()
);

-- Optional indexes for performance
create index if not exists idx_records_score on public.records(score desc);
create index if not exists idx_player_stats_user_id on public.player_stats(user_id);

-- End of migration
