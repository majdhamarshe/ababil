import { Check, Heart, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useStore } from '../context/StoreContext.jsx';
import { money } from '../utils/money.js';
import { hasDiscount, salePrice } from '../utils/pricing.js';
export function ProductCard({ product, showRemoveFavorite = false }) {
  const { addToCart, favorites, toggleFavorite } = useStore();
  const favorite = favorites.includes(product.id);
  const [added, setAdded] = useState(false);
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0] || '');
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || '');
  const selectedImage =
    product.colorImages?.find((item) => item.color === selectedColor)
      ?.images?.[0] || product.image;
  const matchingVariant = product.variants?.length
    ? product.variants.find(
        (variant) =>
          variant.color === selectedColor && variant.size === selectedSize
      )
    : null;
  const availableStock = matchingVariant
    ? matchingVariant.stock
    : product.stock;

  function optionAvailable(color = selectedColor, size = selectedSize) {
    if (!product.variants?.length) return product.stock > 0;
    const variant = product.variants.find(
      (entry) => entry.color === color && entry.size === size
    );
    return Boolean(variant && variant.stock > 0);
  }

  function handleAddToCart() {
    addToCart({
      ...product,
      selectedColor,
      selectedSize,
      image: selectedImage,
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  return (
    <article className="productCard">
      <button
        className="fav"
        onClick={() => toggleFavorite(product.id)}
        aria-label={favorite ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
      >
        <Heart size={18} fill={favorite ? 'currentColor' : 'none'} />
      </button>
      <Link className="productImage" to={`/product/${product.slug}`}>
        <img src={selectedImage} alt={product.name} />
      </Link>
      <div className="productBody">
        <p className="productCategory">{product.categoryName}</p>
        <h3>
          <Link to={`/product/${product.slug}`}>{product.name}</Link>
        </h3>
        {product.colors?.length > 0 && (
          <div className="cardOptions">
            <span>اللون</span>
            <div className="cardOptionList">
              {product.colors.map((color) => (
                <button
                  type="button"
                  key={color}
                  className={selectedColor === color ? 'selected' : ''}
                  onClick={() => setSelectedColor(color)}
                  disabled={!optionAvailable(color, selectedSize)}
                  aria-pressed={selectedColor === color}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>
        )}
        {product.sizes?.length > 0 && (
          <div className="cardOptions">
            <span>المقاس</span>
            <div className="cardOptionList">
              {product.sizes.map((size) => (
                <button
                  type="button"
                  key={size}
                  className={selectedSize === size ? 'selected' : ''}
                  onClick={() => setSelectedSize(size)}
                  disabled={!optionAvailable(selectedColor, size)}
                  aria-pressed={selectedSize === size}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="productFooter">
          <div className="priceBlock">
            {hasDiscount(product) && (
              <span className="discountBadge">
                خصم {product.discountPercent}%
              </span>
            )}
            {hasDiscount(product) && <del>{money(product.price)}</del>}
            <b>{money(salePrice(product))}</b>
          </div>
          <button
            className={`add ${added ? 'isAdded' : ''}`}
            onClick={handleAddToCart}
            disabled={availableStock < 1}
            aria-live="polite"
          >
            {availableStock < 1 ? (
              'نفد المخزون'
            ) : added ? (
              <>
                <Check size={16} /> تمت الإضافة
              </>
            ) : (
              <>
                <ShoppingCart size={15} /> أضف للسلة
              </>
            )}
          </button>
        </div>
        <Link className="detailsLink" to={`/product/${product.slug}`}>
          عرض تفاصيل المنتج
        </Link>
        {showRemoveFavorite && (
          <button
            className="removeFavorite"
            onClick={() => toggleFavorite(product.id)}
          >
            إزالة من المفضلة
          </button>
        )}
      </div>
    </article>
  );
}
