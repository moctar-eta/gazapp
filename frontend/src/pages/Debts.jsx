import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import Footer from "../components/Footer";
import { DebtIcon, CheckIcon, DownloadIcon } from "../components/icons";

export default function Debts() {
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/sales", { params: { status: "NON_PAYE" } });
      setDebts(data);
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
      await api.patch(`/api/sales/${id}/status`, { status: "PAYE" });
      setDebts((d) => d.filter((x) => x.id !== id));
    } finally {
      setUpdatingId(null);
    }
  };

  const totalDebt = debts.reduce((sum, d) => sum + Number(d.total), 0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <h1 className="flex items-center gap-2 text-2xl font-black text-navy-900">
        <DebtIcon className="text-red-500" />
        الديون
      </h1>
      <p className="mt-1 text-sm text-gray-500">قائمة الزبائن الذين لم يدفعوا بعد.</p>

      {!loading && debts.length > 0 && (
        <div className="mt-4 flex items-center justify-between rounded-xl bg-red-50 px-4 py-3">
          <span className="text-sm font-medium text-red-700">إجمالي الديون</span>
          <span className="text-xl font-bold text-red-700">MRU {totalDebt.toFixed(2)}</span>
        </div>
      )}

      <div className="mt-4 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        {loading ? (
          <p className="p-6 text-center text-sm text-gray-500">...جارٍ التحميل</p>
        ) : debts.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-teal-accent">
              <CheckIcon />
            </span>
            <p className="font-bold text-navy-900">لا توجد ديون حالياً</p>
            <p className="mt-1 text-sm text-gray-500">جميع الزبائن دفعوا مستحقاتهم.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {debts.map((d) => (
              <div key={d.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-navy-900">{d.buyerName}</p>
                    <p dir="ltr" className="text-right text-xs text-gray-400">
                      {new Date(d.createdAt).toLocaleDateString("fr-FR", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                      })}
                      {d.buyerPhone ? ` · ${d.buyerPhone}` : ""}
                    </p>
                  </div>
                  <p className="font-bold text-red-600">MRU {Number(d.total).toFixed(2)}</p>
                </div>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  {d.items.map((it) => (
                    <span
                      key={it.id}
                      className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600"
                    >
                      {it.bottleType}: {it.quantity}
                    </span>
                  ))}
                </div>

                <div className="mt-3 flex items-center gap-4">
                  <Link
                    to={`/facture/vente/${d.id}`}
                    className="flex items-center gap-1 text-xs font-medium text-navy-900"
                  >
                    <DownloadIcon width="13" height="13" />
                    عرض الفاتورة
                  </Link>
                  <button
                    onClick={() => markPaid(d.id)}
                    disabled={updatingId === d.id}
                    className="flex items-center gap-1 text-xs font-medium text-teal-700 disabled:opacity-50"
                  >
                    <CheckIcon width="13" height="13" />
                    {updatingId === d.id ? "...جارٍ التحديث" : "تحديد كمدفوع"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
