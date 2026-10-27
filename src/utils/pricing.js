export function salePrice(product) {
  if (typeof product.salePrice === 'number') return product.salePrice;
  const discount = Number(product.discountPercent || 0);
  return (
    Math.round(Number(product.price || 0) * (1 - discount / 100) * 100) / 100
  );
}

export const hasDiscount = (product) =>
  Number(product.discountPercent || 0) > 0;
