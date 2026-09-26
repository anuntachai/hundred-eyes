-- เก็บค่าตั้งค่าระบบ เช่น รหัสกลุ่มไลน์หมู่บ้านที่จับจาก webhook
-- ใช้โดย service role เท่านั้น (ไม่มี policy → anon/authenticated เข้าไม่ได้)
create table if not exists public.app_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;
