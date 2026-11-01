import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  FolderLock,
  UploadCloud,
  History,
  UserCheck,
  ShieldAlert,
  Settings as SettingsIcon
} from 'lucide-react';

export default function Sidebar() {
  const { user, isAdmin } = useAuth();

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/forms/upload', label: 'Upload Form', icon: UploadCloud },
    { to: '/vault', label: 'My Documents', icon: FolderLock },
    { to: '/history', label: 'Application History', icon: History },
    { to: '/profile', label: 'Profile', icon: UserCheck },
    { to: '/settings', label: 'Settings', icon: SettingsIcon },
  ];

  if (isAdmin) {
    navItems.push({ to: '/admin', label: 'Admin Portal', icon: ShieldAlert });
  }

  return (
    <aside className="w-60 bg-[#0A101D] border-r border-[#1E2D4A] flex flex-col justify-between p-4 shrink-0 min-h-[calc(100vh-4rem)] hidden md:flex">
      <div className="space-y-6">
        {/* User Mini Card */}
        <div className="p-3.5 rounded-xl bg-[#0D1527] border border-[#1E2D4A] flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="overflow-hidden">
            <h4 className="text-xs font-semibold text-white truncate">{user?.full_name || 'Citizen'}</h4>
            <span className="text-[10px] text-cyan-400 font-medium capitalize flex items-center gap-1">
              {user?.role === 'admin' ? 'Admin' : 'Verified'}
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-300 font-bold border border-cyan-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="p-3 rounded-xl bg-[#070B14] border border-[#1E2D4A] text-center">
        <span className="text-[11px] text-slate-400 block font-medium">FormWise AI</span>
        <span className="text-[10px] text-slate-500 block">v1.0 • Secure</span>
      </div>
    </aside>
  );
}
