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
للاستخدام الإنتاجي، وصّل المشروع بقاعدة PostgreSQL ثم نفّذ migrations الخاصة بـ Prisma.

## ملاحظة

الملفات القديمة `index.html` و`app.js` و`styles.css` موجودة كمرجع، لكن التطبيق الحالي يعمل من مجلد `app/`.
