export function toSlug(value) {
  return (
    String(value)
      .trim()
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .replace(/^-+|-+$/g, '') || `item-${Date.now()}`
  );
}
