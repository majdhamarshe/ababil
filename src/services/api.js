const API_URL = import.meta.env.VITE_API_URL || '/api';
const SERVER_URL = API_URL.startsWith('http')
  ? API_URL.replace(/\/api$/, '')
  : '';

export async function api(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      headers: { Accept: 'application/json', ...options.headers },
      ...options,
    });
  } catch {
    throw new Error(
      'تعذّر الاتصال بالخادم. تأكد من تشغيل API ثم أعد المحاولة.'
    );
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || 'تعذّر إتمام الطلب.');
  return body;
}
export function imageUrl(image) {
  if (!image || image.startsWith('http') || image.startsWith('/WhatsApp'))
    return image;
  return `${SERVER_URL}${image}`;
}
