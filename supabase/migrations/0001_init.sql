create extension if not exists pgcrypto;

-- ==== profiles ====
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 2 and 30),
  house_number text check (char_length(house_number) <= 20),
  locale text not null default 'th' check (locale in ('th','en')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ==== reports ====
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  is_flooded boolean not null default false,
  message text not null check (char_length(btrim(message)) between 1 and 500),
  photos text[] not null default '{}',           -- เก็บ public URL จาก storage
  created_at timestamptz not null default now(),
  flood_notified_at timestamptz                 -- atomic claim กันส่ง push ซ้ำ
);
create index reports_created_at_idx on public.reports (created_at desc);

-- ==== push_subscriptions ====
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  locale text not null default 'th',            -- ภาษา push ตามผู้รับ
  user_agent text,
  created_at timestamptz not null default now()
);

-- ==== updated_at trigger ====
create or replace function public.touch_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ==== feed view: เปิดเผยแค่ชื่อ ไม่เปิดบ้านเลขที่ ====
-- security_invoker = false → view ทำงานในนามเจ้าของ view (bypass RLS ของตารางฐาน)
create or replace view public.v_report_feed
with (security_invoker = false) as
select r.id, r.user_id, r.is_flooded, r.message, r.photos, r.created_at,
       coalesce(p.display_name, 'ผู้ใช้ไม่ระบุชื่อ') as reporter_name
from public.reports r
left join public.profiles p on p.id = r.user_id;
grant select on public.v_report_feed to authenticated;

-- ==== RLS ====
alter table public.profiles           enable row level security;
alter table public.reports            enable row level security;
alter table public.push_subscriptions enable row level security;

create policy "profiles_select_own" on public.profiles
  for select to authenticated using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (auth.uid() = id);

create policy "reports_select_all" on public.reports
  for select to authenticated using (true);
create policy "reports_insert_own" on public.reports
  for insert to authenticated with check (auth.uid() = user_id);
create policy "reports_delete_own" on public.reports
  for delete to authenticated using (auth.uid() = user_id);

create policy "push_select_own" on public.push_subscriptions
  for select to authenticated using (auth.uid() = user_id);
create policy "push_insert_own" on public.push_subscriptions
  for insert to authenticated with check (auth.uid() = user_id);
create policy "push_delete_own" on public.push_subscriptions
  for delete to authenticated using (auth.uid() = user_id);

-- ==== realtime (ลืมบรรทัดนี้ = timeline ไม่อัปเดตสด) ====
alter publication supabase_realtime add table public.reports;

-- ==== storage ====
insert into storage.buckets (id, name, public)
values ('report-photos', 'report-photos', true)
on conflict (id) do nothing;

create policy "report_photos_read_public" on storage.objects
  for select using (bucket_id = 'report-photos');
create policy "report_photos_insert_own" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'report-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "report_photos_delete_own" on storage.objects
  for delete to authenticated using (
    bucket_id = 'report-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
