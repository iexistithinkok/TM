-- Profiles table for role-based access control
create table if not exists public.profiles (
  user_id uuid references auth.users (id) primary key,
  role text not null check (role in ('admin', 'client')),
  created_at timestamptz default now()
);

-- Optional: RLS policies (adjust as needed)
alter table public.profiles enable row level security;

create policy "Profiles are viewable by owner"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy "Profiles are updatable by owner"
  on public.profiles for update
  using (auth.uid() = user_id);

-- Admins can manage all profiles (add your own logic as needed)
-- create policy "Admins can manage profiles"
--   on public.profiles for all
--   using (exists (
--     select 1 from public.profiles p
--     where p.user_id = auth.uid() and p.role = 'admin'
--   ));

-- Admin notes (admin-only visibility)
create table if not exists public.admin_notes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null,
  author_id uuid not null references auth.users (id),
  content text not null,
  created_at timestamptz default now()
);

alter table public.admin_notes enable row level security;

create policy "Admins can read admin notes"
  on public.admin_notes for select
  using (
    exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid() and p.role = 'admin'
    )
  );

create policy "Admins can create admin notes"
  on public.admin_notes for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid() and p.role = 'admin'
    )
  );

-- Project messages (admin write, client read scoped by project assignment)
create table if not exists public.project_messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null,
  author_id uuid not null references auth.users (id),
  content text not null,
  created_at timestamptz default now()
);

alter table public.project_messages enable row level security;

create table if not exists public.project_assignments (
  project_id uuid not null,
  user_id uuid not null references auth.users (id),
  created_at timestamptz default now(),
  primary key (project_id, user_id)
);

alter table public.project_assignments enable row level security;

create policy "Admins can manage project assignments"
  on public.project_assignments for all
  using (
    exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid() and p.role = 'admin'
    )
  );

create policy "Admins can read all project messages"
  on public.project_messages for select
  using (
    exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid() and p.role = 'admin'
    )
  );

create policy "Admins can create project messages"
  on public.project_messages for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid() and p.role = 'admin'
    )
  );

create policy "Clients can read assigned project messages"
  on public.project_messages for select
  using (
    exists (
      select 1 from public.project_assignments pa
      where pa.user_id = auth.uid()
        and pa.project_id = project_messages.project_id
    )
  );
