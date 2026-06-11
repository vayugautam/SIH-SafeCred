import { Outlet, NavLink } from 'react-router-dom';
import { Bell, UserCircle, LayoutDashboard, Users, FileText, Activity, Map, PieChart, UploadCloud, ShieldAlert } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function AdminLayout() {
  const { user, logout } = useAuthStore();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Risk Map', path: '/map', icon: Map },
    { name: 'Analytics Hub', path: '/analytics', icon: PieChart },
    { name: 'Beneficiaries', path: '/beneficiaries', icon: Users },
    { name: 'Score Explorer', path: '/score-explorer', icon: Activity },
    { name: 'Lending Queue', path: '/lending', icon: FileText },
    { name: 'Data Upload', path: '/data-upload', icon: UploadCloud },
    { name: 'System Admin', path: '/admin', icon: ShieldAlert },
    { name: 'Audit Logs', path: '/audit', icon: Activity },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-[260px] bg-gradient-premium flex flex-col transition-all duration-300 shadow-xl z-20">
        <div className="h-[72px] flex items-center justify-center border-b border-slate-700/50 bg-black/10">
          <span className="font-extrabold text-2xl tracking-widest text-gradient">SafeCred</span>
        </div>
        <nav className="flex-1 overflow-y-auto py-6 px-3 custom-scrollbar">
          <ul className="space-y-1.5">
            {navItems.map((item) => (
              <li key={item.name}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-[#D97706]/20 to-transparent text-[#F59E0B] shadow-[inset_4px_0_0_0_#F59E0B]'
                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                    }`
                  }
                >
                  <item.icon className={`w-5 h-5 mr-3 transition-colors ${location.pathname.includes(item.path) ? 'text-[#F59E0B]' : 'text-slate-400'}`} />
                  {item.name}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        {/* User Card at bottom of sidebar */}
        <div className="p-4 border-t border-slate-700/50 bg-black/10">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition" onClick={logout}>
            <div className="bg-gradient-to-br from-[#D97706] to-[#B45309] rounded-full p-2">
              <UserCircle className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-200 text-sm truncate">{user?.username || 'Admin User'}</p>
              <p className="text-slate-400 text-xs truncate">Sign Out</p>
            </div>
          </div>
        </div>
      </aside>

      {/* RIGHT CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        
        {/* TOP NAV BAR */}
        <header className="h-[72px] glass flex items-center justify-between px-8 shrink-0 z-10 sticky top-0">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Admin Portal</h1>
          </div>
          <div className="flex items-center space-x-6">
            <button className="relative p-2 text-slate-400 hover:text-slate-600 transition bg-slate-100/50 rounded-full hover:bg-slate-200">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-px bg-slate-200"></div>
            <div className="flex items-center gap-2">
               <img src={`https://ui-avatars.com/api/?name=${user?.username || 'Admin'}&background=0D8ABC&color=fff&rounded=true`} alt="Avatar" className="w-8 h-8" />
            </div>
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main className="flex-1 overflow-auto p-8 relative">
          {/* Subtle background decoration */}
          <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none -z-10"></div>
          
          <div className="max-w-[1400px] mx-auto">
            <Outlet />
          </div>
        </main>

      </div>
    </div>
  );
}
