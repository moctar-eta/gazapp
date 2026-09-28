import { useEffect, useState, useCallback } from "react";
import api from "../api/client";
import Footer from "../components/Footer";
import { DebtIcon, CheckIcon, TrashIcon } from "../components/icons";

export default function Debts() {
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  // État pour gérer la modale de confirmation
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/sales", { params: { status: "unpaid" } });
      const list = Array.isArray(data) ? data : data.sales || data.data || [];
      setDebts(list);
    } catch (err) {
      console.error("Erreur chargement dettes :", err);
      setDebts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const markPaid = async (id) => {
    setUpdatingId(id);
    try {
      await api.patch(`/api/sales/${id}/status`, { status: "paid" });
      setDebts((d) => d.filter((x) => x.id !== id));
    } catch (err) {
      console.error("Erreur mise à jour statut :", err);
    } finally {
      setUpdatingId(null);
    }
  };

  // Exécution de la suppression après confirmation
  const handleDeleteConfirm = async () => {
    if (!confirmDeleteId) return;
    const id = confirmDeleteId;
    setConfirmDeleteId(null);
    setUpdatingId(id);
    try {
      await api.delete(`/api/sales/${id}`);
      setDebts((d) => d.filter((x) => x.id !== id));
    } catch (err) {
      console.error("Erreur de suppression :", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const totalDebt = debts.reduce(
    (sum, d) => sum + Number(d.total_amount || d.total || d.totalAmount || 0),
    0
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 relative">
      <h1 className="flex items-center gap-2 text-2xl font-black text-navy-900">
        <DebtIcon className="text-red-500" />
        الديون
      </h1>
      <p className="mt-1 text-sm text-gray-500">قائمة الزبائن الذين لم يدفعوا بعد</p>

      {!loading && debts.length > 0 && (
        <div className="mt-4 flex items-center justify-between rounded-xl bg-red-50 px-4 py-3">
          <span className="text-sm font-medium text-red-700">إجمالي الديون</span>
          <span className="text-xl font-bold text-red-700">
            MRU {(totalDebt || 0).toFixed(2)}
          </span>
        </div>
      )}

      <div className="mt-4 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        {loading ? (
          <p className="p-6 text-center text-sm text-gray-500">جاري التحميل...</p>
        ) : debts.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-teal-500">
              <CheckIcon />
            </span>
            <p className="font-bold text-navy-900">لا توجد ديون حالياً</p>
            <p className="mt-1 text-sm text-gray-500">جميع الزبائن دفعوا مستحقاتهم</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {debts.map((d) => (
              <div key={d.id} className="p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-navy-900">{d.customerName || d.customer_name || "زبون"}</p>
                  <p dir="ltr" className="text-right text-xs text-gray-400">
                    {new Date(d.createdAt || d.created_at || d.date).toLocaleDateString("fr-FR")}
                  </p>
                  {(d.items || d.quantities) && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5 text-xs text-gray-500">
                      {Array.isArray(d.items)
                        ? d.items.map((it, idx) => (
                          <span key={idx} className="rounded-full bg-gray-100 px-2 py-0.5">
                            {it.bottleType}: {it.quantity}
                          </span>
                        ))
                        : typeof d.quantities === "object" &&
                        Object.entries(d.quantities).map(([key, val]) =>
                          val > 0 ? (
                            <span key={key} className="rounded-full bg-gray-100 px-2 py-0.5">
                              {key.toUpperCase()}: {val}
                            </span>
                          ) : null
                        )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <p className="font-bold text-red-600">
                    MRU {Number(d.total_amount || d.total || d.totalAmount || 0).toFixed(2)}
                  </p>

                  <button
                    onClick={() => markPaid(d.id)}
                    disabled={updatingId === d.id}
                    className="flex items-center gap-1 rounded-lg bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-600 hover:bg-teal-100 transition-colors"
                  >
                    <CheckIcon className="h-4 w-4" />
                    تحديد كمدفوع
                  </button>

                  <button
                    onClick={() => setConfirmDeleteId(d.id)}
                    disabled={updatingId === d.id}
                    className="flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors"
                    title="حذف"
                  >
                    <TrashIcon className="h-4 w-4" />
                    حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pop-up Modale de confirmation centrée */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl text-center border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-2">تأكيد الحذف</h3>
            <p className="text-sm text-gray-600 mb-6">هل تريد حذف هذه العملية نهائياً؟</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={handleDeleteConfirm}
                className="w-1/2 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-700 transition-colors shadow-sm"
              >
                نعم
              </button>
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="w-1/2 rounded-xl bg-gray-100 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-200 transition-colors"
              >
                لا
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}