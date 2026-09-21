import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import Footer from "../components/Footer";
import { BottleIcon, UserIcon } from "../components/icons";

const BOTTLE_META = {
  B3: { label: "أسطوانة B3", size: "حجم صغير", dot: "bg-teal-400" },
  B6: { label: "أسطوانة B6", size: "حجم متوسط", dot: "bg-teal-accent" },
  B12: { label: "أسطوانة B12", size: "حجم تجاري", dot: "bg-navy-700" },
};
const BOTTLE_TYPES = Object.keys(BOTTLE_META);

export default function NewSale() {
  const [prices, setPrices] = useState({});
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [quantities, setQuantities] = useState({ B3: 0, B6: 0, B12: 0 });
  const [status, setStatus] = useState("PAYE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastSale, setLastSale] = useState(null);

  useEffect(() => {
    api.get("/api/settings").then(({ data }) => setPrices(data.prices || {}));
  }, []);

  const total = BOTTLE_TYPES.reduce(
    (sum, type) => sum + (Number(quantities[type]) || 0) * (Number(prices[type]) || 0),
    0
  );
  const totalQty = BOTTLE_TYPES.reduce((sum, type) => sum + (Number(quantities[type]) || 0), 0);

  const updateQty = (type, value) => {
    const digits = value.replace(/[^\d]/g, "");
    const qty = digits === "" ? 0 : Math.max(0, parseInt(digits, 10));
    setQuantities((q) => ({ ...q, [type]: qty }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLastSale(null);

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
      const { data } = await api.post("/api/sales", { buyerName, buyerPhone, quantities, status });
      setLastSale(data);
      setBuyerName("");
      setBuyerPhone("");
      setQuantities({ B3: 0, B6: 0, B12: 0 });
      setStatus("PAYE");
    } catch (err) {
      setError(err.response?.data?.error || "حدث خطأ أثناء الحفظ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <h1 className="text-2xl font-black text-navy-900">نموذج المبيعات</h1>
      <p className="mt-1 text-sm text-gray-500">
        أدخل تفاصيل العميل وحدد الكميات المطلوبة لكل نوع من الأسطوانات لتسجيل عملية توزيع جديدة. الأسعار الحالية معروضة للرجوع إليها.
      </p>

      {lastSale && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm">
          <span className="font-medium text-teal-800">
            تم حفظ الفاتورة {lastSale.invoiceNumber} بمبلغ {Number(lastSale.total).toFixed(2)} MRU
          </span>
          <Link to={`/facture/vente/${lastSale.id}`} className="font-semibold text-navy-900 hover:underline">
            عرض الفاتورة PDF
          </Link>
        </div>
      )}

      <form onSubmit={submit} className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-navy-900">
              <UserIcon className="text-teal-accent" />
              بيانات المشتري
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
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
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">رقم الهاتف (اختياري)</label>
                <input
                  type="tel"
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  dir="ltr"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-left focus:border-teal-accent focus:outline-none"
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-bold text-navy-900">
                <BottleIcon className="text-teal-accent" />
                تفاصيل الطلب
              </h2>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                {BOTTLE_TYPES.length} أنواع متاحة
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-500">
                    <th className="py-2 text-right font-medium">المنتج</th>
                    <th className="py-2 text-center font-medium">السعر الوحدة</th>
                    <th className="py-2 text-center font-medium">الكمية</th>
                    <th className="py-2 text-center font-medium">الإجمالي</th>
                  </tr>
                </thead>
                <tbody>
                  {BOTTLE_TYPES.map((type) => {
                    const meta = BOTTLE_META[type];
                    const unit = Number(prices[type]) || 0;
                    const qty = quantities[type];
                    return (
                      <tr key={type} className="border-b border-gray-50 last:border-0">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                            <div>
                              <p className="font-semibold text-navy-900">{meta.label}</p>
                              <p className="text-xs text-gray-400">{meta.size}</p>
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
          </section>
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl bg-navy-900 p-5 text-white shadow-sm">
            <h2 className="mb-4 text-base font-bold">ملخص الطلب</h2>
            <div className="space-y-2 text-sm text-slate-300">
              <div className="flex items-center justify-between">
                <span>إجمالي الكمية</span>
                <span className="font-medium text-white">{totalQty}</span>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between rounded-xl bg-navy-800 px-4 py-3">
              <span className="text-sm text-slate-300">إجمالي المبيعات</span>
              <span className="text-xl font-bold text-teal-accent">{total.toFixed(2)}</span>
            </div>

            <div className="mt-4">
              <span className="mb-1.5 block text-sm text-slate-300">الحالة</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStatus("PAYE")}
                  className={`rounded-lg py-2 text-sm font-semibold transition-colors ${
                    status === "PAYE" ? "bg-teal-accent text-navy-900" : "bg-navy-800 text-slate-300"
                  }`}
                >
                  مدفوع
                </button>
                <button
                  type="button"
                  onClick={() => setStatus("NON_PAYE")}
                  className={`rounded-lg py-2 text-sm font-semibold transition-colors ${
                    status === "NON_PAYE" ? "bg-red-500 text-white" : "bg-navy-800 text-slate-300"
                  }`}
                >
                  غير مدفوع
                </button>
              </div>
            </div>

            {error && <p className="mt-3 text-sm text-red-300">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full rounded-lg bg-teal-accent py-2.5 font-semibold text-navy-900 hover:brightness-95 disabled:opacity-50"
            >
              {loading ? "...جارٍ الحفظ" : "حفظ المبيعات"}
            </button>
            <p className="mt-3 text-center text-xs text-slate-400">يتم حفظ الفاتورة تلقائياً في السجل</p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-bold text-navy-900">لائحة الأسعار الحالية</h3>
            <ul className="space-y-2 text-sm">
              {BOTTLE_TYPES.map((type) => (
                <li key={type} className="flex items-center justify-between text-gray-600">
                  <span>
                    {type} <span className="text-xs text-gray-400">({BOTTLE_META[type].size})</span>
                  </span>
                  <span className="font-medium text-navy-900">
                    {(Number(prices[type]) || 0).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </form>

      <Footer />
    </div>
  );
}
