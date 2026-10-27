import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext.jsx';
import { money } from '../utils/money.js';
import { salePrice } from '../utils/pricing.js';
import { api } from '../services/api.js';

const regionGroups = [
  {
    label: 'الضفة الغربية',
    fee: 20,
    regions: [
      'جنين',
      'طوباس والأغوار الشمالية',
      'طولكرم',
      'نابلس',
      'قلقيلية',
      'سلفيت',
      'رام الله والبيرة',
      'أريحا والأغوار',
      'بيت لحم',
      'الخليل',
    ],
  },
  { label: 'القدس', fee: 50, regions: ['القدس'] },
  { label: 'الداخل المحتل', fee: 70, regions: ['الداخل المحتل'] },
];

// الرقم بصيغة دولية المطلوبة لرابط WhatsApp (بدون + أو صفر البداية).
const STORE_WHATSAPP_NUMBER = '972569980699';

function createWhatsAppMessage(order) {
  const items = order.items
    .map((item) => {
      const options = [
        item.selectedColor && `اللون: ${item.selectedColor}`,
        item.selectedSize && `المقاس: ${item.selectedSize}`,
      ]
        .filter(Boolean)
        .join(' — ');
      return `• ${item.name} × ${item.quantity}${options ? ` (${options})` : ''} — ${money(item.lineTotal)}`;
    })
    .join('\n');

  return [
    'طلب جديد من متجر أبابيل',
    `رقم الطلب: #${order._id.slice(-6)}`,
    '',
    `الاسم: ${order.customer.name}`,
    `الهاتف: ${order.customer.phone}`,
    `المنطقة: ${order.customer.region}`,
    order.customer.notes ? `الملاحظات: ${order.customer.notes}` : '',
    '',
    'المنتجات:',
    items,
    '',
    `التوصيل: ${money(order.deliveryFee)}`,
    `الإجمالي: ${money(order.total)}`,
  ]
    .filter(Boolean)
    .join('\n');
}

export function CheckoutPage() {
  const { cart, clearCart } = useStore();
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  const [region, setRegion] = useState('');
  const [openRegionGroup, setOpenRegionGroup] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const deliveryFee =
    regionGroups.find((group) => group.regions.includes(region))?.fee ?? 0;
  const productsTotal = cart.reduce(
    (sum, item) => sum + salePrice(item) * item.quantity,
    0
  );
  const finalTotal = productsTotal + deliveryFee;

  async function submit(event) {
    event.preventDefault();
    const form = Object.fromEntries(new FormData(event.currentTarget));
    const next = {};
    if (!form.name?.trim()) next.name = 'الاسم مطلوب';
    if (!/^05[69]\d{7}$/.test(form.phone || '')) {
      next.phone = 'أدخل رقمًا فلسطينيًا يبدأ بـ 059 أو 056 (10 أرقام)';
    }
    if (!form.region) next.region = 'اختر المنطقة لإظهار سعر التوصيل';
    if (!form.notes?.trim())
      next.notes = 'يرجى كتابة موقع التسليم بدقة أو ملاحظات الطلب.';
    if (Object.keys(next).length) {
      next.form = 'يرجى تعبئة البيانات المطلوبة قبل تأكيد الطلب.';
      setErrors(next);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const result = await api('/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: {
            name: form.name.trim(),
            phone: form.phone,
            region: form.region,
            notes: form.notes.trim(),
          },
          items: cart.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
            selectedSize: item.selectedSize,
            selectedColor: item.selectedColor,
          })),
        }),
      });
      const url = `https://wa.me/${STORE_WHATSAPP_NUMBER}?text=${encodeURIComponent(createWhatsAppMessage(result.data))}`;
      clearCart();
      setSubmitted(true);
      // ننتقل مباشرة إلى واتساب حتى لا يمنع المتصفح النافذة المنبثقة.
      window.location.assign(url);
    } catch (error) {
      setErrors({ form: error.message });
    } finally {
      setSubmitting(false);
    }
  }

  if (!cart.length && !submitted) {
    return (
      <section className="statePage">
        <h1>لا يمكن إتمام الطلب دون منتجات</h1>
        <Link className="primary" to="/products">
          اذهب للمنتجات
        </Link>
      </section>
    );
  }

  if (submitted) {
    return (
      <section className="statePage success">
        <h1>تم استلام طلبك المبدئي</h1>
        <p>تم حفظ طلبك وسيتواصل معك فريق أبابيل لتأكيده.</p>
        <Link className="primary" to="/">
          العودة للرئيسية
        </Link>
      </section>
    );
  }

  return (
    <section className="checkoutPage section">
      <div className="pageTitle">
        <p className="hint">خطوة أخيرة</p>
        <h1>تأكيد الطلب</h1>
        <p>لا تحتاج إلى إنشاء حساب.</p>
      </div>
      <div className="checkoutLayout">
        <form onSubmit={submit}>
          {errors.form && (
            <p className="formNotice" role="alert">
              {errors.form}
            </p>
          )}
          <label>
            الاسم الكامل
            <input
              name="name"
              autoComplete="name"
              aria-invalid={Boolean(errors.name)}
            />
            {errors.name && <small>{errors.name}</small>}
          </label>
          <label>
            رقم الهاتف
            <input
              name="phone"
              inputMode="tel"
              placeholder="059XXXXXXX أو 056XXXXXXX"
              pattern="05[69][0-9]{7}"
              maxLength="10"
              autoComplete="tel"
              aria-invalid={Boolean(errors.phone)}
            />
            {errors.phone && <small>{errors.phone}</small>}
          </label>
          <label>
            المنطقة
            <input type="hidden" name="region" value={region} />
            <div
              className={`regionPicker ${errors.region ? 'hasError' : ''}`}
              aria-label="اختر منطقة التوصيل"
              aria-invalid={Boolean(errors.region)}
            >
              {regionGroups.map((group) => (
                <div
                  className={`regionGroup ${openRegionGroup === group.label ? 'isOpen' : ''}`}
                  key={group.label}
                >
                  <button
                    type="button"
                    className="regionTrigger"
                    onClick={() =>
                      setOpenRegionGroup((current) =>
                        current === group.label ? '' : group.label
                      )
                    }
                  >
                    <span>{group.label}</span>
                    <b>{money(group.fee)}</b>
                  </button>
                  <div className="regionOptions">
                    {group.regions.map((item) => (
                      <button
                        type="button"
                        key={item}
                        className={region === item ? 'selected' : ''}
                        onClick={(event) => {
                          setRegion(item);
                          setOpenRegionGroup('');
                          event.currentTarget.blur();
                        }}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="selectedRegion">
              {region
                ? `المنطقة المختارة: ${region}`
                : 'مرّر الماوس على المجموعة واختر منطقتك'}
            </p>
            {errors.region && <small>{errors.region}</small>}
          </label>
          <label>
            تحديد الموقع بدقة أو ملاحظات أخرى
            <textarea
              name="notes"
              rows="4"
              required
              aria-invalid={Boolean(errors.notes)}
              placeholder="مثال: اسم الحي، أقرب معلم، رقم البناية، أو أي ملاحظة للطلب"
            />
            {errors.notes && <small>{errors.notes}</small>}
          </label>
          <button className="primary" type="submit" disabled={submitting}>
            {submitting ? 'جاري تأكيد الطلب…' : 'تأكيد الطلب ←'}
          </button>
        </form>
        <aside className="checkoutSummary">
          <h2>ملخص الطلب</h2>
          {cart.map((item) => (
            <p key={item.cartKey || item.id}>
              <span>
                {item.name} × {item.quantity}
              </span>
              <b>{money(salePrice(item) * item.quantity)}</b>
            </p>
          ))}
          <p>
            <span>سعر التوصيل</span>
            <b>{region ? money(deliveryFee) : 'اختر المنطقة'}</b>
          </p>
          <hr />
          <p className="orderTotal">
            <span>الإجمالي</span>
            <b>{money(finalTotal)}</b>
          </p>
        </aside>
      </div>
    </section>
  );
}
