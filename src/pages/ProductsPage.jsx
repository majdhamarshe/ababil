import { Search, SlidersHorizontal } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { ProductCard } from '../components/ProductCard.jsx';
import { productService } from '../services/productService.js';
import { money } from '../utils/money.js';

export function ProductsPage({ forcedCategory }) {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(forcedCategory ?? '');
  const [maxPrice, setMaxPrice] = useState(2000);
  const [featured, setFeatured] = useState(false);
  const [inStock, setInStock] = useState(false);
  const [discounted, setDiscounted] = useState(false);
  const [color, setColor] = useState('');
  const [size, setSize] = useState('');
  const [sort, setSort] = useState('newest');
  const [filtersOpen, setFiltersOpen] = useState(false);
  useEffect(() => setCategory(forcedCategory ?? ''), [forcedCategory]);
  useEffect(() => {
    productService
      .getCategories()
      .then(setCategories)
      .catch(() => undefined);
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError('');
      productService
        .getProducts({
          limit: 48,
          q: query.trim(),
          category,
          maxPrice,
          featured,
          inStock,
          discounted,
          color,
          size,
          sort,
        })
        .then((result) => setItems(result.products))
        .catch((requestError) =>
          setError(requestError.message || 'تعذر تحميل المنتجات.')
        )
        .finally(() => setLoading(false));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [
    query,
    category,
    maxPrice,
    featured,
    inStock,
    discounted,
    color,
    size,
    sort,
  ]);
  const colors = useMemo(
    () => [...new Set(items.flatMap((item) => item.colors || []))],
    [items]
  );
  const sizes = useMemo(
    () => [...new Set(items.flatMap((item) => item.sizes || []))],
    [items]
  );
  const reset = () => {
    setQuery('');
    setCategory(forcedCategory ?? '');
    setMaxPrice(2000);
    setFeatured(false);
    setInStock(false);
    setDiscounted(false);
    setColor('');
    setSize('');
    setSort('newest');
  };
  const title = forcedCategory
    ? (categories.find((item) => item.slug === forcedCategory)?.name ??
      'المنتجات')
    : 'جميع المنتجات';
  return (
    <section className="listingPage section">
      <div className="pageTitle">
        <p className="hint">مجموعة أبابيل</p>
        <h1>{title}</h1>
        <p>ابحث ورتب النتائج بالطريقة التي تناسبك.</p>
      </div>
      <div className="catalogLayout">
        <div className="filtersColumn">
          <button
            className="mobileFiltersToggle"
            type="button"
            onClick={() => setFiltersOpen((isOpen) => !isOpen)}
            aria-expanded={filtersOpen}
            aria-controls="product-filters"
          >
            <SlidersHorizontal size={18} />
            {filtersOpen ? 'إخفاء الفلاتر' : 'تصفية المنتجات'}
          </button>
          <aside
            id="product-filters"
            className={`filters${filtersOpen ? ' isOpen' : ''}`}
          >
            <div className="filterTitle">
              <h2>
                <SlidersHorizontal size={18} /> تصفية
              </h2>
              <button onClick={reset}>مسح</button>
            </div>
            <label>
              ابحث بالاسم
              <div className="searchField">
                <Search size={16} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="ابحث عن منتج"
                />
              </div>
            </label>
            <label>
              الفئة
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                <option value="">الكل</option>
                {categories.map((item) => (
                  <option key={item.slug} value={item.slug}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              حتى {money(maxPrice)}
              <input
                type="range"
                min="50"
                max="2000"
                step="50"
                value={maxPrice}
                onChange={(event) => setMaxPrice(+event.target.value)}
              />
            </label>
            <div className="filterAdvanced">
              <label className="check">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(event) => setFeatured(event.target.checked)}
                />{' '}
                المنتجات المميزة
              </label>
              <label className="check">
                <input
                  type="checkbox"
                  checked={discounted}
                  onChange={(event) => setDiscounted(event.target.checked)}
                />{' '}
                عليها خصم
              </label>
              <label className="check">
                <input
                  type="checkbox"
                  checked={inStock}
                  onChange={(event) => setInStock(event.target.checked)}
                />{' '}
                متوفر بالمخزون
              </label>
              <label>
                اللون
                <select
                  value={color}
                  onChange={(event) => setColor(event.target.value)}
                >
                  <option value="">كل الألوان</option>
                  {colors.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label>
                المقاس
                <select
                  value={size}
                  onChange={(event) => setSize(event.target.value)}
                >
                  <option value="">كل المقاسات</option>
                  {sizes.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
            </div>
          </aside>
        </div>
        <div>
          <div className="listingToolbar">
            <b>{items.length} منتج</b>
            <label>
              ترتيب حسب{' '}
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
              >
                <option value="newest">الأحدث</option>
                <option value="featured">الأكثر صلة</option>
                <option value="price-low">الأقل سعرًا</option>
                <option value="price-high">الأعلى سعرًا</option>
              </select>
            </label>
          </div>
          {loading ? (
            <div className="statePanel">جاري البحث…</div>
          ) : error ? (
            <div className="statePanel error">{error}</div>
          ) : items.length ? (
            <div className="products">
              {items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="statePanel">
              <h2>لا توجد نتائج</h2>
              <p>جرّب تغيير كلمات البحث أو الفلاتر.</p>
              <button onClick={reset}>إعادة ضبط الفلاتر</button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
