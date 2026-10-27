import { api, imageUrl } from './api.js';

function mapProduct(product) {
  const groupedColorImages = (product.colorImages || []).reduce(
    (groups, item) => {
      if (!item?.color) return groups;
      const existing = groups.find((group) => group.color === item.color);
      const images = (item.images || (item.image ? [item.image] : []))
        .map(imageUrl)
        .filter(Boolean);
      if (existing) existing.images.push(...images);
      else groups.push({ color: item.color, images });
      return groups;
    },
    []
  );

  return {
    ...product,
    id: product._id || product.id,
    image: imageUrl(product.images?.[0]),
    colorImages: groupedColorImages,
    salePrice:
      Math.round(
        Number(product.price || 0) *
          (1 - Number(product.discountPercent || 0) / 100) *
          100
      ) / 100,
    category: product.category?.slug,
    categoryName: product.category?.name,
    isNew:
      new Date(product.createdAt) >
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  };
}

export const productService = {
  async getProducts(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== '' && value !== undefined && value !== false)
        params.set(key, value);
    });
    const result = await api(`/products${params.size ? `?${params}` : ''}`);
    return { products: result.data.map(mapProduct), meta: result.meta };
  },
  async getProductBySlug(slug) {
    const result = await api(`/products/${encodeURIComponent(slug)}`);
    return mapProduct(result.data);
  },
  async getCategories() {
    const result = await api('/categories');
    return result.data;
  },
  requestRestock: (data) =>
    api('/restock-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
};
