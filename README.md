# Ababil — أبابيل

متجر عربي RTL للمنتجات الإسلامية. الواجهة مبنية بـ React/Vite، والخادم الفعلي مبني بـ Node.js وExpress وMongoDB/Mongoose.

## المتطلبات

- Node.js 20 أو أحدث.
- MongoDB محلي أو رابط MongoDB Atlas.

## الإعداد على Windows

```powershell
cd "C:\Users\Majd\OneDrive\Desktop\ابابيل"
npm install
Copy-Item .env.example .env
```

عدّل ملف `.env`، خصوصًا `MONGODB_URI` و`JWT_SECRET` وبيانات `ADMIN_EMAIL` و`ADMIN_PASSWORD`. لا ترفع ملف `.env` إلى Git.

أنشئ حساب صاحب المتجر:

```powershell
npm run seed:admin
```

شغّل نافذتين طرفية:

```powershell
# النافذة الأولى: API
npm run server:dev

# النافذة الثانية: الواجهة
npm run dev
```

الواجهة: `http://127.0.0.1:5173`  
الخادم: `http://127.0.0.1:5000/api`  
فحص الخادم: `http://127.0.0.1:5000/api/health`

لوحة صاحب المتجر: `http://127.0.0.1:5173/admin/login`، باستخدام البريد وكلمة المرور المحددين في `.env` ثم إنشاؤهما عبر `npm run seed:admin`.

## المتغيرات البيئية

| المتغير                         | الغرض                                            |
| ------------------------------- | ------------------------------------------------ |
| `MONGODB_URI`                   | رابط قاعدة MongoDB.                              |
| `JWT_SECRET`                    | سر طويل وعشوائي لتوقيع جلسة صاحب المتجر.         |
| `CLIENT_URL`                    | أصول الواجهة المسموح بها في CORS، مفصولة بفواصل. |
| `VITE_API_URL`                  | عنوان API الذي تستعمله واجهة Vite.               |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | تستخدم فقط في سكربت إنشاء/تحديث حساب المالك.     |

## REST API

- `GET /api/products` بحث، فلاتر (`q`, `category`, `minPrice`, `maxPrice`, `featured`)، ترتيب (`newest`, `price-low`, `price-high`) وترقيم (`page`, `limit`).
- `GET /api/products/:slug` تفاصيل منتج منشور.
- `GET /api/categories` الفئات النشطة.
- `POST|PATCH|DELETE /api/products` و`/api/categories` محمية بترويسة `Authorization: Bearer <token>`.
- `POST /api/products` و`PATCH /api/products/:id` يقبلان `multipart/form-data` وحقل الصور `images` (JPEG/PNG/WebP، حتى 5 ملفات، 5MB للملف).
- `POST /api/orders` طلب ضيف؛ يعيد الخادم تسعير العناصر، يفحص المخزون، ويحسب سعر التوصيل بنفسه.
- `GET /api/orders` و`PATCH /api/orders/:id/status` محميان للمالك.
- `POST /api/auth/login` لتسجيل دخول صاحب المتجر.
- `GET /api/dashboard/summary` محمي ويعيد إحصائيات حقيقية للمبيعات والطلبات والمخزون.
- `GET /api/products/admin/all` و`GET /api/categories/admin/all` قوائم إدارة محمية تشمل المنتجات أو التصنيفات المخفية.

## الجودة والاختبارات

```powershell
npm run test:api
npm run build
npm run format:check
```

تغطي الاختبارات الصحة ومسار 404، إضافةً إلى اختبار تكاملي فعلي بقاعدة MongoDB مؤقتة لـ CRUD والصلاحيات والفلترة والطلب وإعادة التسعير وفحص المخزون.

## بنية المشروع

- `src/`: الواجهة وطبقة `services` التي تستدعي API الفعلي.
- `server/models/`: نماذج MongoDB.
- `server/routes/`: مسارات API العامة والإدارية.
- `server/middlewares/`: المصادقة، رفع الصور، والأخطاء المركزية.
- `server/scripts/`: إنشاء حساب المالك.

## ملاحظات تشغيل الإنتاج

- لوحة الإدارة موجودة على `/admin` وتشمل المنتجات والتصنيفات والطلبات والمخزون والإحصائيات.
- بعد تأكيد الطلب، تُفتح محادثة واتساب بتفاصيل الطلب ليرسلها العميل يدويًا.
- قبل الاعتماد على النشر الفعلي، يجب استخدام تخزين دائم للصور المرفوعة بدل تخزين ملفات الخادم المؤقت.
