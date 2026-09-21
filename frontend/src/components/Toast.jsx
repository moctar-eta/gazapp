import { useEffect } from "react";
import { CheckIcon } from "./icons";

export default function Toast({ open, message, onClose, duration = 3000 }) {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [open, duration, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <div className="flex items-center gap-2 rounded-full bg-navy-900 py-2 pl-4 pr-3 text-sm font-medium text-white shadow-xl">
        <span>{message}</span>
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-accent text-navy-900">
          <CheckIcon width="13" height="13" strokeWidth={3} />
        </span>
      </div>
    </div>
  );
}
