import { LogoutIcon, TrashIcon } from "./icons";

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "تسجيل الخروج",
  icon = "logout",
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  const Icon = icon === "trash" ? TrashIcon : LogoutIcon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-xs rounded-2xl bg-white p-5 text-center shadow-xl">
        <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-500">
          <Icon />
        </span>
        <h2 className="font-bold text-navy-900">{title}</h2>
        {message && <p className="mt-1 text-sm text-gray-500">{message}</p>}

        <div className="mt-5 flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            إلغاء
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
