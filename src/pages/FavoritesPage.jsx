import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext.jsx';
import { productService } from '../services/productService.js';
import { money } from '../utils/money.js';
import { hasDiscount, salePrice } from '../utils/pricing.js';

export function FavoritesPage() {
  const { favorites, addToCart, toggleFavorite } = useStore();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    productService
      .getProducts({ limit: 48 })
      .then((result) =>
        setItems(
          result.products.filter((product) => favorites.includes(product.id))
        )
      )
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [favorites]);

  if (loading)
    return <section className="statePage">جاري تحميل المفضلة…</section>;
  if (error)
    return (
      <section className="statePage">
        <p>{error}</p>
        <Link className="primary" to="/products">
          العودة للمنتجات
        </Link>
      </section>
    );
  if (!items.length)
    return (
      <section className="statePage">
        <h1>لا توجد منتجات محفوظة</h1>
        <p>اضغط على القلب في أي منتج لحفظه هنا.</p>
        <Link className="primary" to="/products">
          تصفّح المنتجات
        </Link>
      </section>
    );

  return (
    <section className="storePage favoriteStorePage">
      <div className="storeBanner">
        <div>
          <p>الرئيسية ← المفضلة</p>
          <h1>المنتجات المفضلة</h1>
        </div>
      </div>
      <div className="storeLayout">
        <div className="storeList">
          <h2>
            منتجاتك المحفوظة <span>{items.length}</span>
          </h2>
          {items.map((item) => {
            const selectedColor = item.colors?.[0] || '';
            const selectedSize = item.sizes?.[0] || '';
            const image =
              item.colorImages?.find((entry) => entry.color === selectedColor)
                ?.images?.[0] || item.image;
            const variant = item.variants?.length
              ? item.variants.find(
                  (entry) =>
                    entry.color === selectedColor && entry.size === selectedSize
                )
              : null;
            const inStock = (variant ? variant.stock : item.stock) > 0;
            return (
              <article className="storeRow" key={item.id}>
                <img src={image} alt={item.name} />
                <div>
                  <h3>
                    <Link to={`/product/${item.slug}`}>{item.name}</Link>
                  </h3>
                  <p>{item.categoryName}</p>
                  {(selectedColor || selectedSize) && (
                    <small>
                      {[selectedColor, selectedSize]
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
                  <Link className="detailsLink" to={`/product/${item.slug}`}>
                    عرض المنتج
                  </Link>
                  <button
                    className="add"
                    disabled={!inStock}
                    onClick={() =>
                      addToCart({ ...item, selectedColor, selectedSize, image })
                    }
                  >
                    {inStock ? (
                      <>
                        <ShoppingCart size={15} /> أضف للسلة
                      </>
                    ) : (
                      'نفد المخزون'
                    )}
                  </button>
                  <button
                    className="textButton"
                    onClick={() => toggleFavorite(item.id)}
                  >
                    <Trash2 size={15} /> إزالة
                  </button>
                </div>
              </article>
            );
          })}
        </div>
        <aside className="orderSummary">
          <Heart size={28} fill="currentColor" />
          <h2>ملخص المفضلة</h2>
          <div>
            <span>المنتجات المحفوظة</span>
            <b>{items.length}</b>
          </div>
          <hr />
          <p>يمكنك الاحتفاظ بالمنتجات هنا أو إضافتها إلى السلة وقتما تريد.</p>
          <Link className="primary" to="/products">
            متابعة التسوق
          </Link>
        </aside>
      </div>
    </section>
  );
}
