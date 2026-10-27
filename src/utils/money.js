export const money = (value) =>
  `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value)} ₪`;
