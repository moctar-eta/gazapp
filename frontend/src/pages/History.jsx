import { useEffect, useState } from "react";
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

  // Charger les données depuis l'API
  const fetchSales = async (searchQuery = "") => {
    setLoading(true);
    try {
      const response = await api.get("/api/sales", {
        params: searchQuery ? { search: searchQuery } : {}
      });
      setSales(Array.isArray(response.data) ? response.data : response.data.sales || []);
      setPage(1);
    } catch (error) {
      console.error("Erreur lors du chargement des ventes :", error);
    } finally {
      setLoading(false);
    }
  };

  // Chargement au montage et à la recherche
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSales(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // Supprimer une vente
  const remove = async (id) => {
    if (!window.confirm("هل تريد حذف هذه العملية نهائياً؟")) return;
    setDeletingId(id);
    try {
      await api.delete(`/api/sales/${id}`);
      setSales((s) => s.filter((sale) => sale.id !== id));
    } catch (error) {
      console.error("Erreur de suppression :", error);
    } finally {
      setDeletingId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(sales.length / PAGE_SIZE));
  const pageSales = sales.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const formatDate = (d) =>
    new Date(d).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-500">
        جاري التحميل...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">سجل المبيعات</h1>
        <input
          type="text"
          placeholder="بحث..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-2 rounded-lg w-full sm:w-64"
        />
      </div>

      {pageSales.length === 0 ? (
        <div className="text-center py-10 text-gray-500">لا توجد عمليات مبيعات حتى الآن</div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="p-3">التاريخ</th>
                <th className="p-3">المشتري</th>
                <th className="p-3">B3</th>
                <th className="p-3">B6</th>
                <th className="p-3">B12</th>
                <th className="p-3">المبلغ الإجمالي</th>
                <th className="p-3 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {pageSales.map((item) => (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{formatDate(item.createdAt || item.date)}</td>
                  <td className="p-3">{item.customerName || "—"}</td>
                  <td className="p-3">{item.quantities?.b3 ?? 0}</td>
                  <td className="p-3">{item.quantities?.b6 ?? 0}</td>
                  <td className="p-3">{item.quantities?.b12 ?? 0}</td>
                  <td className="p-3 font-semibold">{item.totalAmount} MRU</td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => remove(item.id)}
                      disabled={deletingId === item.id}
                      className="text-red-600 hover:text-red-800"
                    >
                      حذف
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}