import {
  Bell,
  Check,
  Heart,
  Minus,
  Plus,
  ShoppingCart,
  X,
  ZoomIn,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard.jsx';
import { useStore } from '../context/StoreContext.jsx';
import { productService } from '../services/productService.js';
import { money } from '../utils/money.js';
import { hasDiscount, salePrice } from '../utils/pricing.js';

export function ProductPage() {
  const { slug } = useParams();
  const { addToCart, favorites, toggleFavorite } = useStore();
  const [product, setProduct] = useState();
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [message, setMessage] = useState('');
  const [added, setAdded] = useState(false);
  const [related, setRelated] = useState([]);
  const [lightbox, setLightbox] = useState(false);
  const [restockPhone, setRestockPhone] = useState('');
  const [restockMessage, setRestockMessage] = useState('');

  useEffect(() => {
    setProduct(undefined);
    productService
      .getProductBySlug(slug)
      .then((loadedProduct) => {
        setProduct(loadedProduct);
        setSelectedColor(loadedProduct.colors?.[0] || '');
        setSelectedSize(loadedProduct.sizes?.[0] || '');
        setQuantity(1);
        setSelectedImageIndex(0);
        return productService.getProducts({
          category: loadedProduct.category,
          limit: 4,
        });
      })
      .then((result) => setRelated(result.products))
      .catch(() => setProduct(null));
  }, [slug]);

  const colorGroup = useMemo(
    () => product?.colorImages?.find((item) => item.color === selectedColor),
    [product, selectedColor]
  );
  const galleryImages = colorGroup?.images?.length
    ? colorGroup.images
    : [product?.image].filter(Boolean);
  const selectedImage = galleryImages[selectedImageIndex] || product?.image;
  const matchingVariant = product?.variants?.length
    ? product.variants.find(
        (variant) =>
          variant.color === selectedColor && variant.size === selectedSize
      )
    : null;
  const availableStock = matchingVariant
    ? matchingVariant.stock
    : product?.stock || 0;

  function optionAvailable(color = selectedColor, size = selectedSize) {
    if (!product?.variants?.length) return (product?.stock || 0) > 0;
    const variant = product.variants.find(
      (entry) => entry.color === color && entry.size === size
    );
    return Boolean(variant && variant.stock > 0);
  }

  function selectColor(color) {
    setSelectedColor(color);
    setSelectedImageIndex(0);
    setQuantity(1);
  }
  async function requestRestock() {
    if (!/^05[69]\d{7}$/.test(restockPhone))
      return setRestockMessage('أدخل رقمًا يبدأ بـ 059 أو 056.');
    try {
      const result = await productService.requestRestock({
        productId: product.id,
        phone: restockPhone,
        color: selectedColor,
        size: selectedSize,
      });
      setRestockMessage(result.message);
    } catch (error) {
      setRestockMessage(error.message);
    }
  }

  if (product === undefined)
    return <div className="statePage">جاري تحميل المنتج…</div>;
  if (!product)
    return (
      <div className="statePage">
        <h1>المنتج غير موجود</h1>
        <Link className="primary" to="/products">
          العودة للمنتجات
        </Link>
      </div>
    );

  return (
    <>
      <section className="productDetail section">
        <div className="productGallery">
          <button
            type="button"
            className="detailImage"
            onClick={() => setLightbox(true)}
            aria-label="تكبير صورة المنتج"
          >
            <img src={selectedImage} alt={product.name} />
            <span>
              <ZoomIn size={19} /> تكبير الصورة
            </span>
          </button>
          {galleryImages.length > 1 && (
            <div className="galleryThumbs" aria-label="صور المنتج">
              {galleryImages.map((image, index) => (
                <button
                  type="button"
                  key={image}
                  className={selectedImageIndex === index ? 'active' : ''}
                  onClick={() => setSelectedImageIndex(index)}
                >
                  <img
                    src={image}
                    alt={`${product.name} - صورة ${index + 1}`}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="detailContent">
          <p className="hint">{product.categoryName}</p>
          <h1>{product.name}</h1>
          <div className="detailPrice">
            {hasDiscount(product) && (
              <>
                <span className="discountBadge">
                  خصم {product.discountPercent}%
                </span>
                <del>{money(product.price)}</del>
              </>
            )}
            <h2>{money(salePrice(product))}</h2>
          </div>
          <p>{product.description}</p>
          {product.colors?.length > 0 && (
            <div className="optionGroup">
              <b>اللون</b>
              <div>
                {product.colors.map((color) => (
                  <button
                    key={color}
                    className="colorOption"
                    onClick={() => selectColor(color)}
                    aria-pressed={selectedColor === color}
                  >
                    {color}
                    {!optionAvailable(color, selectedSize) && ' — غير متوفر'}
                  </button>
                ))}
              </div>
            </div>
          )}
          {product.sizes?.length > 0 && (
            <div className="optionGroup">
              <b>المقاس</b>
              <select
                className="colorOption"
                value={selectedSize}
                onChange={(event) => {
                  setSelectedSize(event.target.value);
                  setQuantity(1);
                }}
              >
                {product.sizes.map((size) => (
                  <option key={size} value={size}>
                    {size}
                    {!optionAvailable(selectedColor, size)
                      ? ' — غير متوفر'
                      : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
          <p className={`stockNote ${availableStock < 1 ? 'out' : ''}`}>
            {availableStock < 1
              ? 'نفد مخزون هذا الخيار'
              : `المتاح من هذا الخيار: ${availableStock}`}
          </p>
          <div className="purchaseRow">
            <div className="quantity">
              <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
                <Minus size={16} />
              </button>
              <span>{quantity}</span>
              <button
                disabled={quantity >= availableStock}
                onClick={() =>
                  setQuantity((q) => Math.min(availableStock, q + 1))
                }
              >
                <Plus size={16} />
              </button>
            </div>
            <button
              className={`primary ${added ? 'isAdded' : ''}`}
              disabled={availableStock < 1}
              onClick={() => {
                addToCart(
                  {
                    ...product,
                    selectedColor,
                    selectedSize,
                    image: selectedImage,
                  },
                  quantity
                );
                setMessage('تمت إضافة المنتج إلى السلة.');
                setAdded(true);
                window.setTimeout(() => setAdded(false), 1800);
              }}
              aria-live="polite"
            >
              {availableStock < 1 ? (
                'نفد المخزون'
              ) : added ? (
                <>
                  <Check size={17} /> تمت الإضافة
                </>
              ) : (
                <>
                  <ShoppingCart size={17} /> أضف للسلة
                </>
              )}
            </button>
            <button
              className="outlineButton"
              onClick={() => toggleFavorite(product.id)}
              aria-label="المفضلة"
            >
              <Heart
                fill={favorites.includes(product.id) ? 'currentColor' : 'none'}
              />
            </button>
          </div>
          {message && <p className="toast">{message}</p>}
          {availableStock < 1 && (
            <div className="restockBox">
              <b>
                <Bell size={17} /> نبهني عند عودة هذا الخيار
              </b>
              <div>
                <input
                  value={restockPhone}
                  onChange={(event) => setRestockPhone(event.target.value)}
                  inputMode="tel"
                  placeholder="059XXXXXXX"
                  maxLength="10"
                />
                <button type="button" onClick={requestRestock}>
                  تسجيل التنبيه
                </button>
              </div>
              {restockMessage && <small>{restockMessage}</small>}
            </div>
          )}
        </div>
      </section>
      <section className="section productSection">
        <div className="sectionHeading">
          <div>
            <p className="hint">قد يعجبك أيضًا</p>
            <h2>منتجات مشابهة</h2>
          </div>
        </div>
        <div className="products">
          {related
            .filter((item) => item.id !== product.id)
            .map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
        </div>
      </section>
      {lightbox && (
        <div
          className="imageLightbox"
          role="dialog"
          aria-modal="true"
          aria-label="صورة المنتج المكبرة"
          onClick={() => setLightbox(false)}
        >
          <button
            type="button"
            onClick={() => setLightbox(false)}
            aria-label="إغلاق"
          >
            <X />
          </button>
          <img
            src={selectedImage}
            alt={product.name}
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
