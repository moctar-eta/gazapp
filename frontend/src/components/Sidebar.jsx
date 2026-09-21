import { NavLink } from "react-router-dom";
import Logo from "./Logo";
import { PlusIcon, HistoryIcon, DiscountIcon, DebtIcon, SettingsIcon } from "./icons";

const navItems = [
  { to: "/historique", label: "السجل", icon: HistoryIcon },
  { to: "/reduction", label: "التخفيض", icon: DiscountIcon },
  { to: "/dettes", label: "الديون", icon: DebtIcon },
  { to: "/parametres", label: "الإعدادات", icon: SettingsIcon },
];

export default function Sidebar() {
  return (
    <aside className="fixed inset-y-0 right-0 z-20 hidden w-20 flex-col items-center gap-6 bg-navy-900 py-5 sm:flex">
      <div className="flex w-14 items-center justify-center rounded-xl bg-white p-1">
        <Logo width={52} />
      </div>

      <NavLink
        to="/"
        end
        className={({ isActive }) =>
          `flex h-11 w-11 items-center justify-center rounded-xl transition-colors ${
            isActive ? "bg-teal-accent text-navy-900" : "bg-teal-accent/90 text-navy-900 hover:bg-teal-accent"
          }`
        }
        title="عملية توزيع جديدة"
      >
        <PlusIcon />
      </NavLink>

      <nav className="flex flex-col items-center gap-3">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            title={label}
            className={({ isActive }) =>
              `flex h-11 w-11 items-center justify-center rounded-xl transition-colors ${
                isActive ? "bg-navy-700 text-teal-accent" : "text-slate-400 hover:bg-navy-800 hover:text-white"
              }`
            }
          >
            <Icon />
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
