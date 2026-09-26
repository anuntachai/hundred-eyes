-- ชื่อผู้ใช้ต้องไม่ซ้ำกัน (เทียบแบบไม่สนตัวพิมพ์ใหญ่-เล็ก)
-- ใช้ unique index บน lower(display_name) → "Tum" กับ "tum" ถือว่าซ้ำ
-- หมายเหตุ: ก่อนรันต้องไม่มีชื่อซ้ำในข้อมูลเดิม มิฉะนั้นจะ fail
create unique index if not exists profiles_display_name_unique
  on public.profiles (lower(display_name));
