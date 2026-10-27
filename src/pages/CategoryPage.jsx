import { useParams } from 'react-router-dom';
import { ProductsPage } from './ProductsPage.jsx';
export function CategoryPage() {
  const { slug } = useParams();
  return <ProductsPage forcedCategory={slug} />;
}
