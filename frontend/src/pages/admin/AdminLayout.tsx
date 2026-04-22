import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  List,
  PlusCircle,
  Cpu,
  ChevronLeft,
  Users,
  LogOut,
  ShieldCheck,
  PenLine,
  Eye,
  Upload,
  Sun,
  Moon,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";

const ROLE_BADGE: Record<string, { label: string; icon: typeof Eye; color: string }> = {
  admin: { label: "Admin", icon: ShieldCheck, color: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10" },
  contributor: { label: "Contributor", icon: PenLine, color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10" },
  viewer: { label: "Viewer", icon: Eye, color: "text-gray-600 dark:text-slate-400 bg-gray-100 dark:bg-slate-800" },
};

export default function AdminLayout() {
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggle } = useTheme();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const badge = ROLE_BADGE[user?.role ?? "viewer"];
  const BadgeIcon = badge.icon;

  const navItems = [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true, show: true },
    { to: "/admin/questions", label: "Questions", icon: List, end: false, show: true },
    { to: "/admin/questions/new", label: "Add Question", icon: PlusCircle, end: true, show: true },
    { to: "/admin/users", label: "Users", icon: Users, end: true, show: isAdmin },
    { to: "/admin/import", label: "Import", icon: Upload, end: true, show: isAdmin },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="px-4 py-5 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Cpu className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-xs font-bold text-gray-900 dark:text-white">CS231</div>
              <div className="text-xs text-gray-400 dark:text-slate-500">Admin Panel</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navItems
            .filter((item) => item.show)
            .map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400"
                      : "text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white"
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                {label}
              </NavLink>
            ))}
        </nav>

        {/* User info + actions */}
        <div className="px-2 py-4 border-t border-gray-100 dark:border-slate-800 space-y-1">
          {/* Role badge */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold ${badge.color}`}>
            <BadgeIcon className="w-3.5 h-3.5" />
            <span className="truncate">{user?.username}</span>
            <span className="ml-auto opacity-70">{badge.label}</span>
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggle}
            className="flex items-center gap-2 px-3 py-2 w-full rounded-lg text-sm text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-700 dark:hover:text-white transition-colors"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>

          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 px-3 py-2 w-full rounded-lg text-sm text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-700 dark:hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Exam
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 w-full rounded-lg text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-700 dark:hover:text-red-300 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
