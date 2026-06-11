import { Link, useLocation } from 'react-router-dom';
import { 
  Building2, 
  LayoutDashboard, 
  ShieldAlert, 
  Activity, 
  FileCheck2, 
  Users, 
  Settings, 
  HelpCircle,
  Plus,
  Search,
  Bell,
  UserCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  const navItems = [
    { name: 'Executive Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Risk Registry', path: '/admin/risk', icon: ShieldAlert },
    { name: 'AI Deep Dive', path: '/admin/ai-deep-dive', icon: Activity },
    { name: 'Loan Approvals', path: '/admin/operations', icon: FileCheck2 },
    { name: 'Beneficiary Portal', path: '/dashboard', icon: Users },
  ];

  return (
    <div className="flex h-screen w-full bg-[#0b0e14] text-slate-300 font-sans overflow-hidden dark">
      
      {/* Sidebar */}
      <aside className="w-64 flex flex-col border-r border-slate-800 bg-[#0e1219] shrink-0">
        
        {/* Brand */}
        <div className="flex items-center gap-3 px-6 py-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-900 border border-slate-700 shadow-inner">
            <Building2 className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-100 leading-tight">MSJE Lending</h1>
            <p className="text-[11px] text-slate-500">Ministry of Social Justice</p>
          </div>
        </div>

        {/* CTA */}
        <div className="px-4 mb-6 mt-2">
          <Button variant="outline" className="w-full justify-start gap-2 border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl h-10">
            <Plus className="h-4 w-4 text-blue-400" /> New Loan Application
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
            return (
              <Link 
                key={item.name} 
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-slate-800/80 border border-slate-700/50 text-slate-200' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                }`}
              >
                <item.icon className={`h-4 w-4 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="px-3 pb-6 pt-4 border-t border-slate-800/50 space-y-1">
          <Link to="/dashboard/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/30 transition-colors">
            <Settings className="h-4 w-4 text-slate-500" /> Settings
          </Link>
          <Link to="/contact" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/30 transition-colors">
            <HelpCircle className="h-4 w-4 text-slate-500" /> Support
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Navbar */}
        <header className="h-16 shrink-0 border-b border-slate-800 bg-[#0b0e14] flex items-center justify-between px-8">
          <h2 className="text-lg font-semibold text-slate-100">Direct Digital Lending</h2>
          
          <div className="flex items-center gap-6">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search beneficiaries..." 
                className="h-9 w-64 rounded-full bg-[#131823] border border-slate-800 px-9 text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-slate-700 focus:border-slate-600 transition-all"
              />
            </div>
            
            <div className="flex items-center gap-4">
              <button className="text-slate-500 hover:text-slate-300 transition-colors">
                <Bell className="h-5 w-5" />
              </button>
              <button className="text-slate-500 hover:text-slate-300 transition-colors">
                <HelpCircle className="h-5 w-5" />
              </button>
              <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center text-xs font-medium text-blue-400">
                AD
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto p-8 bg-[#0b0e14]">
          {children}
        </main>
      </div>

    </div>
  );
}
