# HANDOFF — Hundred Eyes

เอกสารส่งมอบงานสำหรับ implementer (LLM หรือนักพัฒนา) เพื่อสร้างเว็บแอป **Hundred Eyes** ครบทุกฟีเจอร์โดยไม่ต้องตัดสินใจเพิ่ม — ทุก decision ถูกล็อกแล้ว ถ้าพบข้อขัดแย้งในเอกสารนี้ ให้ยึดหัวข้อ "Decisions ที่ล็อกแล้ว" เป็นหลัก

> **สถานะ repo ปัจจุบัน:** git repository ว่าง (branch `master`, ไม่มี commit, ไม่มีไฟล์) — เริ่มสร้างโครงการใหม่ทั้งหมด
> **ห้าม commit/push** โดยไม่ได้รับคำขอจากเจ้าของ repo

---

## 0. สรุปการเปลี่ยนแปลงจาก spec ต้นฉบับ

- **ชื่อแอปใช้ "Hundred Eyes" เท่านั้น** ทั้งภาษาไทยและอังกฤษ (ไม่มี "ร้อยดวงตา") — รวมถึง manifest, metadata, header, onboarding, dictionary ทั้งสองภาษา
- เพิ่ม i18n keys ที่จำเป็นต่อการ implement จริง: `report.delete`, `report.deleteConfirm`, `notif.heading`, `settings.language`, `setup.title`, `setup.body`, `error.throttled`, `install.iosHint`, `alarm.banner` (ตารางครบใน §14)
- เพิ่มรายละเอียดระดับ implementation: config files ฉบับเต็ม, service worker ฉบับเต็ม, สคริปต์สร้าง icons, แผนทดสอบ unit + smoke + acceptance 13 ข้อ

---

## 1. ภาพรวมผลิตภัณฑ์

| ชื่อ | Hundred Eyes |
|---|---|
| ปัญหา | เพื่อนบ้านในหมู่บ้านไม่รู้ทันทีเมื่อมีน้ำท่วมเข้ามา |
| โซลูชัน | เว็บแอป PWA ให้ทุกคนรายงานสถานการณ์น้ำ พร้อมแจ้งเตือน+เสียงเตือนแก่ผู้ใช้ทุกคนเมื่อมีรายงาน "น้ำท่วมเข้าหมู่บ้าน" |
| ขอบเขต | หมู่บ้านเดียวต่อ 1 deployment (ไม่มี multi-village ใน v1) |
| ผู้ใช้ | เพื่อนบ้านทั่วไป อายุหลากหลาย → ใช้ง่ายที่สุด ปุ่มใหญ่ ภาษาไทยเป็นหลัก |
| Non-goals v1 | คอมเมนต์/react, แผนที่, แอดมิน/moderation, offline draft, แชท, dark mode |

**User flows หลัก**

1. **สมัคร** — เปิดแอปครั้งแรก → กรอกชื่อ (บังคับ) + บ้านเลขที่ (ไม่บังคับ) → สร้าง anonymous account เก็บ session ใน browser → เข้าหน้าหลัก
2. **รายงาน** — หน้าหลัก → ปุ่ม "รายงานสถานการณ์" → พิมพ์ข้อความ + ถ่าย/เลือกภาพ (≤6) + ติ๊ก "มีน้ำท่วมเข้ามาในหมู่บ้าน" (default **uncheck**) → ส่ง → กลับหน้าหลัก เห็นรายงานขึ้นบนสุดของ timeline
3. **รับแจ้งเตือน** — ผู้ใช้อื่นที่เปิด notification ไว้ ได้ Web Push (เสียงตาม OS) และถ้าแอปเปิดอยู่ (ทุกหน้า) ได้เสียงไซเรนในแอป + แบนเนอร์แดง + vibrate (Android)
4. **Timeline** — หน้าหลักแสดงรายงานล่าสุดบนสุด อัปเดตแบบ real-time โดยไม่ต้อง refresh

---

## 2. Decisions ที่ล็อกแล้ว (ห้ามเปลี่ยนโดยไม่มีเหตุผลชัดเจน)

| หัวข้อ | Decision |
|---|---|
| Framework | Next.js 15 App Router + TypeScript strict |
| Styling | Tailwind CSS v4 (ไม่ใช้ UI kit — เขียน component เองให้น้อยสุด) |
| Backend | Supabase free tier, region **Singapore (sin1)** — DB + anonymous auth + storage + realtime |
| Auth | Supabase anonymous sign-in + profile row (ไม่มีรหัสผ่าน ไม่มีอีเมล) — session เก็บใน browser; ล้าง browser = บัญชีหาย กู้คืนไม่ได้ (ผู้ใช้ตกลงแล้ว) |
| Push | Web Push + VAPID ผ่าน `web-push@3` ส่งจาก API route `/api/notify-flood` บน Vercel (server เท่านั้น) |
| เสียง push | เสียง default ของ OS (ข้อจำกัดที่ผู้ใช้ตกลงแล้ว) |
| PWA | Hand-rolled service worker ที่ `public/sw.js` (ไม่ใช้ Serwist/next-pwa) |
| i18n | Custom provider + dictionary th/en + localStorage (ไม่ใช้ next-intl, ไม่ทำ locale routing) |
| Font | `IBM Plex Sans Thai` ผ่าน `next/font/google`, weights 400/500/600/700, subsets latin+thai, CSS variable `--font-plex` |
| วันที่/เวลา | `Intl.RelativeTimeFormat` (ไม่ใช้ date lib) |
| Deploy | Vercel (HTTPS บังคับสำหรับ push + PWA) |
| ชื่อแอป | "Hundred Eyes" ทั้งสองภาษา — ไม่มีชื่อไทยแยก |

---

## 3. Tech Stack + `package.json` พร้อมใช้

```json
{
  "name": "hundred-eyes",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "prebuild": "node scripts/generate-icons.mjs",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.49.4",
    "next": "^15.3.1",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "web-push": "^3.6.7"
  },
  "devDependencies": {
    "@eslint/eslintrc": "^3.3.0",
    "@tailwindcss/postcss": "^4.1.5",
    "@types/node": "^22.14.0",
    "@types/react": "^19.1.0",
    "@types/react-dom": "^19.1.0",
    "@types/web-push": "^3.6.3",
    "eslint": "^9.25.0",
    "eslint-config-next": "^15.3.1",
    "postcss": "^8.5.3",
    "sharp": "^0.34.1",
    "tailwindcss": "^4.1.5",
    "typescript": "^5.8.3",
    "vitest": "^3.1.1"
  }
}
```

หมายเหตุ: ติดตั้งด้วย `npm install` — ห้ามเพิ่ม dependency อื่นนอกจากมีเหตุผลจำเป็น

---

## 4. Config Files พร้อมใช้

**`tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", "public/sw.js", "scripts", "supabase"]
}
```

**`next.config.ts`** — remotePatterns เป็นค่าคงที่ (ไม่ derive จาก env ตอน build)

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**.supabase.co" }],
  },
};

export default nextConfig;
```

**`postcss.config.mjs`**

```js
const config = { plugins: ["@tailwindcss/postcss"] };
export default config;
```

**`eslint.config.mjs`**

```js
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [...compat.extends("next/core-web-vitals", "next/typescript")];

export default eslintConfig;
```

**`vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
```

**`src/app/globals.css`** (Tailwind v4 theme tokens)

```css
@import "tailwindcss";

@theme {
  --color-primary: #0284c7;
  --color-primary-hover: #0369a1;
  --color-danger: #dc2626;
  --color-danger-bg: #fef2f2;
  --color-success: #16a34a;
  --color-surface: #f8fafc;
  --font-sans: var(--font-plex), ui-sans-serif, system-ui, -apple-system, sans-serif;
}
```

ใช้ได้ทันทีเป็น utility: `bg-primary`, `hover:bg-primary-hover`, `text-danger`, `bg-danger-bg`, `bg-surface`, `font-sans` (สีอื่นใช้ default palette ของ Tailwind เช่น `slate-900`, `sky-50`)

**`.env.example`**

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:admin@example.com
```

**`.gitignore`** — มาตรฐาน Next.js: `node_modules/`, `.next/`, `out/`, `.env*.local`, `.vercel`, `next-env.d.ts`, `*.tsbuildinfo`

---

## 5. สถาปัตยกรรม + Environment Variables

```
Browser (PWA)
 ├─ Next.js pages (client) ── Supabase client (anon key):
 │    auth session (localStorage), select v_report_feed,
 │    realtime channel on public.reports, upload รูปเข้า storage,
 │    insert reports / push_subscriptions (ผ่าน RLS ของตัวเอง)
 ├─ /api/notify-flood (Vercel serverless, nodejs runtime) ── service role:
 │    atomic claim → list subscriptions → web-push ทั้งหมด → ลบ endpoint ตาย
 └─ public/sw.js ── push event → showNotification / notificationclick → focus app
Supabase (region sin1)
 ├─ auth: anonymous users
 ├─ tables: profiles, reports, push_subscriptions + view v_report_feed
 ├─ storage bucket: report-photos (public read)
 └─ realtime: postgres_changes INSERT บน public.reports
```

**เหตุผลที่ต้องมี API route:** VAPID private key ต้องอยู่ server เท่านั้น client ส่ง push เองไม่ได้ → มี server route เดียวคือ `/api/notify-flood` ส่วนการ subscribe push ทำจาก client ตรง ๆ ผ่าน RLS (แทรก/แก้แถวของตัวเอง)

| ตัวแปร | ใช้ที่ไหน | หมายเหตุ |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | client | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client | |
| `SUPABASE_SERVICE_ROLE_KEY` | server เท่านั้น | **ห้าม** ขึ้นต้น NEXT_PUBLIC |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | client (subscribe) | ค่าเดียวกับ `VAPID_PUBLIC_KEY` |
| `VAPID_PUBLIC_KEY` | server | |
| `VAPID_PRIVATE_KEY` | server | สร้างด้วย `npx web-push generate-vapid-keys` |
| `VAPID_SUBJECT` | server | `mailto:` — ค่า default ในโค้ดใช้ `mailto:admin@example.com` |

---

## 6. SQL Migration ฉบับเต็ม (copy-paste ได้)

ไฟล์: `supabase/migrations/0001_init.sql` — รันผ่าน SQL Editor ใน Supabase Dashboard หรือ `supabase db push`

```sql
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
```

**หมายเหตุความปลอดภัย**

- บ้านเลขที่เป็นข้อมูลส่วนตัว → RLS เข้าถึงได้แค่เจ้าของ; feed ใช้ view แสดงแค่ `reporter_name`
- bucket `report-photos` เป็น public read → รูปคือ public link (ยอมรับได้สำหรับ village app)
- `service_role` ใช้เฉพาะใน `/api/notify-flood`
- storage path pattern: `report-photos/{auth.uid}/{uuid}.jpg` — ตรงกับ policy `(storage.foldername(name))[1] = auth.uid()::text`

---

## 7. Auth Flow (passwordless)

**`src/lib/supabase/client.ts`** — singleton ที่ **ไม่ throw ตอน import** (env อาจยังไม่ตั้ง)

```ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (typeof window === "undefined") return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  client ??= createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
  });
  return client;
}
```

- Session persist ใน localStorage อัตโนมัติ + auto-refresh
- ถ้า env ไม่มี → return `null` → UI แสดงหน้า `setup.title` / `setup.body`

**`src/hooks/useSession.ts`** — state machine (ใช้ gate ทุกหน้า)

```
{ status: "loading" }
{ status: "noconfig" }                          → หน้า setup
{ status: "error" }                             → หน้า error + ปุ่มลองใหม่ (refresh)
{ status: "onboard"; hasAuthUser: boolean }     → หน้า Onboarding
{ status: "ready"; profile: Profile; userId: string }
```

- `refresh()` = `auth.getSession()` → ไม่มี session → onboard; มี session แต่ไม่มี profile row → onboard (`hasAuthUser: true`); ครบ → ready
- ผูก `auth.onAuthStateChange` — event `SIGNED_OUT` → กลับ `onboard`
- ทุก query ต้อง try/catch → ผลคือ `error` ไม่ใช่ onboard (กันการสร้างบัญชีใหม่ทับบัญชีเดิมตอนเน็ตสะดุด)

**`src/lib/account.ts`**

```ts
createAccount({ displayName, houseNumber, locale }) — คืน { ok: true } | { ok: false }
  1. sb.auth.getSession() → มี userId อยู่แล้วใช้อันเดิม
  2. ไม่มี → sb.auth.signInAnonymously() → เอา user.id
  3. sb.from("profiles").upsert({ id: userId, display_name, house_number, locale })
saveProfile({ display_name, house_number, locale }) — update แถวของตัวเอง (eq id)
signOut() — sb.auth.signOut()
```

**Onboarding gate** ใช้กับทุกหน้า (`/`, `/report`, `/settings`): ถ้า status ไม่ in-flight → render ตาม state; `onDone` ของ Onboarding → เรียก `refresh()` ของ useSession

**สำคัญ (ทำใน Dashboard ไม่ได้ด้วย SQL):** ต้องเปิด Anonymous sign-in ที่ Supabase Dashboard → Authentication → Sign In / Providers → Anonymous → Enable (ดู §18)

---

## 8. Push Notification

### 8.1 การขอสิทธิ์ (UX-first)

- **ห้าม** เรียก `Notification.requestPermission()` ตอนเปิดแอปทันที
- แสดงการ์ด/ปุ่ม "เปิดรับการแจ้งเตือนน้ำท่วม" (หลัง onboarding บนหน้าหลัก และใน /settings) → กดแล้วจึงขอสิทธิ์
- ถ้าเป็น iOS และไม่ได้อยู่ใน standalone mode → แสดง `notif.iosHint` (iOS ≥16.4 ต้อง install PWA ก่อน)

**`src/lib/push.ts`**

```ts
urlBase64ToUint8Array(base64: string): Uint8Array
  // เติม padding "=" ตาม modulo 4 → แปลง -_ เป็น +/ → atob → Uint8Array

enablePushNotifications(locale: "th" | "en"): Promise<"granted" | "denied" | "unsupported" | "error">
  1. เช็ค "serviceWorker" in navigator && "PushManager" in window && "Notification" in window
     ไม่ครบ → "unsupported"
  2. Notification.permission === "default" → await requestPermission()
     ผลไม่ใช่ "granted" → "denied"
  3. NEXT_PUBLIC_VAPID_PUBLIC_KEY ไม่มี → "error"
  4. reg = await navigator.serviceWorker.ready
  5. sub = await reg.pushManager.getSubscription()
     ยังไม่มี → subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(key) })
     มีแล้วแต่ toJSON().keys ไม่ครบ (key เก่า) → unsubscribe แล้ว subscribe ใหม่
  6. json = sub.toJSON() — ต้องมี endpoint + keys.p256dh + keys.auth ไม่งั้น "error"
  7. upsert ลง push_subscriptions:
     { user_id: session.user.id, endpoint, p256dh, auth, locale, user_agent: navigator.userAgent }
     ด้วย onConflict: "endpoint"   ← heal ซับสไครป์ซ้ำ/เปลี่ยนแปลง
  8. คืน "granted"
  (ทั้งหมด try/catch → "error")
```

**Subscription healing:** `usePushPermission` — เมื่อ mount และ permission เป็น "granted" ให้ตรวจว่ามี subscription จริง (ทั้งใน pushManager และ DB) ถ้าไม่มี → subscribe + upsert เงียบ ๆ (รองรับเครื่องใหม่ที่ permission ค้าง granted แต่ยังไม่ได้ subscribe)

### 8.2 การส่ง — `src/app/api/notify-flood/route.ts`

```ts
export const runtime = "nodejs";
POST body: { "reportId": "<uuid>" }
```

ขั้นตอน (logic หลักแยกเป็น `src/lib/notify.ts` แบบ inject dependencies เพื่อ unit test ได้ — ดู §17):

```
0. env ไม่ครบ (SUPABASE_SERVICE_ROLE_KEY, VAPID_*) → 500 { error: "server_not_configured" }
   body ไม่ใช่ { reportId: uuid } → 400 { error: "invalid_body" }
1. สร้าง supabase client ด้วย service_role, persistSession: false
2. ATOMIC CLAIM (กันส่งซ้ำ/กัน race):
   db.from("reports").update({ flood_notified_at: now })
     .eq("id", reportId).eq("is_flooded", true).is("flood_notified_at", null)
     .select("id, user_id, message").maybeSingle()
   ได้ row = claim สำเร็จ / ได้ null = (แจ้งแล้ว | ไม่ใช่น้ำท่วม | ไม่มีรายงาน) → คืน { sent: false }
   (เหตุผลที่ update ก่อนส่ง: ถ้าสอง request เข้าพร้อมกัน ตัวที่ชนะคือตัวเดียวที่ส่ง)
3. reporter_name ← db.from("v_report_feed").select("reporter_name").eq("id", reportId).maybeSingle()
4. subs ← db.from("push_subscriptions").select("endpoint, p256dh, auth, locale, user_id")
5. targets = subs.filter(s => s.user_id !== report.user_id)   // คนรายงานไม่เตือนตัวเอง
6. ส่งพร้อมกันทั้งหมด (Promise.allSettled):
   webpush.sendNotification({ endpoint, keys: { p256dh, auth } }, JSON.stringify(payload),
                            { vapidDetails: { publicKey, privateKey, subject }, TTL: 86400 })
   - error.statusCode 404 หรือ 410 → delete แถว push_subscriptions ที่ endpoint นั้น
7. คืน 200 { sent: true, delivered: n, removed: n, skipped: n }
   (steps 2–6 throw → 500 { error: "broadcast_failed" })
```

**Payload** — สร้างด้วย `src/lib/push-texts.ts`

```ts
buildPushPayload(locale, reporterName, message): { title, body, tag, data }
  truncate(message, 80)  // เกิน 80 ตัวตัดเหลือ 79 + "…"
  name ว่าง → fallback: th "เพื่อนบ้าน" / en "A neighbour"
  th: { title: "⚠️ แจ้งเตือนน้ำท่วม",
        body: `${name} รายงานน้ำท่วมเข้าหมู่บ้าน: ${msg80}`, tag: "flood-alert", data: { url: "/" } }
  en: { title: "⚠️ Flood Alert",
        body: `${name} reported flooding in the village: ${msg80}`, tag: "flood-alert", data: { url: "/" } }
```

หมายเหตุ: หัว push เป็นข้อความแจ้งเตือน ไม่ใช่ชื่อแอป → แปลตาม locale ของผู้รับ (`sub.locale`) ได้

### 8.3 Client flow หลังกดส่งรายงาน (เรียงตามลำดับ)

```
1. compress รูปทุกภาพ (§15) → upload storage → เก็บ public URL
2. insert แถว reports { user_id, is_flooded, message, photos }
3. ถ้า is_flooded = true → fetch("/api/notify-flood", { method: "POST", body: { reportId } })
   แบบ fire-and-forget (ไม่ block UI; server verify ความจริงอีกที — spoof ได้แค่
   "ขอให้ส่งซ้ำรายงานที่มีอยู่จริงและถูก claim ไปแล้ว" = idempotent)
4. mark throttle (localStorage he-last-report-at)
5. router.push("/") + toast "ส่งรายงานแล้ว"
```

---

## 9. Realtime + เสียงเตือนในแอป

### 9.1 `src/hooks/useFeed.ts` — data

```
useFeed(enabled: boolean) → { items, status, hasMore, loadMore, loadInitial, remove }
- enabled = true เมื่อ session ready เท่านั้น (feed ต้องใช้ authenticated)
- loadInitial: from("v_report_feed").select("*").order("created_at", { ascending: false }).limit(30)
  → items, hasMore = (data.length === 30), status: loading|ready|error
- loadMore: .range(offset, offset + 29) โดย offset = items ปัจจุบัน
- realtime: sb.channel("feed-inserts").on("postgres_changes",
    { event: "INSERT", schema: "public", table: "reports" }, handler).subscribe()
  handler = refetch 30 แถวบนสุด → mergeReports(prev, fresh) (dedupe ตาม id + sort desc)
- remove(id) = ลบออกจาก state หลังลบรายงานสำเร็จ
- cleanup: sb.removeChannel(channel)
```

**`src/lib/feed.ts`** (pure — unit test ได้)

```ts
mergeReports(a, b): FeedItem[]      // union ตาม id (ข้อมูลเดิมชนะ), sort created_at desc ด้วย Date.parse
activeFloodReport(items, now): FeedItem | null   // flooded ล่าสุดที่อยู่ใน 3 ชม. (FLOOD_ALERT_WINDOW_HOURS)
```

### 9.2 `src/components/FloodWatch.tsx` — alarm (mounted ทุกหน้าเมื่อ session ready)

เหตุผลที่แยกจาก useFeed: ต้องเตือนทั้ง `/`, `/report`, `/settings` — ไม่ใช่เฉพาะหน้าที่มี timeline

```
- subscribe realtime INSERT บน public.reports (channel "flood-watch")
- payload.new.is_flooded && user_id !== myUserId && id ไม่เคยเตือน (Set dedupe)
  → playFloodAlarm() + แสดงแบนเนอร์แดง fixed ใต้ header: alarm.banner
    (มีปุ่มปิด + auto-dismiss หลัง 15 วินาที)
- รายงานของตัวเอง → ไม่มีเสียง ไม่มีแบนเนอร์
```

### 9.3 `src/lib/alarm.ts` — ไซเรน Web Audio (ไม่ต้องมีไฟล์เสียง)

```ts
sirenSchedule(cycles = 8, interval = 0.25, high = 800, low = 600): { at: number; freq: number }[]
  // [{at: 0, freq: 800}, {at: 0.25, freq: 600}, ... สลับกัน 8 ช่วง ≈ 2 วินาที]

unlockAudio(): boolean
  // สร้าง/resume AudioContext ครั้งแรกที่มี user gesture — ห้าม instantiate ตอน module load

playFloodAlarm(): void
  // sine oscillator + gain 0.15:
  //   gain: setValueAtTime(0.0001) → exponentialRampToValueAtTime(0.15, +0.06s)
  //   ทุก segment ของ sirenSchedule → osc.frequency.setValueAtTime(freq, t0 + at)
  //   จบ: exponentialRampToValueAtTime(0.0001, t0 + 2s), osc.start(t0), osc.stop(t0 + 2)
  //   ทั้งหมดใน try/catch (อุปกรณ์ไม่มีเสียง → ไม่ crash)
  // + navigator.vibrate?.([400, 150, 400, 150, 400]) ใน try/catch
```

- เรียก `unlockAudio()` ตอนกดปุ่ม "เริ่มใช้งาน" ของ onboarding และปุ่ม "ทดสอบเสียงเตือน" ใน /settings (user gesture)
- `notif.testSound` ใน /settings: unlockAudio() + playFloodAlarm() — ทั้งให้ผู้ใช้รู้จักเสียง ทั้ง unlock ให้ระบบ

---

## 10. Service Worker — `public/sw.js` (hand-rolled, ฉบับเต็ม)

```js
const CURRENT_CACHE = "hundred-eyes-v1";
const PRECACHE_URLS = [
  "/",
  "/offline",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CURRENT_CACHE);
      await Promise.allSettled(PRECACHE_URLS.map((u) => cache.add(u)));
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== CURRENT_CACHE).map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Supabase ฯลฯ → network เสมอ
  if (url.pathname.startsWith("/api/")) return;

  if (req.mode === "navigate") {
    // network-first → cache '/' → cache '/offline'
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          const cache = await caches.open(CURRENT_CACHE);
          cache.put(req, fresh.clone()).catch(() => {});
          return fresh;
        } catch {
          const cache = await caches.open(CURRENT_CACHE);
          return (
            (await cache.match(req)) ||
            (await cache.match("/")) ||
            (await cache.match("/offline")) ||
            Response.error()
          );
        }
      })()
    );
    return;
  }

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/_next/image")) {
    // cache-first (รูปผ่าน /_next/image ทำให้เปิดออฟไลน์แล้วยังเห็นรูปเก่าได้)
    event.respondWith(
      (async () => {
        const cache = await caches.open(CURRENT_CACHE);
        const hit = await cache.match(req);
        if (hit) return hit;
        try {
          const fresh = await fetch(req);
          if (fresh.ok) cache.put(req, fresh.clone()).catch(() => {});
          return fresh;
        } catch {
          return hit || Response.error();
        }
      })()
    );
  }
});

self.addEventListener("push", (event) => {
  let data = { title: "⚠️ Flood Alert", body: "", tag: "flood-alert", url: "/" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {}
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      tag: data.tag,
      icon: "/icons/icon-192.png",
      badge: "/icons/badge-72.png",
      vibrate: [400, 150, 400],
      data: { url: data.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      const url = (event.notification.data && event.notification.data.url) || "/";
      const windowClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const clientWindow of windowClients) {
        if ("focus" in clientWindow) {
          await clientWindow.focus();
          return;
        }
      }
      await self.clients.openWindow(url);
    })()
  );
});
```

**การ register** — `src/components/ServiceWorkerRegister.tsx` (client component, render null)

```tsx
useEffect(() => {
  if (process.env.NODE_ENV !== "production") return;   // ไม่ register ใน dev
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
}, []);
```

- **ห้าม cache โดเมน Supabase** (จะพัง auth/realtime) — โค้ดข้างบนกรองด้วย origin check แล้ว
- `event.waitUntil` ใน push handler จำเป็น ไม่งั้น Android บางรุ่น drop notification

---

## 11. PWA

### 11.1 `src/app/manifest.ts` (MetadataRoute.Manifest — ไม่ต้องมีไฟล์ JSON)

```ts
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hundred Eyes",
    short_name: "Hundred Eyes",
    description: "Village flood situation reporting — แอปรายงานสถานการณ์น้ำท่วมของหมู่บ้าน",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#0284c7",
    lang: "th",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
```

### 11.2 Icons — สร้างอัตโนมัติ (ไม่ต้องมีไฟล์ binary ต้นทาง)

**`assets/icon.svg`** (glyph พื้นหลังกลมสีน้ำเงิน + ดวงตา)

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <circle cx="256" cy="256" r="248" fill="#0284c7"/>
  <path d="M256 168c-72 0-132 46-168 88 36 42 96 88 168 88s132-46 168-88c-36-42-96-88-168-88z" fill="#ffffff"/>
  <circle cx="256" cy="256" r="46" fill="#0f172a"/>
  <circle cx="272" cy="240" r="13" fill="#ffffff" opacity="0.9"/>
</svg>
```

**`assets/icon-maskable.svg`** (full-bleed + glyph 62% อยู่ใน safe zone)

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#0284c7"/>
  <g transform="translate(256 256) scale(0.62) translate(-256 -256)">
    <path d="M256 168c-72 0-132 46-168 88 36 42 96 88 168 88s132-46 168-88c-36-42-96-88-168-88z" fill="#ffffff"/>
    <circle cx="256" cy="256" r="46" fill="#0f172a"/>
    <circle cx="272" cy="240" r="13" fill="#ffffff" opacity="0.9"/>
  </g>
</svg>
```

**`scripts/generate-icons.mjs`**

```js
import sharp from "sharp";
import { mkdir, readFile } from "node:fs/promises";

const OUT_DIR = "public/icons";

const icon = await readFile("assets/icon.svg", "utf8");
const maskable = await readFile("assets/icon-maskable.svg", "utf8");

await mkdir(OUT_DIR, { recursive: true });

async function render(svg, size, name) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(`${OUT_DIR}/${name}`);
}

await render(icon, 192, "icon-192.png");
await render(icon, 512, "icon-512.png");
await render(maskable, 192, "icon-maskable-192.png");
await render(maskable, 512, "icon-maskable-512.png");
await render(maskable, 180, "apple-touch-icon.png");
await render(maskable, 72, "badge-72.png");

console.log("icons generated in", OUT_DIR);
```

- สคริปต์นี้ถูกเรียกโดย `prebuild` อัตโนมัติ **และให้ commit ผลลัพธ์ PNG ลง repo ด้วย** (regenerate ได้ผลเดิม — idempotent; ทำให้ deploy ไม่พังถ้า sharp มีปัญหาบน CI)
- ใช้ icon เดียวกันเป็น favicon: สร้าง `src/app/icon.svg` ด้วยเนื้อหาเดียวกับ `assets/icon.svg`

### 11.3 Metadata ใน `src/app/layout.tsx`

```ts
export const metadata: Metadata = {
  title: "Hundred Eyes",
  description: "แอปรายงานสถานการณ์น้ำท่วมของหมู่บ้าน | Village flood situation reporting app",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Hundred Eyes" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0284c7",
};
```

- `<html lang="th">` — และ I18nProvider อัปเดต `document.documentElement.lang` ตาม locale ที่เลือก
- ฟอนต์: `IBM_Plex_Sans_Thai({ weight: ["400","500","600","700"], subsets: ["latin","thai"], variable: "--font-plex" })` → ใส่ className ที่ `<body>` พร้อม `font-sans bg-surface text-slate-900`

### 11.4 Install prompt — `src/hooks/useInstallPrompt.ts`

```
{ canInstall, promptInstall, isIOS, standalone }
- จับ event "beforeinstallprompt" → preventDefault + เก็บ event → canInstall = true
  promptInstall() → event.prompt() + เคลียร์ state
- isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
- standalone = matchMedia("(display-mode: standalone)").matches || (isIOS && navigator.standalone === true)
- canInstall → ปุ่ม install.install (header / settings)
- isIOS && !standalone → แสดง hint install.iosHint (ไม่มี beforeinstallprompt บน iOS)
```

---

## 12. โครงสร้างไฟล์ทั้งหมด

```
├─ package.json
├─ tsconfig.json
├─ next.config.ts
├─ postcss.config.mjs
├─ eslint.config.mjs
├─ vitest.config.ts
├─ .env.example
├─ .gitignore
├─ next-env.d.ts                        # next build สร้างให้ — อยู่ใน .gitignore
├─ assets/
│  ├─ icon.svg
│  └─ icon-maskable.svg
├─ scripts/
│  └─ generate-icons.mjs
├─ supabase/
│  └─ migrations/0001_init.sql
├─ public/
│  ├─ sw.js
│  └─ icons/                            # ผลจาก prebuild (commit ด้วย)
│     ├─ icon-192.png, icon-512.png
│     ├─ icon-maskable-192.png, icon-maskable-512.png
│     ├─ apple-touch-icon.png
│     └─ badge-72.png
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx                     # font, metadata, providers, SW register
│  │  ├─ globals.css
│  │  ├─ page.tsx                       # Home (gate + banner + timeline + CTA)
│  │  ├─ report/page.tsx
│  │  ├─ settings/page.tsx
│  │  ├─ offline/page.tsx
│  │  ├─ manifest.ts
│  │  ├─ icon.svg                       # favicon (เนื้อหาเดียวกับ assets/icon.svg)
│  │  └─ api/notify-flood/route.ts
│  ├─ components/
│  │  ├─ AppHeader.tsx                  # โลโก้ + ชื่อ | InstallButton | LanguageToggle | ⚙ + ปุ่มรายงาน (desktop)
│  │  ├─ EyeLogo.tsx                    # inline SVG ดวงตา
│  │  ├─ LanguageToggle.tsx             # segmented ไทย/EN
│  │  ├─ InstallButton.tsx
│  │  ├─ FloodWatch.tsx                 # realtime alarm + แบนเนอร์แดง (ทุกหน้า)
│  │  ├─ FloodBanner.tsx                # แบนเนอร์จาก feed data (active ใน 3 ชม.)
│  │  ├─ Timeline.tsx                   # + skeleton + error + empty
│  │  ├─ ReportCard.tsx                 # ชื่อ/เวลา/แบดจ์/ข้อความ/รูป/ลบของตัวเอง
│  │  ├─ PhotoGrid.tsx
│  │  ├─ Lightbox.tsx                   # เต็มจอ + ปุ่ม ←/→ + Esc/ลูกศร
│  │  ├─ Onboarding.tsx
│  │  ├─ NotificationSetup.tsx          # การ์ดชวนเปิด notification (หน้าหลัก)
│  │  ├─ ReportForm.tsx
│  │  ├─ PhotoPicker.tsx                # ถ่ายภาพ / เลือกภาพถ่าย + preview + ลบ
│  │  ├─ Toast.tsx                      # ToastProvider + useToast
│  │  └─ ServiceWorkerRegister.tsx
│  ├─ lib/
│  │  ├─ supabase/client.ts
│  │  ├─ supabase/types.ts              # Profile, Report, FeedItem (manual types)
│  │  ├─ i18n/{provider.tsx, th.ts, en.ts, index.ts}
│  │  ├─ account.ts                     # createAccount, saveProfile, signOut
│  │  ├─ alarm.ts
│  │  ├─ compress.ts
│  │  ├─ constants.ts
│  │  ├─ feed.ts                        # mergeReports, activeFloodReport (pure)
│  │  ├─ notify.ts                      # broadcastFloodNotification (injectable deps)
│  │  ├─ push.ts
│  │  ├─ push-texts.ts                  # buildPushPayload, truncate (pure)
│  │  ├─ reltime.ts
│  │  ├─ throttle.ts
│  │  └─ validate.ts
│  ├─ hooks/
│  │  ├─ useSession.ts
│  │  ├─ useFeed.ts
│  │  ├─ usePushPermission.ts
│  │  └─ useInstallPrompt.ts
│  └─ __tests__/                        # unit tests (ดู §17)
│     ├─ i18n.test.ts, reltime.test.ts, push.test.ts, validate.test.ts,
│     ├─ push-texts.test.ts, feed.test.ts, alarm.test.ts, compress.test.ts,
│     └─ throttle.test.ts, notify.test.ts
```

**`src/lib/constants.ts`**

```ts
export const MAX_PHOTOS = 6;
export const PAGE_SIZE = 30;
export const FLOOD_ALERT_WINDOW_HOURS = 3;
export const REPORT_THROTTLE_MS = 30_000;
export const STORAGE_BUCKET = "report-photos";
export const LOCALE_STORAGE_KEY = "he-locale";
export const LAST_REPORT_KEY = "he-last-report-at";
```

**`src/lib/supabase/types.ts`**

```ts
export interface Profile {
  id: string; display_name: string; house_number: string | null;
  locale: string; created_at: string; updated_at: string;
}
export interface Report {
  id: string; user_id: string; is_flooded: boolean; message: string;
  photos: string[]; created_at: string; flood_notified_at: string | null;
}
export interface FeedItem extends Report { reporter_name: string; }
```

---

## 13. UI/UX Spec

### 13.1 Design tokens — ดู `globals.css` ใน §4 (light theme only ใน v1)

- Card: `rounded-xl border border-slate-200 bg-white p-4 shadow-sm`
- ปุ่มหลัก: `rounded-full bg-primary px-4 py-2 font-semibold text-white` (hover: `bg-primary-hover`)
- CTA รายงาน (มือถือ): `rounded-2xl` ขนาดใหญ่ `py-4 text-lg`
- แบดจ์น้ำท่วม: `rounded-full bg-danger-bg px-2 py-0.5 text-xs font-bold text-danger`
- แบนเนอร์/การ์ดแจ้งเตือน: พื้น `bg-danger` ตัวอักษรขาว
- การ์ดชวนเปิด notification: `border-sky-200 bg-sky-50` ข้อความ `text-sky-900`

### 13.2 หน้าหลัก `/` (flow ตาม session state)

```
loading  → full-screen spinner กึ่งกลาง
noconfig → หน้า setup.title/setup.body (ข้อความเดียว กึ่งกลาง)
error    → error.network + ปุ่ม retry (เรียก refresh)
onboard  → <Onboarding hasAuthUser onDone={refresh} />
ready    →
  <AppHeader />
  <FloodWatch userId />
  <main className="mx-auto max-w-2xl px-4 pb-28 pt-4 sm:pb-10">
    {activeFloodReport(items) && <FloodBanner item />}       // แบนเนอร์จาก data
    <NotificationSetup />                                    // ถ้ายังไม่ได้เปิด notification
    <section>
      <h2>home.timeline</h2>
      <Timeline items status hasMore loadMore myUserId onDeleted={remove} />
    </section>
  </main>
  // CTA มือถือ: fixed bottom-0 inset-x-0 z-40 p-4 sm:hidden
  //   padding-bottom: calc(1rem + env(safe-area-inset-bottom))
  //   <Link href="/report" ปุ่มใหญ่เต็มกว้าง home.reportCta>
  // desktop: ปุ่มรายงานอยู่ใน AppHeader (hidden sm:inline-flex)
```

- **FloodBanner (data)**: `bg-danger` + `role="alert"` + ไอคอน ⚠️ + home.floodBanner + relative time; กด → `document.getElementById("report-{id}")?.scrollIntoView({ behavior: "smooth", block: "center" })`; การ์ดรายงานต้องมี `id={`report-${item.id}`}` และ `scroll-mt-20`
- **Timeline states**: loading → skeleton 3 ใบ (animate-pulse) | error → error.network + ปุ่ม retry (loadInitial) | ว่าง → EmptyState home.empty | ปกติ → ReportCard ทั้งหมด + ถ้า hasMore → ปุ่ม home.loadMore กึ่งกลาง

**ReportCard**

```
<article id={`report-${item.id}`} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
  header: reporter_name (font-semibold)
    + is_flooded → แบดจ์ home.floodBadge
    + <time> relativeTime(created_at, locale) (ml-auto text-xs text-slate-500)
    + ถ้าเป็นของตัวเอง (item.user_id === myUserId) → ปุ่มไอคอนถังขยะ (SVG ไม่ใช้ emoji)
      → window.confirm(report.deleteConfirm) → delete แถว → onDeleted(id)
  <p className="mt-2 whitespace-pre-wrap break-words">{message}</p>
  photos.length > 0 → <PhotoGrid photos onOpen={(i) => setLightbox(i)} />
  lightbox !== null → <Lightbox photos index onClose />
</article>
```

**PhotoGrid**: 1 ภาพ = `grid-cols-1 aspect-[4/3]` | ≥2 ภาพ = `grid-cols-3 aspect-square`; ปุ่มแต่ละใบ relative overflow-hidden rounded-lg → `<Image fill sizes="(max-width: 640px) 32vw, 220px" className="object-cover" />` (ใช้ `next/image` เท่านั้น — remotePatterns จัดไว้แล้ว; อย่าใช้ `<img>` ธรรมดา)

**Lightbox**: fixed inset-0 z-50 bg-black/95, `role="dialog" aria-modal`; ตัวเลข `n/N` + ปุ่มปิด (SVG ✕); ภาพกลาง `<Image fill className="object-contain" sizes="100vw" />`; ปุ่ม ←/→ ถ้ามีหลายภาพ; keyboard: Esc ปิด, ArrowRight/ArrowLeft เลื่อน (useEffect + cleanup)

### 13.3 หน้ารายงาน `/report`

gate เหมือนหน้าหลัก (loading/noconfig/error/onboard) → ready: `<AppHeader /> <FloodWatch /> <main max-w-2xl> <h1>report.title</h1> <ReportForm userId />`

**ReportForm**

```
- Textarea: report.messageLabel + placeholder + counter "n/500" (maxlength 500)
- PhotoPicker:
    ปุ่ม "ถ่ายภาพ"        → <input type="file" accept="image/*" multiple capture="environment" hidden>
    ปุ่ม "เลือกภาพถ่าย"   → <input type="file" accept="image/*" multiple hidden>
    hint: report.photoLimit
    ระวังเกิน 6 ภาพรวม → ตัดทิ้ง + toast error.photoTooMany
    preview grid: ภาพย่อจาก URL.createObjectURL + ปุ่ม ✕ ลบทีละใบ (revokeObjectURL)
    แต่ละภาพมี status: compressing (spinner) | ready | error (ให้ลบออกก่อนส่ง)
- Checkbox ใหญ่: report.floodCheck (default UNCHECKED)
    ติ๊กแล้ว: กรอบ/แบดจ์เปลี่ยนเป็นสีแดง + hint report.floodCheckHint
- ปุ่มส่ง: report.submit → ระหว่างส่ง report.submitting (disabled)
    disabled เมื่อ: submitting || message.trim() ว่าง || มีภาพ status != "ready"
- Submit flow ตาม §8.3 (compress → upload มี retry 1 ครั้ง/ภาพ → insert →
  fire notify-flood ถ้า is_flooded → mark throttle → router.push("/") + toast report.success)
- Throttle: ก่อนเริ่ม flow เช็ค isThrottled → toast error.throttled และไม่ทำงานต่อ
```

### 13.4 Onboarding (full-screen card กึ่งกลาง)

```
- EyeLogo 96px + "Hundred Eyes" (font-bold text-2xl) + tagline
- LanguageToggle (segmented)
- ฟอร์ม: ชื่อ (required) / บ้านเลขที่ + hint onboarding.houseHint
- ปุ่ม onboarding.start (disabled ตอน busy)
- validate: ชื่อ 2–30 (ไม่ผ่าน → error.nameRequired ใต้ฟอร์ม)
- submit: createAccount() → สำเร็จ: unlockAudio() (ใช้ gesture นี้ unlock เสียง) → onDone()
  ล้มเหลว: error.network
```

### 13.5 `/settings`

gate เหมือนกัน → ready: `<AppHeader /> <FloodWatch /> <main max-w-2xl>` + การ์ดแยกส่วน

```
1. โปรไฟล์: ชื่อ (default profile.display_name) + บ้านเลขที่ + ปุ่ม settings.save
   → saveProfile() → toast settings.saved
2. ภาษา (settings.language): segmented เดียวกับ LanguageToggle
   → setLocale(l) + อัปเดต profile.locale แบบ background (ไม่ต้องรอ)
3. การแจ้งเตือน (notif.heading):
   - granted → ข้อความ notif.enabled
   - denied  → ข้อความ notif.blocked
   - default → ปุ่ม notif.enable → enablePushNotifications(locale)
   - unsupported + iOS → notif.iosHint
   - ปุ่ม notif.testSound เสมอ (unlockAudio + playFloodAlarm)
4. ติดตั้ง: InstallButton (ขนาดใหญ่กว่าใน header; ถ้า iOS และยังไม่ standalone → hint)
5. ออกจากระบบ (สีแดง): window.confirm(settings.logoutConfirm) → signOut()
   (useSession จะได้ SIGNED_OUT → กลับ onboarding เอง)
```

### 13.6 `/offline`

หน้า static เดียว กึ่งกลาง: offline.title + offline.body (client component ใช้ useT ได้เพราะอยู่ใน layout providers)

### 13.7 Toast — `src/components/Toast.tsx`

```
ToastProvider (ครอบใน layout — อยู่ทุกหน้า):
- useToast() → showToast(message, kind?: "info" | "success" | "error")
- แสดง fixed bottom กลางจอ (bottom-24 บนมือถือให้พ้นปุ่ม CTA, sm:bottom-8) z-50
  pointer-events-none container + pointer-events-auto ตัว toast
- สี: info = bg-slate-900 | success = bg-green-600 | error = bg-red-600, ตัวอักษรขาว rounded-full px-4 py-2
- auto-dismiss 3,500ms (id counter + setTimeout ลบทีละ toast)
```

---

## 14. i18n

**`src/lib/i18n/provider.tsx`** (client)

```tsx
- Locale = "th" | "en"
- Dictionary: th.ts → export const th = {...} as const;
  en.ts → export const en: Record<keyof typeof th, string> = {...}   ← บังคับ key ตรงกันตั้งแต่ compile time
- useState<Locale>("th") เสมอใน render แรก → SSR/CSR hydration ตรงกัน
  จากนั้น useEffect อ่าน localStorage (LOCALE_STORAGE_KEY = "he-locale"):
  stored "en"/"th" ใช้ค่านั้น | ไม่มี → navigator.language.startsWith("th") ? "th" : "en"
- setLocale(l) → localStorage + state
- useEffect ทุกครั้งที่ locale เปลี่ยน → document.documentElement.lang = locale
- t(key) = dict[key] ?? key; useT() = { locale, setLocale, t }
- ห้าม import provider ใน server component
```

**`src/lib/reltime.ts`** (pure)

```ts
relativeTime(input: string | number | Date, locale: "th" | "en", now: Date = new Date()): string
- คำนวณ diff วินาที (clamp ไม่ติดลบ กัน clock skew) → Intl.RelativeTimeFormat(locale, { numeric: "auto" })
- < 60 วิ → second | < 1 ชม. → minute | < 1 วัน → hour | ≥ 1 วัน → day
```

**ตาราง string ครบถ้วน (สร้าง `th.ts` / `en.ts` จากตารางนี้ — flat keys)**

| key | th | en |
|---|---|---|
| appName | Hundred Eyes | Hundred Eyes |
| tagline | ช่วยกันเฝ้าระวัง ช่วยกันแจ้งเตือน | Community flood watch |
| onboarding.intro | แอปของหมู่บ้าน ใช้รายงานสถานการณ์น้ำและช่วยกันเตือนภัย | Our village app for reporting floods and alerting neighbours |
| onboarding.name | ชื่อของคุณ | Your name |
| onboarding.namePlaceholder | เช่น ป้านภา | e.g. Napa |
| onboarding.house | บ้านเลขที่ | House number |
| onboarding.housePlaceholder | เช่น 88/4 | e.g. 88/4 |
| onboarding.houseHint | ไม่บังคับ ไม่แสดงต่อผู้อื่น | Optional, never shown to others |
| onboarding.start | เริ่มใช้งาน | Get started |
| home.reportCta | รายงานสถานการณ์ | Report situation |
| home.timeline | รายงานล่าสุด | Latest reports |
| home.empty | ยังไม่มีรายงาน เป็นคนแรกที่แจ้งได้เลย | No reports yet — be the first! |
| home.loadMore | โหลดเพิ่ม | Load more |
| home.floodBanner | ⚠️ มีน้ำท่วมในหมู่บ้าน ณ ปัจจุบัน | ⚠️ Flooding reported in the village |
| home.floodBadge | น้ำท่วม | Flooded |
| report.title | รายงานสถานการณ์ | New report |
| report.messageLabel | สถานการณ์ที่พบ | What did you see? |
| report.messagePlaceholder | เช่น น้ำท่วมถนนหน้าบ้าน สูงราว 30 ซม. | e.g. water covering the road, about 30 cm |
| report.takePhoto | ถ่ายภาพ | Take photo |
| report.choosePhotos | เลือกภาพถ่าย | Choose photos |
| report.photoLimit | สูงสุด 6 ภาพ | Up to 6 photos |
| report.floodCheck | มีน้ำท่วมเข้ามาในหมู่บ้าน | Flood water has entered the village |
| report.floodCheckHint | ติ๊กเพื่อส่งเสียงเตือนฉุกเฉินถึงเพื่อนบ้านทุกคน | Check to send an emergency alert to all neighbours |
| report.submit | ส่งรายงาน | Submit report |
| report.submitting | กำลังส่ง… | Sending… |
| report.success | ส่งรายงานแล้ว | Report sent |
| report.delete | ลบรายงาน | Delete report |
| report.deleteConfirm | ลบรายงานนี้? | Delete this report? |
| notif.heading | การแจ้งเตือน | Notifications |
| notif.enable | เปิดรับการแจ้งเตือนน้ำท่วม | Get flood notifications |
| notif.enabled | เปิดการแจ้งเตือนแล้ว | Notifications on |
| notif.blocked | ถูกปิดในตั้งค่าเบราว์เซอร์ | Blocked in browser settings |
| notif.testSound | ทดสอบเสียงเตือน | Test alert sound |
| notif.iosHint | บน iPhone/iPad: แชร์ → เพิ่มไปที่หน้าจอหลัก ก่อนเปิดรับแจ้งเตือน | On iOS: Share → Add to Home Screen, then enable notifications |
| install.install | ติดตั้งแอป | Install app |
| install.iosHint | บน iPhone/iPad: แชร์ → เพิ่มไปที่หน้าจอหลัก | On iOS: Share → Add to Home Screen |
| settings.title | ตั้งค่า | Settings |
| settings.language | ภาษา | Language |
| settings.save | บันทึก | Save |
| settings.saved | บันทึกแล้ว | Saved |
| settings.logout | ออกจากระบบ | Sign out |
| settings.logoutConfirm | ออกแล้วไม่สามารถกลับมาบัญชีเดิมได้ ยืนยัน? | You can't recover this account later. Continue? |
| offline.title | คุณออฟไลน์อยู่ | You're offline |
| offline.body | เชื่อมต่ออินเทอร์เน็ตแล้วลองใหม่ | Reconnect and try again |
| setup.title | ยังไม่ได้ตั้งค่าแอป | App not configured |
| setup.body | ผู้ดูแลยังไม่ได้ตั้งค่าเชื่อมต่อฐานข้อมูล | The administrator has not set up the database connection yet |
| alarm.banner | น้ำท่วม! ตรวจสอบรายงานล่าสุด | Flood! Check the latest report |
| error.network | ส่งไม่สำเร็จ ลองใหม่อีกครั้ง | Couldn't send — try again |
| error.photoTooMany | เลือกได้สูงสุด 6 ภาพ | You can attach up to 6 photos |
| error.nameRequired | กรุณากรอกชื่ออย่างน้อย 2 ตัวอักษร | Enter at least 2 characters |
| error.throttled | รายงานบ่อยเกินไป กรุณารอสักครู่ | You're reporting too fast — please wait a moment |

หมายเหตุ: push title/body สร้างฝั่ง server ด้วย `buildPushPayload` (§8.2) ไม่ได้อยู่ใน dictionary นี้

---

## 15. Validation + Edge cases

**`src/lib/validate.ts`** (pure — ใช้ทั้ง onboarding, settings, report)

```ts
validateName(raw): string | null      // trim; 2–30 → คืนค่า trim แล้ว, ไม่ผ่าน → null
validateHouse(raw): string | null     // trim; > 20 → null; ว่าง → null (optional)
validateMessage(raw): string | null   // trim; 1–500 → ค่า trim แล้ว, ไม่ผ่าน → null
isUuid(v): boolean                    // regex มาตรฐาน (ใช้ใน API route)
```

**`src/lib/throttle.ts`** (inject storage ได้เพื่อ unit test)

```ts
isThrottled(now: number, windowMs = REPORT_THROTTLE_MS, store: Storage): boolean
  // Number(store.getItem(LAST_REPORT_KEY)) — NaN/0/ไม่มี → false; อยู่ใน window → true
markReported(now: number, store: Storage): void
```

**`src/lib/compress.ts`**

```ts
scaledSize(w, h, maxDim): { width, height }   // pure: scale = min(1, maxDim / max(w, h));
compressImage(file, maxDim = 1600, quality = 0.82): Promise<File>   // browser only
  - file.type ต้อง .startsWith("image/") ไม่งั้น throw
  - URL.createObjectURL → new Image() → decode ไม่ได้ throw (HEIC บางเบราว์เซอร์)
  - canvas วาดตาม scaledSize → canvas.toBlob("image/jpeg", quality) → new File([blob], "photo.jpg", { type: "image/jpeg" })
  - finally: revokeObjectURL
```

| เรื่อง | กติกา |
|---|---|
| ชื่อ | trim, 2–30 ตัวอักษร, แสดงแบบ text (React escape ให้อยู่แล้ว) |
| บ้านเลขที่ | optional, ≤20, ไม่แสดงใน feed (ไม่มีใน view) |
| message | required 1–500 (trim ก่อนตรวจ), แสดง `whitespace-pre-wrap break-words` |
| รูป | ≤6 ภาพ/รายงาน (รวมทุกช่องทาง); ย่อ 1600px → JPEG q0.82 ฝั่ง client ก่อน upload |
| Rate limit รายงาน | 1 ครั้ง/30 วินาที/ผู้ใช้ (client-side) |
| Realtime INSERT ของตัวเอง | prepend ข้อมูล แต่ **ไม่** มีเสียง/แบนเนอร์ |
| แท็บเดียวกันเปิด 2 แท็บ | dedupe ด้วย report id ตอน merge |
| Push หาผู้ส่งเอง | ไม่ส่ง (กรอง `s.user_id === report.user_id`) |
| Endpoint ตาย (404/410) | ลบแถว push_subscriptions อัตโนมัติ |
| ส่ง notify ซ้ำ/same report | atomic claim ผ่าน `flood_notified_at` → idempotent |
| Upload ล้มเหลว | retry 1 ครั้งต่อภาพ; ล้มอีก → toast error.network และ **ไม่เสียข้อมูล form** |
| Supabase env หายฝั่ง client | getSupabase() → null → หน้า setup (ไม่ throw) |
| Session มีแต่ profile row หาย | upsert แบบ idempotent (createAccount ใช้ userId เดิม) |
| เวลาทั้งหมด | timestamptz จาก server เท่านั้น; relativeTime clamp ไม่ติดลบ |
| Permission denied | แสดง notif.blocked ใน settings (browser บล็อกถาวร — จะไม่ถามซ้ำ) |

---

## 16. ลำดับการ implement แนะนำ

1. Scaffold: `package.json` + config files ทั้งหมดใน §3–4 → `npm install`
2. `supabase/migrations/0001_init.sql` (รันบน Supabase จริงตอน deploy — §18)
3. lib layer ตามลำดับ: constants → supabase/{client,types} → i18n (th/en จากตาราง §14) → reltime → validate → throttle → push-texts → push → alarm → compress → feed → notify → account
4. hooks: useSession → useFeed → usePushPermission → useInstallPrompt
5. components: Toast → ServiceWorkerRegister → EyeLogo → LanguageToggle → InstallButton → AppHeader → Lightbox → PhotoGrid → ReportCard → Timeline → FloodBanner → FloodWatch → NotificationSetup → Onboarding → PhotoPicker → ReportForm
6. pages + `manifest.ts` + `src/app/icon.svg` + API route `/api/notify-flood`
7. `public/sw.js` + `assets/*.svg` + `scripts/generate-icons.mjs` → รันสคริปต์ → commit ผลลัพธ์ icons
8. unit tests (§17) → `npm run test`
9. `npm run lint` → แก้จนผ่าน (error = 0)
10. `npm run build` → แล้ว smoke test (§17.3)
11. deploy (§18) — หลังได้ env จริง

---

## 17. Testing — จำเป็นทั้งหมด และต้องผ่านก่อนส่งมอบ

### 17.1 Unit tests (vitest, node env, pure logic เท่านั้น)

| ไฟล์ | ตรวจอะไร |
|---|---|
| `i18n.test.ts` | key ของ th กับ en ตรงกันเป๊ะ (Object.keys sort เทียบ) • ทุกค่า non-empty • appName === "Hundred Eyes" ทั้งสองภาษา |
| `reltime.test.ts` | วินาที/นาที/ชม./วัน ทั้ง th และ en ด้วย `now` คงที่ (fixed Date) • อนาคต (diff ติดลบ) → clamp เป็นค่า "เมื่อสักครู่/just now" • input ไม่ valid → "" |
| `push.test.ts` | `urlBase64ToUint8Array`: known vector "AQID" → [1,2,3] • padding เติม "=" • แปลง `-_` เป็น `+/` |
| `validate.test.ts` | ชื่อ: 1 ตัว→null, 2 ตัว→ผ่าน, 31 ตัว→null, มีช่องว่างรอบ→trim แล้วผ่าน • message 0/1/500/501 • house 20/21/ว่าง→null |
| `push-texts.test.ts` | `buildPushPayload` th/en: title ถูก, มีชื่อผู้รายงาน, fallback ชื่อ ("เพื่อนบ้าน"/"A neighbour") • `truncate` 79 ตัว+"…" ที่ 80+, tag = "flood-alert", data.url = "/" |
| `feed.test.ts` | `mergeReports`: dedupe id, sort created_at desc • `activeFloodReport`: flooded ใน 3 ชม. → เจอ, เกิน 3 ชม. → null, ไม่ flooded → null |
| `alarm.test.ts` | `sirenSchedule`: 8 segments, สลับ 800/600 เริ่ม 800, ระยะห่าง 0.25s |
| `compress.test.ts` | `scaledSize`: ภาพแนวนอน/แนวตั้งย่อถึง maxDim, ภาพเล็กกว่า maxDim → ขนาดเดิม, input ไม่ valid → 0 |
| `throttle.test.ts` | ใน window → true, เกิน window → false, ไม่มีค่าใน storage (null/NaN) → false (ใช้ mock Storage object) |
| `notify.test.ts` | `broadcastFloodNotification` ด้วย mock db + mock sender: (1) claim ได้ null → `{sent:false}` ไม่ส่งอะไร (2) claim สำเร็จ + 3 subs (1 เป็นผู้รายงานเอง) → ส่ง 2 ครั้ง payload ถูก locale (th sub ได้ title ไทย, en sub ได้ title อังกฤษ) (3) sender throw statusCode 410 → เรียก delete endpoint (4) เรียก broadcast ซ้ำ id เดิม → claim null → ไม่ส่งซ้ำ |

หมายเหตุ `notify.test.ts`: ให้ `notify.ts` รับ dependencies เป็น parameter (`db: Pick<SupabaseClient, "from">`, `sendNotification?: (sub, payload, options) => Promise<unknown>`) — mock ด้วย chainable object จำลอง `.update/.select/.eq/.is/.maybeSingle/.delete` + thenable สำหรับ query ที่ await ตรง ๆ

### 17.2 คำสั่งที่ต้องผ่าน

```
npm run test      # vitest run — ทุกไฟล์ผ่าน
npm run lint      # next lint — 0 error
npm run build     # next build — สำเร็จ ไม่มี type error (prebuild สร้าง icons อัตโนมัติ)
```

### 17.3 Smoke test (หลัง build — ไม่ต้องมี Supabase จริง)

```powershell
# รันใน PowerShell (ปรับ port ตามที่ว่าง):
$env:NEXT_PUBLIC_SUPABASE_URL="https://dummy.supabase.co"
$env:NEXT_PUBLIC_SUPABASE_ANON_KEY="dummy-anon"
$env:NEXT_PUBLIC_VAPID_PUBLIC_KEY="BM-dummy"
$env:SUPABASE_SERVICE_ROLE_KEY="dummy-service"
$env:VAPID_PUBLIC_KEY="BM-dummy"
$env:VAPID_PRIVATE_KEY="dummy-private"
npm run build
node node_modules/next/dist/bin/next start -p 3123   # รัน background แล้ว curl
```

ตรวจด้วย `curl.exe`:

| URL | คาดหวัง |
|---|---|
| `GET /` | 200, HTML มี `Hundred Eyes` (render ไม่ crash — Supabase dummy แต่ client ต้องโหลดได้) |
| `GET /report`, `GET /settings`, `GET /offline` | 200 + HTML ครบ |
| `GET /manifest.webmanifest` | 200, JSON มี `name: "Hundred Eyes"`, icons 4 ตัว, `display: "standalone"` |
| `GET /sw.js` | 200, content-type JS |
| `GET /icons/icon-192.png`, `badge-72.png` | 200, image/png |
| `POST /api/notify-flood` (body ไม่ใช่ uuid) | 400 `{ "error": "invalid_body" }` |
| `POST /api/notify-flood` (body uuid ปลอม) | 500 `{ "error": "broadcast_failed" }` (Supabase dummy ติดต่อไม่ได้ — route จับไว้ ไม่ crash) |

### 17.4 Acceptance criteria (manual บน deployed HTTPS — ผ่านครบทุกข้อจึงถือว่าเสร็จ)

1. เบราว์เซอร์เปล่า → onboarding → สร้างบัญชีได้ → refresh ยัง login อยู่ (session ใน localStorage)
2. รายงานไม่ติ๊กน้ำท่วม + รูป 2 ภาพ → ขึ้น timeline บนสุด รูปโหลดได้ ไม่มี push
3. อุปกรณ์ที่สอง (เปิดแอปค้าง) เห็นรายงานใหม่แบบ real-time โดยไม่ refresh
4. รายงาน **ติ๊กน้ำท่วม** → อุปกรณ์อื่น (แอปเปิดอยู่ทุกหน้า) ได้ยินไซเรน + แบนเนอร์แดง + (Android) vibrate
5. อุปกรณ์ที่เปิด notification และปิดแท็บ → ได้ system push (เสียงตาม OS) → กด push เปิด/โฟกัสแอป
6. replay `POST /api/notify-flood` กับ reportId เดิม → `{ "sent": false }` ไม่มี push ซ้ำ
7. สลับ ไทย/EN → ข้อความทั้งหน้าเปลี่ยน จำค่าหลัง refresh
8. Lighthouse (mobile): PWA installable ผ่าน, Best Practices ≥ 90
9. Responsive ที่ 360px / 768px / 1440px — CTA ไม่ทับ content, ใช้ safe-area บน iPhone
10. ติดตั้ง PWA ได้บน Chrome/Android; บน iOS แสดง hint แชร์→หน้าจอหลัก; ติดตั้งแล้ว push ทำงาน (iOS ≥ 16.4)
11. ลบรายงานของตัวเองได้ (confirm ก่อน) แต่ไม่มีปุ่มแก้/ลบของคนอื่น
12. `npm run test` + `npm run lint` + `npm run build` ผ่าน ไม่มี console error ในหน้าแอป
13. บ้านเลขที่ของผู้อื่นไม่ปรากฏใน feed/API response (ตรวจ network tab: response จาก `v_report_feed` ไม่มี `house_number`)

---

## 18. Deployment Runbook

**A. Supabase (ทำก่อน)**

1. supabase.com → New project → region **Singapore** → รอ provision
2. Settings → API → คัดลอก `Project URL`, `anon key`, `service_role key`
3. **Authentication → Sign In / Providers → Anonymous → เปิดใช้งาน** (สำคัญ — ทำผ่าน SQL ไม่ได้; ปิดอยู่ = onboarding สร้างบัญชีไม่ได้)
4. SQL Editor → วาง + รัน `supabase/migrations/0001_init.sql` ทั้งไฟล์
5. ตรวจ: มี tables `profiles`/`reports`/`push_subscriptions` + view `v_report_feed` + Policies ครบ + Realtime เห็น `public.reports` + Storage เห็น bucket `report-photos` (public)

**B. VAPID keys**

```
npx web-push generate-vapid-keys
```

ได้ Public Key / Private Key → ใช้ทั้ง `NEXT_PUBLIC_VAPID_PUBLIC_KEY` และ `VAPID_PUBLIC_KEY` (ค่าเดียวกัน)

**C. Vercel**

1. Push repo ขึ้น GitHub (สร้าง commit เมื่อเจ้าของ repo อนุมัติเท่านั้น)
2. vercel.com → Add New → Project → Import repo → Framework ตรวจเจอ Next.js อัตโนมัติ
3. Environment Variables (Production + Preview): ใส่ครบ 7 ตัวตาม §5
4. Deploy (Node 20+) — region project แนะนำ Singapore
5. เปิด URL ที่ Vercel ให้ (HTTPS บังคับสำหรับ push + PWA) → รัน acceptance ทั้ง 13 ข้อใน §17.4
6. แชร์ลิงก์ให้เพื่อนบ้าน + แนะนำให้กด "ติดตั้งแอป" และเปิด notification

**Local dev:** คัดลอก `.env.example` → `.env.local` ใส่ค่าจริง → `npm run dev`
(ข้อจำกัด: Web Push + SW ทดสอบได้เฉพาะบน HTTPS — ทดสอบ push บน deployed URL เท่านั้น; localhost ใช้ทดสอบ UI/logic ได้)

---

## 19. Gotchas สำหรับ implementer (อ่านก่อนเขียนโค้ด)

1. **Realtime ไม่ทำงาน** ถ้าลืม `alter publication supabase_realtime add table public.reports` (อยู่ใน SQL แล้ว — อย่าตัดออก)
2. `showNotification` ใน push event **ต้อง** อยู่ใน `event.waitUntil(...)` ไม่งั้น Android บางรุ่น drop notification
3. `AudioContext` ต้องสร้าง/resume หลัง user gesture — **ห้าม** instantiate ตอน module load; unlock ผ่านปุ่ม onboarding/ปุ่มทดสอบเสียง
4. iOS ≥ 16.4: Web Push ทำงานเฉพาะเมื่อ "เพิ่มไปที่หน้าจอหลัก" แล้ว — UI hint (`notif.iosHint`) จำเป็น
5. `SUPABASE_SERVICE_ROLE_KEY` ใช้เฉพาะใน `/api/notify-flood` (server) — ห้ามขึ้นต้น `NEXT_PUBLIC_` และห้าม import ไป client bundle
6. Service worker ห้าม cache โดเมน Supabase (จะพัง auth/realtime) — กรองด้วย origin check
7. รูปใช้ `next/image` เท่านั้น (`remotePatterns: "**.supabase.co"` ตั้งไว้แล้วแบบ static) — อย่าใช้ `<img>` (ไม่ผ่าน lint)
8. `getSupabase()` ต้องคืน `null` เมื่อ env หาย → UI แสดงหน้า setup — ห้าม throw ตอน import (build/prerender จะพัง)
9. i18n hydration: render แรกเป็น `"th"` เสมอ แล้วค่อย sync จาก localStorage ใน `useEffect` — กัน hydration mismatch
10. Atomic claim ของ notify: `update().eq("id", ...).eq("is_flooded", true).is("flood_notified_at", null).select().maybeSingle()` — row ที่ return = claim สำเร็จ (null = มีคนแจ้งแล้ว/ไม่ใช่ flooded/ไม่มี row)
11. `push_subscriptions` ใช้ `upsert` + `onConflict: "endpoint"` — heal subscription ซ้ำ/เปลี่ยน key
12. Push payload ต้องเลือกภาษาตาม `sub.locale` ของผู้รับแต่ละคน
13. Commit ผลลัพธ์ icons PNG ลง repo (นอกเหนือจาก prebuild generate) — กัน deploy พังถ้า sharp มีปัญหาบน CI
14. `beforeinstallprompt` ไม่มีบน iOS — ตรวจ `isIOS && !standalone` แล้วแสดง hint แทน
15. Event `postgres_changes` ได้รับเฉพาะแถวที่ผ่าน SELECT policy (`reports_select_all` = authenticated เห็นหมด — โอเคสำหรับ village app)
16. อย่าพยายามทำ "แก้ไขรายงาน" ใน v1 — มีแค่ลบของตัวเอง (ตรง RLS policy ที่เขียนไว้)

---

## 20. Out of scope / future (ห้ามทำเกินงานนี้ใน v1)

- คอมเมนต์ / reactions / แจ้งซ้ำต่อรายงาน
- แผนที่ + พิกัด GPS ในรายงาน
- Multi-village / village code
- แอดมิน moderation / block user
- Offline draft ของรายงาน (ส่งออฟไลน์แล้ว sync ทีหลัง)
- Dark mode, แชท, สถิติย้อนหลัง, LINE/Facebook แจ้งต่อ

---

## 21. Definition of Done

- ทุกไฟล์ตามโครงสร้าง §12 มีจริง และทำงานตาม spec ทุกหัวข้อ
- `npm run test` + `npm run lint` + `npm run build` ผ่าน (แนบผลลัพธ์กับงานส่งมอบ)
- Smoke test ตาม §17.3 ผ่านครบ
- Deploy บน Vercel + ตั้ง env ครบ + ผ่าน acceptance 13 ข้อใน §17.4
- ไม่มี console error ในหน้าแอปทั้งเบราว์เซอร์ desktop และมือถือ
