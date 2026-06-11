import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../stores';
import { 
  LayoutDashboard, 
  Users, 
  Banknote, 
  PieChart, 
  Map, 
  FileText 
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { roles } = useAuthStore();
  
  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['OFFICER', 'MANAGER', 'ADMIN'] },
    { to: '/beneficiaries', label: 'Beneficiaries', icon: Users, roles: ['OFFICER', 'MANAGER', 'ADMIN'] },
    { to: '/lending', label: 'Lending Queue', icon: Banknote, roles: ['MANAGER', 'ADMIN'] },
    { to: '/analytics', label: 'Analytics', icon: PieChart, roles: ['ADMIN', 'MANAGER'] },
    { to: '/map', label: 'District Risk', icon: Map, roles: ['ADMIN'] },
    { to: '/audit', label: 'Audit Trail', icon: FileText, roles: ['AUDITOR', 'ADMIN'] },
  ];

  const visibleItems = navItems.filter(item => 
    roles.includes('ADMIN') || item.roles.some(r => roles.includes(r))
  );

  return (
    <div className="w-64 h-full bg-card border-r flex flex-col pt-6 px-4">
      <div className="flex items-center space-x-2 mb-10 px-2">
        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold font-sans">SC</span>
        </div>
        <h1 className="text-xl font-bold font-outfit text-foreground tracking-tight">SafeCred</h1>
      </div>
      
      <nav className="flex-1 space-y-1">
        {visibleItems.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => 
                `flex items-center space-x-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-secondary text-foreground' 
                    : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                }`
              }
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
      
      <div className="mt-auto pb-6">
          <div className="px-3 py-2 text-xs text-muted-foreground border-t pt-4">
              Logged in as <br/><span className="font-semibold text-foreground">{roles.join(', ')}</span>
          </div>
      </div>
    </div>
  );
};
