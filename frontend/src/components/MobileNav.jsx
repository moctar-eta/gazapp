import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ConfirmModal from "./ConfirmModal";
import { PlusIcon, HistoryIcon, DiscountIcon, DebtIcon, SettingsIcon, LogoutIcon } from "./icons";

const items = [
  { to: "/historique", label: "السجل", icon: HistoryIcon },
  { to: "/reduction", label: "التخفيض", icon: DiscountIcon },
  { to: "/", label: "توزيع جديد", icon: PlusIcon, end: true, primary: true },
  { to: "/dettes", label: "الديون", icon: DebtIcon },
  { to: "/parametres", label: "الإعدادات", icon: SettingsIcon },
];

export default function MobileNav() {
  const { logout } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-around border-t border-navy-800 bg-navy-900 py-2 sm:hidden">
      {items.map(({ to, label, icon: Icon, end, primary }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 rounded-lg px-4 py-1.5 text-[11px] ${
              primary
                ? "text-navy-900"
                : isActive
                ? "text-teal-accent"
                : "text-slate-400"
            }`
          }
        >
          {({ isActive }) =>
            primary ? (
              <>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-accent">
                  <Icon className="text-navy-900" />
                </span>
                <span className="text-slate-300">{label}</span>
              </>
            ) : (
              <>
                <Icon className={isActive ? "text-teal-accent" : "text-slate-400"} />
                <span>{label}</span>
              </>
            )
          }
        </NavLink>
      ))}
      <button
        onClick={() => setConfirmOpen(true)}
        className="flex flex-col items-center gap-1 rounded-lg px-4 py-1.5 text-[11px] text-slate-400"
      >
        <LogoutIcon />
        <span>خروج</span>
      </button>

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
    </nav>
  );
}
