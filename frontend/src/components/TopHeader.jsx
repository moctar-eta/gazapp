import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import Logo from "./Logo";
import ConfirmModal from "./ConfirmModal";
import { HelpIcon, ChevronDownIcon, LogoutIcon, UserIcon } from "./icons";

export default function TopHeader() {
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <header className="sticky top-0 z-10 flex items-center gap-4 border-b border-gray-200 bg-white px-4 py-3 sm:px-6">
      <div className="flex shrink-0 items-center gap-2">
        <Logo width={40} className="rounded-lg" />
        <span className="text-lg font-black text-navy-900">بزيد لتوزيع الغاز</span>
      </div>
      <div className="flex-1" />

      <div className="flex shrink-0 items-center gap-3">
        <button className="hidden h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 sm:flex">
          <HelpIcon />
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-gray-100"
          >
            <ChevronDownIcon className="hidden text-gray-400 sm:block" />
            <span className="hidden max-w-[120px] truncate text-sm font-medium text-gray-700 sm:block">
              بزيد
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-gray-500">
              <UserIcon width="16" height="16" />
            </span>
          </button>
          {menuOpen && (
            <div className="absolute left-0 top-11 z-20 w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setConfirmOpen(true);
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <LogoutIcon />
                تسجيل الخروج
              </button>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="تسجيل الخروج"
        message="هل تريد فعلاً تسجيل الخروج من التطبيق؟"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          logout();
        }}
      />
    </header>
  );
}
