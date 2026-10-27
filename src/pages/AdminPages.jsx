import {
  AlertTriangle,
  CheckCircle2,
  Edit3,
  LoaderCircle,
  PackagePlus,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { adminService } from '../services/adminService.js';
import { money } from '../utils/money.js';

const statusLabels = {
  new: 'جديد',
  confirmed: 'مؤكد',
  preparing: 'قيد التجهيز',
  shipped: 'تم الشحن',
  completed: 'مكتمل',
  cancelled: 'ملغي',
};
function useRemote(load, deps = []) {
  const [data, setData] = useState(null),
    [error, setError] = useState('');
  const refresh = () => {
    setError('');
    load()
      .then(setData)
      .catch((e) => setError(e.message));
  };
  useEffect(refresh, deps);
  return { data, error, refresh };
}
function Notice({ message, error }) {
  return message ? (
    <div className={`adminAlert ${error ? 'error' : 'success'}`}>
      {error ? <AlertTriangle size={17} /> : <CheckCircle2 size={17} />}{' '}
      {message}
    </div>
  ) : null;
}
function Empty({ children }) {
  return <div className="adminEmpty">{children}</div>;
}

export function AdminDashboardPage() {
  const { data, error, refresh } = useRemote(adminService.summary);
  const summary = data?.data;
  if (!summary) return <AdminLoading error={error} retry={refresh} />;
  return (
    <section className="adminPage">
      <AdminHeading
        title="لوحة التحكم"
        subtitle="ملخص الأداء من بيانات المتجر الفعلية"
        subtitleClassName="adminReadableSubtitle"
      />
      <div className="statsGrid">
        {[
          ['إجمالي المبيعات', money(summary.sales)],
          ['الطلبات', summary.orders],
          ['المنتجات', summary.products],
          ['مخزون منخفض', summary.lowStock],
        ].map(([name, value]) => (
          <article className="statCard" key={name}>
            <span>{name}</span>
            <b>{value}</b>
          </article>
        ))}
      </div>
      <div className="adminTwoCol">
        <section className="adminCard">
          <h2>أحدث الطلبات</h2>
          <OrdersTable orders={summary.recentOrders} />
        </section>
        <section className="adminCard">
          <h2>قارب على النفاد</h2>
          {summary.lowStockProducts.length ? (
            summary.lowStockProducts.map((p) => (
              <div className="lowStock" key={p._id}>
                <span>{p.name}</span>
                <b>{p.stock} قطع</b>
              </div>
            ))
          ) : (
            <Empty>لا توجد منتجات منخفضة حاليًا.</Empty>
          )}
        </section>
      </div>
    </section>
  );
}
function AdminHeading({ title, subtitle, action, subtitleClassName = '' }) {
  return (
    <header className="adminHeading">
      <div>
        <p className={subtitleClassName}>{subtitle}</p>
        <h1>{title}</h1>
      </div>
      {action}
    </header>
  );
}
function AdminLoading({ error, retry }) {
  return (
    <section className="adminPage">
      <div className="adminEmpty">
        {error ? (
          <>
            <p>{error}</p>
            <button onClick={retry}>إعادة المحاولة</button>
          </>
        ) : (
          <>
            <LoaderCircle className="spin" />
            جاري التحميل…
          </>
        )}
      </div>
    </section>
  );
}
function OrdersTable({ orders, onStatus, onSelect, onDelete }) {
  return (
    <div className="adminTableWrap">
      <table className="adminTable">
        <thead>
          <tr>
            <th>رقم الطلب</th>
            <th>العميل</th>
            <th>المنطقة</th>
            <th>الإجمالي</th>
            <th>الحالة</th>
            {onSelect && <th>التفاصيل</th>}
            {onDelete && <th>إجراءات</th>}
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o._id}>
              <td>#{o._id.slice(-6)}</td>
              <td>
                {o.customer.name}
                <small>{o.customer.phone}</small>
              </td>
              <td>{o.customer.region}</td>
              <td>{money(o.total)}</td>
              <td>
                {onStatus ? (
                  <select
                    value={o.status}
                    onChange={(e) => onStatus(o._id, e.target.value)}
                  >
                    {Object.entries(statusLabels).map(([v, l]) => (
                      <option value={v} key={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className={`orderStatus ${o.status}`}>
                    {statusLabels[o.status]}
                  </span>
                )}
              </td>
              {onSelect && (
                <td>
                  <button onClick={() => onSelect(o)}>عرض</button>
                </td>
              )}
              {onDelete && (
                <td>
                  <button
                    className="danger"
                    aria-label="حذف الطلب"
                    onClick={() => onDelete(o)}
                  >
                    <Trash2 size={17} />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AdminProductsPage({ inventoryOnly = false }) {
  const [filters, setFilters] = useState({
    q: '',
    lowStock: inventoryOnly ? 'true' : '',
  });
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState('');
  const { data, error, refresh } = useRemote(
    () => adminService.products(filters),
    [filters.q, filters.lowStock]
  );
  const cats = useRemote(adminService.categories);
  const items = data?.data;
  const remove = async (p) => {
    if (!confirm(`حذف «${p.name}»؟ لا يمكن إرجاع العملية.`)) return;
    try {
      await adminService.deleteProduct(p._id);
      setNotice('تم حذف المنتج.');
      refresh();
    } catch (e) {
      setNotice(e.message);
    }
  };
  if (!items) return <AdminLoading error={error} retry={refresh} />;
  return (
    <section className="adminPage">
      <AdminHeading
        title={inventoryOnly ? 'إدارة المخزون' : 'المنتجات'}
        subtitle={
          inventoryOnly
            ? 'المنتجات التي تحتاج متابعة في المخزون'
            : 'إضافة وتعديل وإخفاء المنتجات'
        }
        subtitleClassName={inventoryOnly ? 'adminReadableSubtitle' : ''}
        action={
          !inventoryOnly && (
            <button className="adminPrimary" onClick={() => setEditing({})}>
              <Plus size={18} />
              إضافة منتج
            </button>
          )
        }
      />
      <Notice message={notice} error={notice && !notice.startsWith('تم')} />
      <div className="adminFilters">
        <input
          placeholder="ابحث باسم المنتج…"
          value={filters.q}
          onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
        />
        <label>
          <input
            type="checkbox"
            checked={filters.lowStock === 'true'}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                lowStock: e.target.checked ? 'true' : '',
              }))
            }
          />{' '}
          مخزون منخفض
        </label>
      </div>
      {items.length ? (
        <div className="adminTableWrap">
          <table className="adminTable">
            <thead>
              <tr>
                <th>المنتج</th>
                <th>التصنيف</th>
                <th>السعر</th>
                <th>المخزون</th>
                <th>الظهور</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p._id}>
                  <td className="productCell">
                    {p.images?.[0] && (
                      <img src={adminService.image(p.images[0])} alt="" />
                    )}
                    <b>{p.name}</b>
                    {p.featured && (
                      <small className="featuredTag">الأكثر مبيعًا</small>
                    )}
                  </td>
                  <td>{p.category?.name || '—'}</td>
                  <td>{money(p.price)}</td>
                  <td className={p.stock <= 5 ? 'stockLow' : ''}>{p.stock}</td>
                  <td>{p.isPublished ? 'ظاهر' : 'مخفي'}</td>
                  <td>
                    <button aria-label="تعديل" onClick={() => setEditing(p)}>
                      <Edit3 size={17} />
                    </button>
                    <button
                      className="danger"
                      aria-label="حذف"
                      onClick={() => remove(p)}
                    >
                      <Trash2 size={17} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty>لا توجد منتجات مطابقة.</Empty>
      )}
      {editing && (
        <ProductModal
          product={editing}
          categories={cats.data?.data || []}
          close={() => setEditing(null)}
          saved={() => {
            setEditing(null);
            setNotice('تم حفظ المنتج بنجاح.');
            refresh();
          }}
        />
      )}
    </section>
  );
}
const splitOptions = (value) =>
  value
    .split(/[,،]/)
    .map((item) => item.trim())
    .filter(Boolean);
const variantKey = (color = '', size = '') => `${color}::${size}`;
function variantRows(colors, sizes) {
  if (colors.length && sizes.length)
    return colors.flatMap((color) => sizes.map((size) => ({ color, size })));
  if (colors.length) return colors.map((color) => ({ color, size: '' }));
  if (sizes.length) return sizes.map((size) => ({ color: '', size }));
  return [];
}
function ProductModal({ product, categories, close, saved }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [withColors, setWithColors] = useState(
    (product.colors || []).length > 0
  );
  const [withSizes, setWithSizes] = useState((product.sizes || []).length > 0);
  const [colorsText, setColorsText] = useState(
    (product.colors || []).join(', ')
  );
  const [sizesText, setSizesText] = useState((product.sizes || []).join(', '));
  const [stocks, setStocks] = useState(() =>
    Object.fromEntries(
      (product.variants || []).map((item) => [
        variantKey(item.color, item.size),
        item.stock,
      ])
    )
  );
  const [selectedColorFiles, setSelectedColorFiles] = useState({});
  const colors = withColors ? splitOptions(colorsText) : [];
  const sizes = withSizes ? splitOptions(sizesText) : [];
  const rows = variantRows(colors, sizes);
  const totalStock = rows.reduce(
    (total, row) =>
      total + Number(stocks[variantKey(row.color, row.size)] || 0),
    0
  );
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const form = event.currentTarget;
    const data = new FormData(form);
    data.set('colors', JSON.stringify(colors));
    data.set('sizes', JSON.stringify(sizes));
    data.set(
      'variants',
      JSON.stringify(
        rows.map((row) => ({
          ...row,
          stock: Number(stocks[variantKey(row.color, row.size)] || 0),
        }))
      )
    );
    if (rows.length) data.set('stock', String(totalStock));
    data.delete('colorImages');
    const imageColors = [];
    Object.entries(selectedColorFiles).forEach(([color, files]) =>
      files.forEach((file) => {
        data.append('colorImages', file);
        imageColors.push(color);
      })
    );
    data.set('colorImageColors', JSON.stringify(imageColors));
    try {
      await adminService.saveProduct(product._id, data);
      saved();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="adminModal">
      <form className="adminForm" onSubmit={submit}>
        <button type="button" className="modalClose" onClick={close}>
          <X />
        </button>
        <h2>{product._id ? 'تعديل المنتج' : 'إضافة منتج'}</h2>
        <Notice message={error} error />
        <div className="formGrid">
          <label>
            اسم المنتج
            <input required name="name" defaultValue={product.name} />
          </label>
          <label>
            التصنيف
            <select
              required
              name="category"
              defaultValue={product.category?._id || product.category || ''}
            >
              <option value="">اختر التصنيف</option>
              {categories.map((category) => (
                <option value={category._id} key={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            السعر الأصلي بالشيكل
            <input
              required
              name="price"
              type="number"
              min="0"
              defaultValue={product.price}
            />
          </label>
          <label>
            نسبة الخصم (%)
            <input
              name="discountPercent"
              type="number"
              min="0"
              max="100"
              step="1"
              defaultValue={product.discountPercent || ''}
              placeholder="اتركه فارغًا دون خصم"
            />
          </label>
          {!rows.length && (
            <label>
              الكمية المتاحة
              <input
                required
                name="stock"
                type="number"
                min="0"
                defaultValue={product.stock ?? 0}
              />
            </label>
          )}
        </div>
        <label>
          الوصف
          <textarea
            required
            name="description"
            rows="4"
            defaultValue={product.description}
          />
        </label>
        <label>
          صور المنتج الأساسية
          <input
            name="images"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
          />
        </label>
        <div className="optionsCard">
          <b>ألوان ومقاسات المنتج</b>
          <label>
            <input
              type="checkbox"
              checked={withColors}
              onChange={(event) => setWithColors(event.target.checked)}
            />{' '}
            ألوان
          </label>
          <label>
            <input
              type="checkbox"
              checked={withSizes}
              onChange={(event) => setWithSizes(event.target.checked)}
            />{' '}
            مقاسات
          </label>
          {withColors && (
            <label>
              الألوان (افصل بينها بفاصلة)
              <input
                value={colorsText}
                onChange={(event) => setColorsText(event.target.value)}
                placeholder="أسود، أحمر، ذهبي"
              />
            </label>
          )}
          {withSizes && (
            <label>
              المقاسات (افصل بينها بفاصلة)
              <input
                value={sizesText}
                onChange={(event) => setSizesText(event.target.value)}
                placeholder="S, M, L, XL"
              />
            </label>
          )}
          {colors.length > 0 && (
            <div className="colorUploadList">
              <b>صور كل لون</b>
              <small>
                اختر عدة صور دفعة واحدة، أو اختر صورًا إضافية لاحقًا؛ كلها
                ستُحفظ للون نفسه.
              </small>
              {colors.map((color) => {
                const selected = selectedColorFiles[color] || [];
                const currentCount = (product.colorImages || []).filter(
                  (item) => item.color === color
                ).length;
                return (
                  <label key={color}>
                    صور لون «{color}»
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      onChange={(event) => {
                        const files = Array.from(event.target.files || []);
                        if (files.length)
                          setSelectedColorFiles((current) => ({
                            ...current,
                            [color]: [...(current[color] || []), ...files],
                          }));
                        event.target.value = '';
                      }}
                    />
                    <small className="uploadStatus">
                      {currentCount
                        ? `موجود حاليًا: ${currentCount} صورة.`
                        : 'لا توجد صور محفوظة لهذا اللون بعد.'}{' '}
                      {selected.length
                        ? `سيتم رفع ${selected.length} صورة جديدة: ${selected.map((file) => file.name).join('، ')}`
                        : ''}
                    </small>
                  </label>
                );
              })}
            </div>
          )}
          {rows.length > 0 && (
            <div className="variantStockGrid">
              <b>مخزون كل تركيبة</b>
              <small>الإجمالي: {totalStock} قطعة</small>
              {rows.map((row) => {
                const key = variantKey(row.color, row.size);
                return (
                  <label key={key}>
                    {[row.color, row.size].filter(Boolean).join(' / ')}
                    <input
                      required
                      type="number"
                      min="0"
                      value={stocks[key] ?? 0}
                      onChange={(event) =>
                        setStocks((current) => ({
                          ...current,
                          [key]: event.target.value,
                        }))
                      }
                    />
                  </label>
                );
              })}
            </div>
          )}
        </div>
        <div className="productFlags">
          <label className="checkLabel">
            <input
              type="checkbox"
              name="isPublished"
              value="true"
              defaultChecked={product.isPublished}
            />{' '}
            إظهار المنتج في المتجر
          </label>
          <label className="checkLabel">
            <input
              type="checkbox"
              name="featured"
              value="true"
              defaultChecked={product.featured}
            />{' '}
            إظهار ضمن «الأكثر مبيعًا»
          </label>
        </div>
        <button className="adminPrimary" disabled={busy}>
          {busy ? 'جاري الحفظ…' : 'حفظ المنتج'}
        </button>
      </form>
    </div>
  );
}

export function AdminCategoriesPage() {
  const { data, error, refresh } = useRemote(adminService.categories);
  const [edit, setEdit] = useState(null);
  const [notice, setNotice] = useState('');
  if (!data) return <AdminLoading error={error} retry={refresh} />;
  const remove = async (c) => {
    if (!confirm(`حذف تصنيف «${c.name}»؟`)) return;
    try {
      await adminService.deleteCategory(c._id);
      setNotice('تم حذف التصنيف.');
      refresh();
    } catch (e) {
      setNotice(e.message);
    }
  };
  return (
    <section className="adminPage">
      <AdminHeading
        title="التصنيفات"
        subtitle="أي تصنيف تضيفه يظهر تلقائيًا في المتجر"
        action={
          <button className="adminPrimary" onClick={() => setEdit({})}>
            <Plus size={18} />
            إضافة تصنيف
          </button>
        }
      />
      <Notice message={notice} error={notice && !notice.startsWith('تم')} />
      <div className="categoryAdminGrid">
        {data.data.map((c) => (
          <article className="categoryAdminCard" key={c._id}>
            {c.image && <img src={adminService.image(c.image)} alt="" />}
            <span>{c.icon}</span>
            <h2>{c.name}</h2>
            <p>{c.description || 'بدون وصف'}</p>
            <small>{c.isActive ? 'ظاهر في المتجر' : 'مخفي من المتجر'}</small>
            <div>
              <button onClick={() => setEdit(c)}>
                <Edit3 size={16} />
                تعديل
              </button>
              <button className="danger" onClick={() => remove(c)}>
                <Trash2 size={16} />
                حذف
              </button>
            </div>
          </article>
        ))}
      </div>
      {edit && (
        <CategoryModal
          category={edit}
          close={() => setEdit(null)}
          saved={() => {
            setEdit(null);
            setNotice('تم حفظ التصنيف.');
            refresh();
          }}
        />
      )}
    </section>
  );
}
function CategoryModal({ category, close, saved }) {
  const [error, setError] = useState('');
  async function submit(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      await adminService.saveCategory(category._id, f);
      saved();
    } catch (err) {
      setError(err.message);
    }
  }
  return (
    <div className="adminModal">
      <form className="adminForm" onSubmit={submit}>
        <button type="button" className="modalClose" onClick={close}>
          <X />
        </button>
        <h2>{category._id ? 'تعديل التصنيف' : 'إضافة تصنيف'}</h2>
        <Notice message={error} error />
        <label>
          اسم التصنيف
          <input required name="name" defaultValue={category.name} />
        </label>
        <label>
          الوصف
          <textarea name="description" defaultValue={category.description} />
        </label>
        <label>
          الرمز
          <input name="icon" defaultValue={category.icon || '✦'} />
        </label>
        <label>
          صورة التصنيف
          <input
            name="image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
          />
        </label>
        <label className="checkLabel">
          <input
            type="checkbox"
            name="isActive"
            value="true"
            defaultChecked={category.isActive !== false}
          />{' '}
          إظهار التصنيف في المتجر
        </label>
        <button className="adminPrimary">حفظ التصنيف</button>
      </form>
    </div>
  );
}

export function AdminOrdersPage() {
  const [filters, setFilters] = useState({ status: '', q: '' });
  const { data, error, refresh } = useRemote(
    () => adminService.orders(filters),
    [filters.status, filters.q]
  );
  const [notice, setNotice] = useState('');
  const [selected, setSelected] = useState(null);
  if (!data) return <AdminLoading error={error} retry={refresh} />;
  const update = async (id, status) => {
    try {
      await adminService.updateOrder(id, status);
      setNotice('تم تحديث حالة الطلب.');
      refresh();
    } catch (e) {
      setNotice(e.message);
    }
  };
  const remove = async (order) => {
    if (
      !confirm(`حذف الطلب #${order._id.slice(-6)}؟ ستعود كمياته إلى المخزون.`)
    )
      return;
    try {
      await adminService.deleteOrder(order._id);
      setNotice('تم حذف الطلب وإعادة الكميات للمخزون.');
      setSelected(null);
      refresh();
    } catch (e) {
      setNotice(e.message);
    }
  };
  return (
    <section className="adminPage">
      <AdminHeading
        title="الطلبات"
        subtitle="متابعة العملاء وتغيير حالة تجهيز الطلب"
      />
      <Notice message={notice} error={notice && !notice.startsWith('تم')} />
      <div className="adminFilters">
        <input
          placeholder="ابحث باسم العميل أو الهاتف"
          value={filters.q}
          onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
        />
        <select
          value={filters.status}
          onChange={(e) =>
            setFilters((f) => ({ ...f, status: e.target.value }))
          }
        >
          <option value="">كل الحالات</option>
          {Object.entries(statusLabels).map(([v, l]) => (
            <option value={v} key={v}>
              {l}
            </option>
          ))}
        </select>
      </div>
      {data.data.length ? (
        <OrdersTable
          orders={data.data}
          onStatus={update}
          onSelect={setSelected}
          onDelete={remove}
        />
      ) : (
        <Empty>لا توجد طلبات مطابقة.</Empty>
      )}
      {selected && (
        <OrderModal order={selected} close={() => setSelected(null)} />
      )}
    </section>
  );
}
function OrderModal({ order, close }) {
  return (
    <div className="adminModal">
      <section className="adminForm">
        <button className="modalClose" onClick={close}>
          <X />
        </button>
        <h2>تفاصيل الطلب #{order._id.slice(-6)}</h2>
        <p>
          <b>العميل:</b> {order.customer.name}
        </p>
        <p>
          <b>الهاتف:</b> {order.customer.phone}
        </p>
        <p>
          <b>المنطقة:</b> {order.customer.region}
        </p>
        <p>
          <b>الملاحظات:</b> {order.customer.notes || 'لا توجد ملاحظات'}
        </p>
        <h3>المنتجات</h3>
        {order.items.map((item, index) => (
          <p key={index}>
            {item.name} — {item.quantity} × {money(item.unitPrice)}{' '}
            {item.selectedColor && `(${item.selectedColor})`}{' '}
            {item.selectedSize && `(${item.selectedSize})`}
          </p>
        ))}
        <hr />
        <b>الإجمالي: {money(order.total)}</b>
      </section>
    </div>
  );
}
