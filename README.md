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
2. اضبط `DATABASE_URL` و `AUTH_SECRET`
3. شغل:
   - `npm install`
   - `npm run dev`

## الترحيل والـ Seed

- إنشاء/تطبيق migration:
  - `npx prisma migrate dev`
- Seed للبيانات الأولية:
  - `npm run db:seed`

لو عندك قاعدة PostgreSQL جاهزة، استخدم `DATABASE_URL` الحقيقية قبل تنفيذ الخطوات دي.

## تسجيل الدخول والصلاحيات

- صفحة الدخول: `/login`
- أصحاب الملاعب: `/dashboard/vendors`
- الفنيون: `/dashboard/technicians`
- الصلاحيات متطبقة على مستوى الصفحات وRoute Handlers

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

## تفاصيل الملاعب

- صفحة التفاصيل: `/courts/[courtId]`
- التوافر بيتحدث تلقائيًا كل 12 ثانية
- الحجز من نفس الصفحة بيحدث الحالة في اللوحات بعد النجاح

## النشر على Vercel

1. اربط المشروع بحساب Vercel:
   - `vercel link`
2. أضف متغيرات البيئة على Vercel:
   - `DATABASE_URL`
   - `AUTH_SECRET`
3. لو بتستخدم PostgreSQL من Neon أو Vercel Postgres، انسخ قيمة الاتصال إلى `DATABASE_URL`.
4. اعمل migration و seed على البيئة المحلية أو من CI قبل الإطلاق.
5. نفّذ deploy:
   - `vercel deploy --prod`

ملاحظة: المشروع متوافق مع النشر على Vercel بدون إعدادات خاصة إضافية، لأن Next.js App Router وRoute Handlers وPrisma كلهم جاهزين.

## ملاحظة

الملفات القديمة `index.html` و`app.js` و`styles.css` موجودة كمرجع، لكن التطبيق الحالي يعمل من مجلد `app/`.
