-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- USERS SETTINGS (Extends auth.users)
create table public.user_settings (
  id uuid references auth.users not null primary key,
  display_name text,
  avatar_url text,
  google_refresh_token text, -- Encrypted? (Ideally handled by Auth provider, but for custom API access might need storage)
  preferences jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.user_settings enable row level security;
create policy "Users can view own settings" on public.user_settings for select using (auth.uid() = id);
create policy "Users can update own settings" on public.user_settings for update using (auth.uid() = id);
create policy "Users can insert own settings" on public.user_settings for insert with check (auth.uid() = id);

-- TRANSACTIONS (Finance)
create table public.transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  amount decimal(12,2) not null,
  description text not null,
  category text default 'Outros',
  type text check (type in ('income', 'expense')) not null,
  date date default current_date not null,
  is_paid boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.transactions enable row level security;
create policy "Users can view own transactions" on public.transactions for select using (auth.uid() = user_id);
create policy "Users can insert own transactions" on public.transactions for insert with check (auth.uid() = user_id);
create policy "Users can update own transactions" on public.transactions for update using (auth.uid() = user_id);
create policy "Users can delete own transactions" on public.transactions for delete using (auth.uid() = user_id);

-- NOTES / IDEAS (The Brain)
create table public.notes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  content text not null,
  tags text[],
  is_archived boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.notes enable row level security;
create policy "Users can view own notes" on public.notes for select using (auth.uid() = user_id);
create policy "Users can insert own notes" on public.notes for insert with check (auth.uid() = user_id);
create policy "Users can update own notes" on public.notes for update using (auth.uid() = user_id);
create policy "Users can delete own notes" on public.notes for delete using (auth.uid() = user_id);

-- TASKS (Optional, combined with Calendar/Notes?)
-- For now, relying on Google Calendar for events, but maybe internal tasks:
create table public.tasks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  is_completed boolean default false,
  due_date timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.tasks enable row level security;
create policy "Users can view own tasks" on public.tasks for select using (auth.uid() = user_id);
create policy "Users can manage own tasks" on public.tasks for all using (auth.uid() = user_id);

-- TRIGGERS (Auto-create user_settings)
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_settings (id, display_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
