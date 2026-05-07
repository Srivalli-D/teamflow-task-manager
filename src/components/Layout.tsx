import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, FolderKanban, LogOut, Menu, X, User } from 'lucide-react';
import { useState } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const SidebarItem = ({ to, icon: Icon, label, active }: { to: string, icon: any, label: string, active: boolean }) => (
  <Link
    to={to}
    className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
      active ? "bg-white/10 text-white" : "text-neutral-400 hover:text-white hover:bg-white/5"
    )}
  >
    <Icon className="w-5 h-5" />
    <span className="font-medium">{label}</span>
  </Link>
);

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-neutral-700">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 flex-col border-r border-neutral-800 bg-neutral-900/50 backdrop-blur-xl">
        <div className="p-6">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center transition-transform group-hover:scale-105">
              <FolderKanban className="w-5 h-5 text-neutral-900" />
            </div>
            <span className="text-xl font-bold tracking-tight">TeamFlow</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <SidebarItem to="/" icon={LayoutDashboard} label="Dashboard" active={location.pathname === '/'} />
          <SidebarItem to="/projects" icon={FolderKanban} label="Projects" active={location.pathname.startsWith('/projects')} />
        </nav>

        <div className="p-4 mt-auto">
          <div className="bg-neutral-800/50 p-4 rounded-xl mb-4 border border-neutral-700/50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center">
                <User className="w-4 h-4 text-neutral-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{user?.name}</p>
                <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold bg-neutral-700 hover:bg-neutral-600 rounded-lg transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Menu Trigger */}
      <button
        className="md:hidden fixed top-4 right-4 z-50 p-2 bg-neutral-800 rounded-lg"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="h-16 border-b border-neutral-800 bg-neutral-900/10 backdrop-blur-md sticky top-0 z-40 flex items-center px-8">
           <h1 className="text-lg font-semibold text-neutral-400 capitalize">
             {location.pathname === '/' ? 'Overview' : location.pathname.split('/')[1]}
           </h1>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
