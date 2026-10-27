import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard.jsx';
import { productService } from '../services/productService.js';
export function HomePage() {
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [fresh, setFresh] = useState([]);
  const [catalogError, setCatalogError] = useState('');
  useEffect(() => {
    Promise.all([
      productService.getCategories(),
      productService.getProducts({ featured: true, limit: 4 }),
      productService.getProducts({ limit: 4, sort: 'newest' }),
    ])
      .then(([categoryData, featuredData, freshData]) => {
        setCategories(categoryData);
        setFeatured(featuredData.products);
        setFresh(freshData.products);
      })
      .catch((error) => setCatalogError(error.message));
  }, []);
  return (
    <>
      <section className="hero" />
      <section className="section categorySection">
        <p className="hint">اختياراتك المفضلة</p>
        <h2>تسوّق حسب الفئة</h2>
        <div className="categories">
          {categories.map((category) => (
            <Link key={category.slug} to={`/category/${category.slug}`}>
              <span>{category.icon}</span>
              <b>{category.name}</b>
              <small>{category.countLabel}</small>
            </Link>
          ))}
        </div>
      </section>
      {catalogError ? (
        <section className="section">
          <div className="statePanel error">{catalogError}</div>
        </section>
      ) : (
        <>
          <ProductStrip
            title="الأكثر مبيعًا"
            subtitle="مختارات أبابيل"
            products={featured}
          />
          <ProductStrip
            title="وصل حديثًا"
            subtitle="منتجات جديدة"
            products={fresh}
          />
        </>
      )}
    </>
  );
}
function ProductStrip({ title, subtitle, products: items }) {
  return (
    <section className="section productSection">
      <div className="sectionHeading">
        <div>
          <p className="hint">{subtitle}</p>
          <h2>{title}</h2>
        </div>
        <Link to="/products">عرض كل المنتجات ←</Link>
      </div>
      <div className="products">
        {items.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
