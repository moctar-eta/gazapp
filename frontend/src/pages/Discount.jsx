import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import Footer from "../components/Footer";
import Modal from "../components/Modal";
import ConfirmModal from "../components/ConfirmModal";
import { DiscountIcon, TrashIcon, DownloadIcon, SettingsIcon } from "../components/icons";

const BOTTLE_META = {
  B3: { size: "حجم صغير", dot: "bg-teal-400" },
  B6: { size: "حجم متوسط", dot: "bg-teal-accent" },
  B12: { size: "حجم تجاري", dot: "bg-navy-700" },
};
const BOTTLE_TYPES = Object.keys(BOTTLE_META);

export default function Discount() {
  const [prices, setPrices] = useState({});
  const [priceDrafts, setPriceDrafts] = useState({});
  const [savingPrices, setSavingPrices] = useState(false);
  const [priceMessage, setPriceMessage] = useState("");

  const [buyerName, setBuyerName] = useState("");
  const [quantities, setQuantities] = useState({ B3: 0, B6: 0, B12: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [discounts, setDiscounts] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [priceSettingsOpen, setPriceSettingsOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const loadPrices = useCallback(async () => {
    const { data } = await api.get("/api/discounts/prices");
    setPrices(data || {});
    setPriceDrafts(data || {});
  }, []);

  const loadList = useCallback(async () => {
    setListLoading(true);
    try {
      const { data } = await api.get("/api/discounts");
      setDiscounts(data);
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPrices();
    loadList();
  }, [loadPrices, loadList]);

  const total = BOTTLE_TYPES.reduce(
    (sum, type) => sum + (Number(quantities[type]) || 0) * (Number(prices[type]) || 0),
    0
  );

  const updateQty = (type, value) => {
    const digits = value.replace(/[^\d]/g, "");
    const qty = digits === "" ? 0 : Math.max(0, parseInt(digits, 10));
    setQuantities((q) => ({ ...q, [type]: qty }));
  };

  const updatePriceDraft = (type, value) => {
    const raw = value.replace(",", ".");
    if (/^\d*\.?\d{0,2}$/.test(raw)) {
      setPriceDrafts((p) => ({ ...p, [type]: raw }));
    }
  };

  const savePrices = async () => {
    setSavingPrices(true);
    setPriceMessage("");
    try {
      await api.put("/api/discounts/prices", { prices: priceDrafts });
      await loadPrices();
      setPriceMessage("تم حفظ أسعار التخفيض.");
    } finally {
      setSavingPrices(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!buyerName.trim()) {
      setError("اسم المشتري مطلوب");
      return;
    }
    if (BOTTLE_TYPES.every((t) => !quantities[t])) {
      setError("اختر كمية واحدة على الأقل");
      return;
    }

    setLoading(true);
    try {
      await api.post("/api/discounts", { buyerName, quantities });
      setMessage("تم حفظ التخفيض بنجاح.");
      setBuyerName("");
      setQuantities({ B3: 0, B6: 0, B12: 0 });
      loadList();
    } catch (err) {
      setError(err.response?.data?.error || "حدث خطأ أثناء الحفظ");
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id) => {
    setDeletingId(id);
    try {
      await api.delete(`/api/discounts/${id}`);
      setDiscounts((d) => d.filter((x) => x.id !== id));
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-navy-900">التخفيض</h1>
          <p className="mt-1 text-sm text-gray-500">
            سجّل عملية بيع بسعر مخفّض لأحد الزبائن — الكمية تُحسب تلقائياً حسب أسعار التخفيض.
          </p>
        </div>
        <button
          onClick={() => setPriceSettingsOpen(true)}
          title="إعدادات سعر التخفيض"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
        >
          <SettingsIcon />
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* نموذج التخفيض */}
          <form onSubmit={submit} className="space-y-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-base font-bold text-navy-900">
              <DiscountIcon className="text-teal-accent" />
              تخفيض جديد
            </h2>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">اسم المشتري *</label>
              <input
                type="text"
                required
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="أدخل الاسم الكامل"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:border-teal-accent focus:outline-none"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-500">
                    <th className="py-2 text-right font-medium">المنتج</th>
                    <th className="py-2 text-center font-medium">سعر التخفيض</th>
                    <th className="py-2 text-center font-medium">الكمية</th>
                    <th className="py-2 text-center font-medium">الإجمالي</th>
                  </tr>
                </thead>
                <tbody>
                  {BOTTLE_TYPES.map((type) => {
                    const unit = Number(prices[type]) || 0;
                    const qty = quantities[type];
                    return (
                      <tr key={type} className="border-b border-gray-50 last:border-0">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${BOTTLE_META[type].dot}`} />
                            <div>
                              <p className="font-semibold text-navy-900">أسطوانة {type}</p>
                              <p className="text-xs text-gray-400">{BOTTLE_META[type].size}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-center text-gray-600">{unit.toFixed(2)} MRU</td>
                        <td className="py-3">
                          <input
                            type="text"
                            inputMode="numeric"
                            dir="ltr"
                            value={qty}
                            onChange={(e) => updateQty(type, e.target.value)}
                            className="mx-auto block w-20 rounded-lg border border-gray-300 px-2 py-1.5 text-center focus:border-teal-accent focus:outline-none"
                          />
                        </td>
                        <td className="py-3 text-center font-semibold text-navy-900">
                          {(unit * qty).toFixed(2)} MRU
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-teal-50 px-4 py-3">
              <span className="font-medium text-teal-800">الإجمالي</span>
              <span className="text-xl font-bold text-teal-800">{total.toFixed(2)} MRU</span>
            </div>

            {message && <p className="text-sm font-medium text-teal-700">{message}</p>}
            {error && <p className="text-sm font-medium text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-navy-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-50"
            >
              {loading ? "...جارٍ الحفظ" : "حفظ التخفيض"}
            </button>
          </form>
        </div>

        {/* سجل التخفيضات */}
        <aside className="rounded-2xl border border-gray-100 bg-white shadow-sm">
          <h3 className="border-b border-gray-100 px-5 py-3 text-sm font-bold text-navy-900">
            سجل التخفيضات
          </h3>
          {listLoading ? (
            <p className="p-6 text-center text-sm text-gray-500">...جارٍ التحميل</p>
          ) : discounts.length === 0 ? (
            <p className="p-6 text-center text-sm text-gray-500">لا توجد تخفيضات مسجلة.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {discounts.map((d) => (
                <div key={d.id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-navy-900">{d.buyerName}</p>
                      <p dir="ltr" className="text-right text-xs text-gray-400">
                        {new Date(d.createdAt).toLocaleDateString("fr-FR", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                        })}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-navy-900">MRU {Number(d.total).toFixed(2)}</p>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {d.items.map((it) => (
                      <span
                        key={it.id}
                        className="rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-700"
                      >
                        {it.bottleType}: {it.quantity}
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 flex items-center gap-4">
                    <Link
                      to={`/facture/reduction/${d.id}`}
                      className="flex items-center gap-1 text-xs font-medium text-navy-900"
                    >
                      <DownloadIcon width="13" height="13" />
                      عرض الفاتورة
                    </Link>
                    <button
                      onClick={() => setConfirmDeleteId(d.id)}
                      disabled={deletingId === d.id}
                      className="flex items-center gap-1 text-xs font-medium text-red-600 disabled:opacity-50"
                    >
                      <TrashIcon width="13" height="13" />
                      حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>

      <Footer />

      <Modal open={priceSettingsOpen} title="إعدادات سعر التخفيض" onClose={() => setPriceSettingsOpen(false)}>
        <p className="mb-4 text-sm text-gray-500">
          أسعار خاصة تُستخدم فقط في هذه الصفحة، منفصلة عن الأسعار العادية في الإعدادات العامة.
        </p>
        <div className="space-y-3">
          {BOTTLE_TYPES.map((type) => (
            <div key={type} className="rounded-xl border border-gray-200 p-3">
              <span className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                <span className={`h-1.5 w-1.5 rounded-full ${BOTTLE_META[type].dot}`} />
                {type}
              </span>
              <div className="mt-1 flex items-center gap-2 rounded-lg border border-gray-200 px-2 py-1.5">
                <span className="text-[11px] font-medium text-gray-400">MRU</span>
                <input
                  type="text"
                  inputMode="decimal"
                  dir="ltr"
                  value={priceDrafts[type] ?? ""}
                  onChange={(e) => updatePriceDraft(type, e.target.value)}
                  className="w-full bg-transparent text-left text-sm font-bold text-navy-900 focus:outline-none"
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={savePrices}
            disabled={savingPrices}
            className="rounded-lg bg-navy-900 px-4 py-1.5 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-50"
          >
            {savingPrices ? "...جارٍ الحفظ" : "حفظ أسعار التخفيض"}
          </button>
          {priceMessage && <span className="text-sm text-teal-700">{priceMessage}</span>}
        </div>
      </Modal>

      <ConfirmModal
        open={confirmDeleteId !== null}
        title="حذف التخفيض"
        message="هل تريد فعلاً حذف هذا التخفيض؟ لا يمكن التراجع عن هذا الإجراء."
        confirmLabel="حذف"
        icon="trash"
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={() => remove(confirmDeleteId)}
      />
    </div>
  );
}
