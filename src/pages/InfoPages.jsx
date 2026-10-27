import { Link } from 'react-router-dom';
import { InstagramIcon, WhatsAppIcon } from '../components/SocialIcons.jsx';
const Page = ({ title, children }) => (
  <section className="infoPage section">
    <div className="pageTitle">
      <p className="hint">أبابيل</p>
      <h1>{title}</h1>
    </div>
    <div className="infoCard">{children}</div>
  </section>
);
export const AboutPage = () => (
  <Page title="من نحن">
    <h2>أبابيل، اختيارات ترافق قيمك</h2>
    <p>
      نختار منتجات إسلامية عملية وأنيقة بعناية، لتكون قريبة من تفاصيل يومك. نبدأ
      بالساعات المخصّصة لترافق تفاصيل يومك، ضمن تشكيلة متجددة من المنتجات
      المختارة بعناية.
    </p>
    <Link className="primary" to="/products">
      اكتشف المنتجات
    </Link>
  </Page>
);
export const ContactPage = () => (
  <Page title="اتصل بنا">
    <p>
      يسعدنا استقبال استفساراتكم واقتراحاتكم، أو طلبات عرض منتجات ترغبون
      بإضافتها إلى متجر أبابيل.
    </p>
    <p>
      <b>للاستفسارات أو عرض المنتجات:</b>{' '}
      <a href="mailto:mosab.hamarshe@gmail.com">mosab.hamarshe@gmail.com</a>
    </p>
    <div className="contactSocialLinks" aria-label="قنوات خدمة العملاء">
      <a
        href="https://wa.me/972569980699"
        target="_blank"
        rel="noreferrer"
        aria-label="التواصل عبر واتساب"
        title="واتساب"
      >
        <WhatsAppIcon aria-hidden="true" />
      </a>
      <a
        href="https://www.instagram.com/alfajer_ps?xtok=YmpiM2d2Nmx2cmgy&utm_source=qr"
        target="_blank"
        rel="noreferrer"
        aria-label="زيارة إنستغرام"
        title="إنستغرام"
      >
        <InstagramIcon aria-hidden="true" />
      </a>
    </div>
  </Page>
);
export const PrivacyPage = () => (
  <Page title="سياسة الخصوصية">
    <h2>خصوصيتك مهمة لنا</h2>
    <p>
      نستخدم بيانات الاسم والهاتف والمنطقة وملاحظات التسليم فقط لتجهيز الطلب
      والتواصل بشأنه. لا نبيع بياناتك أو نشاركها لأغراض تسويقية دون موافقة.
    </p>
    <p>
      تُحفظ بيانات الطلب بصورة آمنة، ويمكنك طلب الاستفسار عن بيانات طلبك عبر
      واتساب المتجر.
    </p>
  </Page>
);
export const TermsPage = () => (
  <Page title="شروط الاستخدام">
    <h2>شروط الطلب من أبابيل</h2>
    <p>
      الأسعار والمخزون المعروض قد يتغيران، ويؤكد المتجر توفر المنتج وسعره
      النهائي عند استلام الطلب. العميل مسؤول عن دقة رقم الهاتف والمنطقة وموقع
      التسليم.
    </p>
    <p>
      إرسال الطلب عبر واتساب هو خطوة تأكيد أولية، ويجري الاتفاق النهائي على
      التوصيل مع إدارة المتجر.
    </p>
  </Page>
);
export const NotFoundPage = () => (
  <section className="statePage">
    <h1>الصفحة غير موجودة</h1>
    <Link className="primary" to="/">
      العودة للرئيسية
    </Link>
  </section>
);
