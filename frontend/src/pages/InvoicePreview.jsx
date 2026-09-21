import { useNavigate, useParams } from "react-router-dom";
import { API_URL } from "../api/client";
import { ArrowBackIcon, DownloadIcon } from "../components/icons";

const ENDPOINTS = {
  vente: "sales",
  reduction: "discounts",
};

export default function InvoicePreview() {
  const { kind, id } = useParams();
  const navigate = useNavigate();
  const resource = ENDPOINTS[kind] || "sales";
  const pdfUrl = `${API_URL}/api/${resource}/${id}/pdf`;

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3">
        <button
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100"
          title="رجوع"
        >
          <ArrowBackIcon />
        </button>
        <h1 className="flex-1 text-base font-bold text-navy-900">معاينة الفاتورة</h1>
        <a
          href={`${pdfUrl}?download=1`}
          className="flex items-center gap-1.5 rounded-lg bg-navy-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-navy-800"
        >
          <DownloadIcon />
          تحميل
        </a>
      </header>
      <iframe title="الفاتورة" src={pdfUrl} className="flex-1 border-0" />
    </div>
  );
}
