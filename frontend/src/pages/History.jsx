import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import Footer from "../components/Footer";
import { SearchIcon, DownloadIcon, CalendarIcon, TrashIcon } from "../components/icons";

const PAGE_SIZE = 8;

export default function History() {
  const [sales, setSales] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [page, setPage] = useState(1);

  const load = useCallback(async (q) => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/sales", { params: q ? { search: q } : {} });
      setSales(data);
      setPage(1);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load("");
  }, [load]);

  useEffect(() => {
    const t = setTimeout(() => load(search), 300);
    return () => clearTimeout(t);
  }, [search, load]);

  const remove = async (id) => {
    if (!window.confirm("هل تريد حذف هذه العملية نهائياً؟")) return;
    setDeletingId(id);
    try {
      await api.delete(`/api/sales/${id}`);
      setSales((s) => s.filter((sale) => sale.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(sales.length / PAGE_SIZE));
  const pageSales = sales.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const initial = (name) => (name?.trim()?.[0] || "؟").toUpperCase();

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-navy-900">سجل المعاملات</h1>
          <p className="mt-1 text-sm text-gray-500">تتبع وإدارة جميع عمليات البيع السابقة بدقة.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/"
            className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800"
          >
            + عملية توزيع جديدة
          </Link>
          <button className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
            <CalendarIcon />
            تصفية بالتاريخ
          </button>
        </div>
      </div>

      <div className="relative mt-4 max-w-md">
        <SearchIcon className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="...البحث باسم المشتري"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-white py-2 pr-10 pl-3 text-sm focus:border-teal-accent focus:outline-none"
        />
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        {loading ? (
          <p className="p-6 text-center text-gray-500">...جارٍ التحميل</p>
        ) : sales.length === 0 ? (
          <p className="p-6 text-center text-gray-500">لا توجد عمليات بيع مطابقة.</p>
        ) : (
          <>
            {/* Cartes compactes (mobile) */}
            <div className="divide-y divide-gray-50 sm:hidden">
              {pageSales.map((sale) => (
                <div key={sale.id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-navy-900">
                        {initial(sale.buyerName)}
                      </span>
                      <div>
                        <p className="font-semibold text-navy-900">{sale.buyerName}</p>
                        <p dir="ltr" className="text-right text-xs text-gray-400">
                          {new Date(sale.createdAt).toLocaleDateString("fr-FR", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    <p className="font-bold text-navy-900">MRU {Number(sale.total).toLocaleString("en-US")}</p>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {sale.items.map((it) => (
                      <span
                        key={it.id}
                        className="rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-700"
                      >
                        {it.bottleType}: {it.quantity}
                      </span>
                    ))}
                  </div>

                  <div className="mt-3 flex items-center gap-4 text-sm">
                    <Link to={`/facture/vente/${sale.id}`} className="flex items-center gap-1 font-medium text-navy-900">
                      <DownloadIcon width="15" height="15" />
                      عرض الفاتورة
                    </Link>
                    <button
                      onClick={() => remove(sale.id)}
                      disabled={deletingId === sale.id}
                      className="flex items-center gap-1 font-medium text-red-600 disabled:opacity-50"
                    >
                      <TrashIcon width="15" height="15" />
                      حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Tableau (desktop) */}
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-500">
                    <th className="px-5 py-3 text-right font-medium">التاريخ</th>
                    <th className="px-5 py-3 text-right font-medium">اسم المشتري</th>
                    <th className="px-5 py-3 text-center font-medium">الكمية (أسطوانات)</th>
                    <th className="px-5 py-3 text-center font-medium">المبلغ الإجمالي</th>
                    <th className="px-5 py-3 text-center font-medium">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {pageSales.map((sale) => {
                    return (
                      <tr key={sale.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60">
                        <td dir="ltr" className="px-5 py-4 text-right text-gray-500">
                          {new Date(sale.createdAt).toLocaleDateString("fr-FR", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                          })}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-navy-900">
                              {initial(sale.buyerName)}
                            </span>
                            <div>
                              <p className="font-semibold text-navy-900">{sale.buyerName}</p>
                              {sale.buyerPhone && (
                                <p dir="ltr" className="text-left text-xs text-gray-400">
                                  {sale.buyerPhone}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap items-center justify-center gap-1.5">
                            {sale.items.map((it) => (
                              <span
                                key={it.id}
                                className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700"
                              >
                                {it.bottleType}: {it.quantity}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-center font-bold text-navy-900">
                          MRU {Number(sale.total).toLocaleString("en-US")}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-center gap-3">
                            <Link
                              to={`/facture/vente/${sale.id}`}
                              title="عرض الفاتورة"
                              className="text-gray-400 hover:text-navy-900"
                            >
                              <DownloadIcon />
                            </Link>
                            <button
                              onClick={() => remove(sale.id)}
                              disabled={deletingId === sale.id}
                              title="حذف"
                              className="text-gray-400 hover:text-red-600 disabled:opacity-50"
                            >
                              <TrashIcon />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-5 py-3 text-sm">
              <span className="text-gray-500">
                عرض {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, sales.length)} من أصل {sales.length} معاملة
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg px-2 py-1 text-gray-400 hover:bg-gray-100 disabled:opacity-40"
                >
                  ‹
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`h-7 w-7 rounded-lg text-xs font-medium ${
                      n === page ? "bg-navy-900 text-white" : "text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-lg px-2 py-1 text-gray-400 hover:bg-gray-100 disabled:opacity-40"
                >
                  ›
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
