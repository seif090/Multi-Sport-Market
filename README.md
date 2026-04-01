# Multi Sport Market

تطبيق Next.js App Router لمنصة حجز ملاعب وصيانة في الإسكندرية.

## اللي اتبنى

- صفحة رئيسية RTL عربية
- لوحة أصحاب الملاعب
- لوحة الفنيين
- Route Handlers للـ API
- Prisma schema لقاعدة البيانات
- fallback بيانات demo لو `DATABASE_URL` مش متظبط

## التشغيل المحلي

1. انسخ `.env.example` إلى `.env.local`
2. اضبط `DATABASE_URL`
3. شغل:
   - `npm install`
   - `npm run dev`

## الترحيل والـ Seed

- إنشاء/تطبيق migration:
  - `npx prisma migrate dev`
- Seed للبيانات الأولية:
  - `npm run db:seed`

لو عندك قاعدة PostgreSQL جاهزة، استخدم `DATABASE_URL` الحقيقية قبل تنفيذ الخطوات دي.

## البناء

- `npm run build`

## الـ API

- `GET /api/courts`
- `GET /api/bookings`
- `POST /api/bookings`
- `GET /api/maintenance`
- `POST /api/maintenance`
- `GET /api/dashboard/summary`

## قاعدة البيانات

المخطط موجود في [prisma/schema.prisma](./prisma/schema.prisma).  
الـ migration الأول موجود في [prisma/migrations/20260401000000_init/migration.sql](./prisma/migrations/20260401000000_init/migration.sql).

## ملاحظة

الملفات القديمة `index.html` و`app.js` و`styles.css` موجودة كمرجع، لكن التطبيق الحالي يعمل من مجلد `app/`.
