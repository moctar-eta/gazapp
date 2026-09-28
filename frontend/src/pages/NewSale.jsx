import React, { useState, useEffect } from "react";
import api from "../api/client";
import { useNavigate } from "react-router-dom";

export default function NewSale() {
  const navigate = useNavigate();
  const [prices, setPrices] = useState({ b3: 0, b6: 0, b12: 0 });
  const [quantities, setQuantities] = useState({ b3: 0, b6: 0, b12: 0 });
  const [paymentStatus, setPaymentStatus] = useState("paid");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [customerName, setCustomerName] = useState("");

  // Récupération des prix sauvegardés dans la BDD au chargement de la page
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get("/api/settings");
        const data = res.data;
        const currentPrices = data.prices || {};

        setPrices({
          b3: Number(currentPrices.b3 ?? data.price_b3 ?? 0),
          b6: Number(currentPrices.b6 ?? data.price_b6 ?? 0),
          b12: Number(currentPrices.b12 ?? data.price_b12 ?? 0),
        });
      } catch (err) {
        console.error("Erreur lors de la récupération des prix :", err);
      }
    };

    fetchSettings();
  }, []);

  const handleQtyChange = (type, val) => {
    const qty = Math.max(0, parseInt(val) || 0);
    setQuantities((prev) => ({ ...prev, [type]: qty }));
  };

  // Calculs dynamiques
  const totalB3 = quantities.b3 * prices.b3;
  const totalB6 = quantities.b6 * prices.b6;
  const totalB12 = quantities.b12 * prices.b12;
  const grandTotal = totalB3 + totalB6 + totalB12;

  const handleSaveSale = async () => {
    if (!customerName.trim()) {
      setMessage("الرجاء إدخال اسم المشتري");
      setTimeout(() => setMessage(""), 3000); // Optionnel : efface l'erreur aussi après 3s
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      await api.post("/api/sales", {
        quantities,
        prices,
        totalAmount: grandTotal,
        paymentStatus,
        customerName,
      });

      // ICI : Affiche le message de succès puis le masque après 3 secondes
      setMessage("تم حفظ المبيعات بنجاح");
      setTimeout(() => {
        setMessage("");
      }, 3000);

      // Réinitialisation du formulaire
      setQuantities({ b3: 0, b6: 0, b12: 0 });
      setCustomerName("");
    } catch (err) {
      console.error("Erreur lors de la sauvegarde :", err);
      setMessage("حدث خطأ أثناء حفظ المبيعات");
      setTimeout(() => {
        setMessage("");
      }, 3000);
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto dir-rtl text-right grid grid-cols-1 md:grid-cols-3 gap-6 relative">

      {/* Alerte flottante (Notification Toast 3s) */}
      {message && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl transition-all duration-300 animate-bounce text-sm font-bold">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          <span>{message}</span>
        </div>
      )}

      {/* Champ nom du client */}
      <div className="md:col-span-3 mb-2">
        <label className="block text-sm font-bold mb-2 text-navy-900">اسم المشتري</label>
        <input
          type="text"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="أدخل اسم المشتري..."
          className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-teal-400 bg-white shadow-sm text-sm"
        />
      </div>

      {/* Section principale : Formulaire de vente */}
      <div className="md:col-span-2 space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <h2 className="text-xl font-bold mb-4 text-navy-900">تفاصيل الطلب</h2>

          {/* Tableau avec défilement horizontal de sécurité */}
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse min-w-[280px]">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-bold text-gray-500">
                  <th className="py-2 px-1">المنتج</th>
                  <th className="py-2 px-1 text-center">السعر للوحدة</th>
                  <th className="py-2 px-1 text-center">الكمية</th>
                  <th className="py-2 px-1 text-left">الإجمالي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs sm:text-sm">

                {/* Bouteille B3 */}
                <tr>
                  <td className="py-3 px-1">
                    <p className="font-semibold text-navy-900">أسطوانة B3</p>
                    <p className="text-[10px] text-gray-400">حجم صغير</p>
                  </td>
                  <td className="py-3 px-1 text-center text-gray-600">
                    MRU {prices.b3 || 0}
                  </td>
                  <td className="py-3 px-1 text-center">
                    <input
                      type="number"
                      min="0"
                      value={quantities.b3 || 0}
                      onChange={(e) => handleQtyChange("b3", e.target.value)}
                      className="w-14 sm:w-16 rounded-lg border border-gray-200 py-1 text-center font-bold text-navy-900 focus:border-teal-500 focus:outline-none"
                    />
                  </td>
                  <td className="py-3 px-1 text-left font-bold text-teal-600 whitespace-nowrap">
                    MRU {(totalB3 || 0).toFixed(2)}
                  </td>
                </tr>

                {/* Bouteille B6 */}
                <tr>
                  <td className="py-3 px-1">
                    <p className="font-semibold text-navy-900">أسطوانة B6</p>
                    <p className="text-[10px] text-gray-400">حجم متوسط</p>
                  </td>
                  <td className="py-3 px-1 text-center text-gray-600">
                    MRU {prices.b6 || 0}
                  </td>
                  <td className="py-3 px-1 text-center">
                    <input
                      type="number"
                      min="0"
                      value={quantities.b6 || 0}
                      onChange={(e) => handleQtyChange("b6", e.target.value)}
                      className="w-14 sm:w-16 rounded-lg border border-gray-200 py-1 text-center font-bold text-navy-900 focus:border-teal-500 focus:outline-none"
                    />
                  </td>
                  <td className="py-3 px-1 text-left font-bold text-teal-600 whitespace-nowrap">
                    MRU {(totalB6 || 0).toFixed(2)}
                  </td>
                </tr>

                {/* Bouteille B12 */}
                <tr>
                  <td className="py-3 px-1">
                    <p className="font-semibold text-navy-900">أسطوانة B12</p>
                    <p className="text-[10px] text-gray-400">حجم كبير</p>
                  </td>
                  <td className="py-3 px-1 text-center text-gray-600">
                    MRU {prices.b12 || 0}
                  </td>
                  <td className="py-3 px-1 text-center">
                    <input
                      type="number"
                      min="0"
                      value={quantities.b12 || 0}
                      onChange={(e) => handleQtyChange("b12", e.target.value)}
                      className="w-14 sm:w-16 rounded-lg border border-gray-200 py-1 text-center font-bold text-navy-900 focus:border-teal-500 focus:outline-none"
                    />
                  </td>
                  <td className="py-3 px-1 text-left font-bold text-teal-600 whitespace-nowrap">
                    MRU {(totalB12 || 0).toFixed(2)}
                  </td>
                </tr>

              </tbody>
            </table>
          </div>
        </div>

        {/* Validation & Paiement */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col sm:flex-row justify-between items-center gap-4">

          {/* Sélection statut */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
            <span className="font-bold text-sm text-navy-900">الحالة :</span>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPaymentStatus("paid")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${paymentStatus === "paid"
                  ? "bg-teal-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
              >
                مدفوع
              </button>

              <button
                type="button"
                onClick={() => setPaymentStatus("unpaid")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${paymentStatus === "unpaid"
                  ? "bg-red-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
              >
                غير مدفوع
              </button>
            </div>
          </div>

          {/* Total & Bouton d'action */}
          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
            <div>
              <span className="text-xs text-gray-500 block">المجموع:</span>
              <span className="font-bold text-teal-600 text-base">
                MRU {(grandTotal || 0).toFixed(2)}
              </span>
            </div>

            <button
              type="button"
              onClick={handleSaveSale}
              disabled={saving}
              className="bg-teal-500 hover:bg-teal-600 text-white px-5 py-2 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
            >
              {saving ? "جاري الحفظ..." : "حفظ المبيعات"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}