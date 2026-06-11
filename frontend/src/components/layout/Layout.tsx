import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export const Layout: React.FC = () => {
  return (
    <div className="flex h-screen w-screen bg-background text-foreground overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-y-auto bg-muted/20">
        <header className="h-16 border-b bg-card flex items-center px-6 shadow-sm z-10 backdrop-blur-md bg-opacity-80">
           <h2 className="text-lg font-semibold font-outfit">Portal</h2>
           <div className="ml-auto flex items-center space-x-4">
               {/* User Avatar, Theme Toggle etc. would go here */}
               <div className="h-8 w-8 rounded-full bg-secondary border"></div>
           </div>
        </header>
        <div className="flex-1 p-6">
            <Outlet />
        </div>
      </main>
    </div>
  );
};
