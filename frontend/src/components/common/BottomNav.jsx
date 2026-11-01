import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Camera, FolderLock, History, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function BottomNav() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated && location.pathname === '/') {
    return null;
  }

  const links = [
    { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { to: '/vault', label: 'Documents', icon: FolderLock },
    { to: '/forms/upload', label: 'Upload', icon: Camera, primary: true },
    { to: '/history', label: 'History', icon: History },
    { to: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#070B14]/95 backdrop-blur-xl border-t border-[#1E2D4A] px-2 py-1.5 shadow-2xl pb-safe">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {links.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);

          if (item.primary) {
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className="flex flex-col items-center -mt-5 relative group"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-violet-600 to-cyan-400 p-[2px] shadow-lg shadow-cyan-500/25">
                  <div className="w-full h-full rounded-full bg-[#0B0F19] flex items-center justify-center text-cyan-300 group-hover:scale-105 transition-transform">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <span className="text-[10px] font-bold text-cyan-300 mt-1 tracking-tight">
                  {item.label}
                </span>
              </NavLink>
            );
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-cyan-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110 text-cyan-400' : ''}`} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-cyan-400" />
                )}
              </div>
              <span className={`text-[10px] mt-1 ${isActive ? 'text-cyan-300 font-medium' : 'text-slate-400'}`}>
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
