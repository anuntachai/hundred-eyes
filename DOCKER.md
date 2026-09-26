# Docker (local dev deployment)

รันแอปแบบ production build บน `localhost:3000` ด้วย Docker — สำหรับ dev environment

## ใช้งาน

```bash
cp .env.docker.example .env.docker   # ครั้งแรก (ปรับค่าตามต้องการ)
docker compose --env-file .env.docker up -d --build
```

เปิด http://localhost:3000 (port เปลี่ยนได้ด้วย `APP_PORT` ใน `.env.docker`)

คำสั่งอื่น:

```bash
docker compose --env-file .env.docker ps      # ดูสถานะ + healthcheck
docker compose --env-file .env.docker logs -f # ดู log
docker compose --env-file .env.docker down    # หยุด
```

## Environment

- ไฟล์ env: `.env.docker` (ถูก .gitignore — มี VAPID private key)
- `NEXT_PUBLIC_*` ถูก inline เข้า client bundle **ตอน build** → แก้แล้วต้อง `--build` ใหม่
- ตัวแปร server (`SUPABASE_SERVICE_ROLE_KEY`, `VAPID_*`) อ่านตอน runtime
- จะใช้ Supabase จริง: ใส่ URL/anon/service_role จาก Dashboard แล้ว rebuild
- Supabase รันบน host เครื่องเดียวกัน: ใช้ `http://host.docker.internal:54321` (ใน container "localhost" ไม่ใช่เครื่อง host)
- VAPID keys สร้างใหม่ได้ด้วย `npx web-push generate-vapid-keys` (อย่างน้อย 32 ตัวอักษร)

## ข้อจำกัด dev บน localhost

- Web Push / Service Worker ทำงานได้ (localhost เป็น secure context) — ทดสอบได้ใน Chrome/Edge
- ถ้าเสียบ dummy Supabase: แอปจะแสดง onboarding และ error path (ตาม spec §7) — ต้องมี Supabase จริงจึงสร้างบัญชี/รายงานได้
