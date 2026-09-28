import { useEffect, useState } from "react";
import api from "../api/client";
import Footer from "../components/Footer";
import Toast from "../components/Toast";
import { PhoneIcon, BottleIcon } from "../components/icons";

const BOTTLE_META = {
  b3: { size: "صغير", dot: "bg-teal-400" },
  b6: { size: "متوسط", dot: "bg-teal-accent" },
  b12: { size: "كبير جداً", dot: "bg-navy-700" },
};
const BOTTLE_TYPES = Object.keys(BOTTLE_META); // ["b3", "b6", "b12"] ✅

export default function Settings() {
  const [phone, setPhone] = useState("");
  const [prices, setPrices] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toastOpen, setToastOpen] = useState(false);

  const load = async () => {
    const { data } = await api.get("/api/settings");
    setPhone(data.phone || "");
    setPrices(data.prices || {});
  };

  useEffect(() => {
    load();
  }, []);

  const saveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.put("/api/settings", { phone, prices });
      setToastOpen(true);
    } catch (err) {
      setError(err.response?.data?.error || "حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <form onSubmit={saveSettings}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-navy-900">إعدادات التاجر</h1>
            <p className="mt-1 text-sm text-gray-500">إدارة معلومات المتجر وأسعار الغاز.</p>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-50"
            >
              {saving ? "...جارٍ الحفظ" : "حفظ الإعدادات"}
            </button>
            <button
              type="button"
              onClick={load}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              إلغاء
            </button>
          </div>
        </div>

        {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="mb-1 flex items-center gap-2 text-base font-bold text-navy-900">
                <BottleIcon className="text-teal-accent" />
                إعدادات أسعار الغاز
              </h2>
              <p className="mb-4 text-sm text-gray-500">تحديد سعر البيع لكل حجم من الأسطوانات (MRU).</p>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {BOTTLE_TYPES.map((type) => (
                  <div key={type} className="rounded-xl border border-gray-200 p-4">
                    <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                      <span className={`h-1.5 w-1.5 rounded-full ${BOTTLE_META[type].dot}`} />
                      {BOTTLE_META[type].size}
                    </span>
                    <p className="font-bold text-navy-900">قنينة {type}</p>
                    <p className="mb-3 text-xs text-gray-400">تحديد سعر البيع لهذا الحجم من الأسطوانات (MRU).</p>
                    <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
                      <span className="text-xs font-medium text-gray-400">MRU</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        dir="ltr"
                        value={prices[type] ?? ""}
                        onChange={(e) => {
                          const raw = e.target.value.replace(",", ".");
                          if (/^\d*\.?\d{0,2}$/.test(raw)) {
                            setPrices((p) => ({ ...p, [type]: raw }));
                          }
                        }}
                        className="w-full bg-transparent text-left text-lg font-bold text-navy-900 focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-white p-5 text-sm shadow-sm">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs text-gray-500">
                i
              </span>
              <div>
                <p className="font-bold text-navy-900">معلومات التسعير</p>
                <p className="mt-1 text-gray-500">
                  تأكد من تحديث الأسعار بانتظام وفقاً للتعرفة الوطنية. أي تغيير في الأسعار سيتم تطبيقه فوراً على المبيعات الجديدة، ولن يؤثر على سجل المعاملات السابقة.
                </p>
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-sm font-bold text-navy-900">معلومات التاجر الأساسية</h3>
              <label className="mb-1 block text-xs text-gray-500">اسم التاجر</label>
              <input
                type="text"
                value="Bezeid"
                disabled
                className="mb-1 w-full rounded-lg bg-slate-50 px-3 py-2 text-sm text-gray-400"
              />
              <p className="mb-4 text-xs text-gray-400">لا يمكن تغيير اسم التاجر من هذه اللوحة.</p>

              <label className="mb-1 flex items-center gap-1.5 text-xs text-gray-500">
                <PhoneIcon />
                هاتف التاجر (يظهر أسفل الفاتورة)
              </label>
              <input
                type="tel"
                dir="ltr"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-left text-sm focus:border-teal-accent focus:outline-none"
              />
            </section>
          </aside>
        </div>
      </form>

      <Footer />

      <Toast open={toastOpen} message="تم الحفظ بنجاح" onClose={() => setToastOpen(false)} />
    </div>
  );
}
