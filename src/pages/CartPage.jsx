import { Minus, Plus, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext.jsx';
import { money } from '../utils/money.js';
import { hasDiscount, salePrice } from '../utils/pricing.js';
export function CartPage() {
  const { cart, updateQuantity, removeFromCart } = useStore();
  const navigate = useNavigate();
  const total = cart.reduce(
    (sum, item) => sum + salePrice(item) * item.quantity,
    0
  );
  if (!cart.length)
    return (
      <section className="statePage">
        <h1>سلتك فارغة</h1>
        <p>اكتشف منتجات أبابيل وأضف ما يعجبك.</p>
        <Link className="primary" to="/products">
          تسوّق المنتجات
        </Link>
      </section>
    );
  return (
    <section className="storePage">
      <div className="storeBanner">
        <div>
          <p>الرئيسية ← السلة</p>
          <h1>سلة المشتريات</h1>
        </div>
      </div>
      <div className="storeLayout">
        <div className="storeList">
          <h2>
            منتجات السلة <span>{cart.length}</span>
          </h2>
          {cart.map((item) => (
            <article className="storeRow" key={item.cartKey || item.id}>
              <img src={item.image} alt={item.name} />
              <div>
                <h3>{item.name}</h3>
                <p>{item.categoryName}</p>
                {(item.selectedColor || item.selectedSize) && (
                  <small>
                    {[item.selectedColor, item.selectedSize]
                      .filter(Boolean)
                      .join(' · ')}
                  </small>
                )}
                <div className="priceBlock">
                  {hasDiscount(item) && (
                    <>
                      <span className="discountBadge">
                        خصم {item.discountPercent}%
                      </span>
                      <del>{money(item.price)}</del>
                    </>
                  )}
                  <b>{money(salePrice(item))}</b>
                </div>
              </div>
              <div className="storeRowActions">
                <div className="quantity">
                  <button
                    onClick={() =>
                      updateQuantity(item.cartKey || item.id, item.quantity - 1)
                    }
                  >
                    <Minus size={14} />
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    onClick={() =>
                      updateQuantity(item.cartKey || item.id, item.quantity + 1)
                    }
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <button
                  className="textButton"
                  onClick={() => removeFromCart(item.cartKey || item.id)}
                >
                  <Trash2 size={15} /> حذف
                </button>
              </div>
            </article>
          ))}
        </div>
        <aside className="orderSummary">
          <h2>ملخص الطلب</h2>
          <div>
            <span>إجمالي المنتجات</span>
            <b>{money(total)}</b>
          </div>
          <div>
            <span>الشحن</span>
            <b>يُحدد لاحقًا</b>
          </div>
          <hr />
          <div className="orderTotal">
            <span>الإجمالي</span>
            <b>{money(total)}</b>
          </div>
          <button className="primary" onClick={() => navigate('/checkout')}>
            إتمام الطلب ←
          </button>
          <p>لا تحتاج لإنشاء حساب لإتمام الطلب.</p>
        </aside>
      </div>
    </section>
  );
}
