-- PlushUp V0 — schéma initial
-- Principes :
--  * RLS partout, une utilisatrice ne voit que ses lignes ((select auth.uid()) pour la perf).
--  * Le contenu (programme 21 jours, fiches) vit dans le code de l'app (versionné, dispo hors ligne).
--    La base ne stocke QUE les données de l'utilisatrice.
--  * Sync « dernier qui écrit gagne » basée sur client_updated_at, arbitrée côté serveur.
--  * Aucune donnée de santé dans les tables partagées : tout est rattaché à auth.users et supprimé en cascade.

-- ---------------------------------------------------------------------------
-- Utilitaires
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Dernier-écrit-gagne : si la version entrante est plus ancienne que celle stockée, on ignore la mise à jour.
create or replace function public.keep_latest_client_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.client_updated_at < old.client_updated_at then
    return old;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Profil
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text check (char_length(first_name) <= 40),
  locale text not null default 'fr' check (locale in ('fr', 'ar')),
  activity_profile text check (activity_profile in ('seated', 'standing', 'active', 'mixed')),
  goals text[] not null default '{}'
    check (goals <@ array['light_legs', 'comfort', 'silhouette', 'routine', 'confidence']::text[]),
  legging_size text check (legging_size in ('XS', 'S', 'M', 'L', 'XL', 'XXL')),
  reminder_time time,
  timezone text not null default 'Africa/Casablanca' check (char_length(timezone) <= 64),
  onboarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

create policy "profiles: lecture de son profil" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "profiles: création de son profil" on public.profiles
  for insert to authenticated with check (id = (select auth.uid()));
create policy "profiles: mise à jour de son profil" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Consentements (journal append-only : on n'efface ni ne modifie, on ajoute)
-- ---------------------------------------------------------------------------
create table public.consents (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null check (kind in ('terms', 'wellbeing_data', 'reminders', 'analytics', 'whatsapp', 'health_sync', 'photo_backup')),
  granted boolean not null,
  policy_version text not null check (char_length(policy_version) <= 20),
  created_at timestamptz not null default now()
);

create index consents_user_kind_idx on public.consents (user_id, kind, created_at desc);

alter table public.consents enable row level security;

create policy "consents: lecture des siens" on public.consents
  for select to authenticated using (user_id = (select auth.uid()));
create policy "consents: ajout des siens" on public.consents
  for insert to authenticated with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Journal quotidien (1 ligne par jour et par utilisatrice)
-- ---------------------------------------------------------------------------
create table public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  log_date date not null,
  heaviness smallint check (heaviness between 0 and 4),       -- sensation de jambes lourdes (0 = légères)
  swelling smallint check (swelling between 0 and 4),         -- sensation de gonflement ressentie
  comfort smallint check (comfort between 0 and 4),           -- confort du legging
  worn_hours numeric(3, 1) check (worn_hours between 0 and 24),
  wear_slot text check (wear_slot in ('morning', 'afternoon', 'evening', 'all_day', 'none')),
  water_glasses smallint check (water_glasses between 0 and 30),
  note text check (char_length(note) <= 280),
  client_updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, log_date)
);

create index daily_logs_user_updated_idx on public.daily_logs (user_id, updated_at);

create trigger daily_logs_lww
  before update on public.daily_logs
  for each row execute function public.keep_latest_client_write();

alter table public.daily_logs enable row level security;

create policy "daily_logs: lecture des siens" on public.daily_logs
  for select to authenticated using (user_id = (select auth.uid()));
create policy "daily_logs: ajout des siens" on public.daily_logs
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "daily_logs: modif des siens" on public.daily_logs
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "daily_logs: suppression des siens" on public.daily_logs
  for delete to authenticated using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Mensurations (facultatives, repères personnels)
-- ---------------------------------------------------------------------------
create table public.measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  measured_on date not null,
  kind text not null check (kind in ('waist', 'hips', 'thigh', 'calf', 'ankle')),
  value_cm numeric(4, 1) not null check (value_cm between 10 and 250),
  client_updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, measured_on, kind)
);

create index measurements_user_updated_idx on public.measurements (user_id, updated_at);

create trigger measurements_lww
  before update on public.measurements
  for each row execute function public.keep_latest_client_write();

alter table public.measurements enable row level security;

create policy "measurements: lecture des siennes" on public.measurements
  for select to authenticated using (user_id = (select auth.uid()));
create policy "measurements: ajout des siennes" on public.measurements
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "measurements: modif des siennes" on public.measurements
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "measurements: suppression des siennes" on public.measurements
  for delete to authenticated using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Progression dans les programmes (contenu dans l'app, identifié par slug)
-- ---------------------------------------------------------------------------
create table public.program_progress (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  program_slug text not null check (char_length(program_slug) <= 60),
  day_index smallint not null check (day_index between 1 and 60),
  completed_at timestamptz not null default now(),
  primary key (user_id, program_slug, day_index)
);

alter table public.program_progress enable row level security;

create policy "program_progress: lecture de la sienne" on public.program_progress
  for select to authenticated using (user_id = (select auth.uid()));
create policy "program_progress: ajout de la sienne" on public.program_progress
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "program_progress: suppression de la sienne" on public.program_progress
  for delete to authenticated using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Commandes liées (préparé pour l'intégration Shopify : écrit uniquement côté serveur)
-- ---------------------------------------------------------------------------
create table public.linked_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  shopify_order_id text not null unique,
  order_name text not null,
  legging_size text,
  purchased_at timestamptz,
  delivered_at timestamptz,
  status text not null default 'pending' check (status in ('pending', 'delivered', 'cancelled', 'refunded')),
  created_at timestamptz not null default now()
);

create index linked_orders_user_idx on public.linked_orders (user_id);

alter table public.linked_orders enable row level security;

-- Lecture seule pour l'utilisatrice ; l'écriture se fera par une Edge Function (service role) après vérification Shopify.
create policy "linked_orders: lecture des siennes" on public.linked_orders
  for select to authenticated using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Suppression de compte : gérée par l'Edge Function `delete-account` (API admin),
-- la suppression de auth.users entraîne la cascade sur toutes les tables ci-dessus.
-- ---------------------------------------------------------------------------

-- Les fonctions trigger n'ont pas à être appelables via l'API.
revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.keep_latest_client_write() from public, anon, authenticated;
