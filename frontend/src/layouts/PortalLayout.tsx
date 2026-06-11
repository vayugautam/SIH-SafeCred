import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { HelpCircle, Phone, MessageCircle, X, Home, TrendingUp, FilePlus } from 'lucide-react';

export default function PortalLayout() {
  const [showHelp, setShowHelp] = useState(false);
  const location = useLocation();

  const isRouteActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center font-sans">
      
      {/* MOBILE & DESKTOP CONTAINER */}
      <div className="w-full max-w-5xl bg-white min-h-screen relative flex flex-col shadow-2xl overflow-x-hidden border-x border-slate-200">
        
        {/* Render child pages */}
        <div className="flex-1 pb-20">
          <Outlet />
        </div>

        {/* BOTTOM NAVIGATION BAR */}
        <div className="fixed bottom-0 w-full max-w-5xl bg-white border-t border-slate-200 px-6 py-3 flex justify-around sm:justify-center sm:gap-16 items-center pb-safe shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] z-30">
          <Link 
            to="/portal/dashboard" 
            className={`flex flex-col items-center gap-1 ${isRouteActive('/portal/dashboard') ? 'text-[#0D9488]' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Home className={`w-6 h-6 ${isRouteActive('/portal/dashboard') ? 'fill-[#0D9488]/20' : ''}`} />
            <span className="text-[10px] font-bold">Home</span>
          </Link>
          
          <Link 
            to="/portal/my-score" 
            className={`flex flex-col items-center gap-1 ${isRouteActive('/portal/my-score') ? 'text-[#0D9488]' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <TrendingUp className="w-6 h-6" />
            <span className="text-[10px] font-bold">My Score</span>
          </Link>
          
          <Link 
            to="/portal/apply-loan" 
            className={`flex flex-col items-center gap-1 ${isRouteActive('/portal/apply-loan') ? 'text-[#0D9488]' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <FilePlus className="w-6 h-6" />
            <span className="text-[10px] font-bold">Apply</span>
          </Link>
        </div>

        {/* FIXED FLOATING ACTION BUTTON (FAB) - MOVED UP SLIGHTLY */}
        <button 
          onClick={() => setShowHelp(true)}
          className="fixed bottom-20 right-6 lg:absolute lg:bottom-20 lg:right-6 bg-[#D97706] text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:bg-orange-700 transition z-40 active:scale-95"
        >
          <HelpCircle className="w-6 h-6" />
        </button>

        {/* HELP BOTTOM SHEET */}
        {showHelp && (
          <div className="absolute inset-0 z-50 flex flex-col justify-end">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setShowHelp(false)}></div>
            
            <div className="bg-white w-full rounded-t-3xl p-6 relative z-10 animate-in slide-in-from-bottom-full duration-300 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800">Need Help?</h3>
                <button onClick={() => setShowHelp(false)} className="bg-slate-100 p-2 rounded-full text-slate-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4 pb-6">
                <button className="w-full flex items-center p-4 rounded-2xl bg-green-50 border border-green-200 active:bg-green-100 transition">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mr-4 shadow-sm">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-slate-800 text-lg">WhatsApp Chat</p>
                    <p className="text-sm text-green-700 font-medium">Fastest response</p>
                  </div>
                </button>

                <button className="w-full flex items-center p-4 rounded-2xl bg-blue-50 border border-blue-200 active:bg-blue-100 transition">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mr-4 shadow-sm">
                    <Phone className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-slate-800 text-lg">Call Helpline</p>
                    <p className="text-sm text-blue-700 font-medium">1800-123-4567</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
