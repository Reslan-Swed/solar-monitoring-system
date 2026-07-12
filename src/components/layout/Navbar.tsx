import React, { useState, useRef, useEffect } from 'react';
import { Search, User as UserIcon, Bell, AlertCircle, AlertTriangle, Info, X, Calendar, Menu } from 'lucide-react';
import { EventLogItem } from '@/src/api-types';
import { User } from '@/src/types';
import { cn } from '@/src/lib/utils';

interface NavbarProps {
  user: User;
  title: string;
  latestAlert?: EventLogItem | null;
  onMenuClick: () => void;
  isSidebarCollapsed: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ user, title, latestAlert, onMenuClick, isSidebarCollapsed }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getEventIcon = (type: number) => {
    switch (type) {
      case 1: return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 2: return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 3: return <Info className="w-5 h-5 text-blue-500" />;
      default: return <Bell className="w-5 h-5 text-slate-400" />;
    }
  };

  const getEventTypeStyles = (type: number) => {
    switch (type) {
      case 1: return 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-900/30';
      case 2: return 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/30';
      case 3: return 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-900/30';
      default: return 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-100 dark:border-slate-700';
    }
  };

  return (
    <header className={cn(
      "h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-4 sm:px-8 fixed top-0 right-0 z-40 transition-all duration-300",
      isSidebarCollapsed ? "left-0 lg:left-20" : "left-0 lg:left-64"
    )}>
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white capitalize truncate max-w-[150px] sm:max-w-none">{title}</h1>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search devices, reports..."
            className="pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all dark:text-white dark:placeholder-slate-500"
          />
        </div>

        <div className="flex items-center gap-4 border-l border-slate-200 dark:border-slate-800 pl-6 relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="relative group flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-700"
          >
            <div className="relative">
              <Bell className={cn("w-5 h-5 transition-colors", latestAlert ? "text-amber-500" : "text-slate-500 dark:text-slate-400")} />
              {latestAlert && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 animate-bounce"></span>
              )}
            </div>
            {latestAlert && (
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 hidden lg:block max-w-[150px] truncate">
                {latestAlert.eventInfo}
              </span>
            )}
          </button>

          {showDropdown && (
            <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-4 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-indigo-500" />
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">Active Alerts</h3>
                </div>
                <button onClick={() => setShowDropdown(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="max-h-[400px] overflow-y-auto p-2">
                {latestAlert ? (
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer group">
                    <div className="flex gap-3">
                      <div className="mt-1">
                        {getEventIcon(latestAlert.eventType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold border",
                            getEventTypeStyles(latestAlert.eventType)
                          )}>
                            {latestAlert.eventType === 1 ? 'FAULT' : latestAlert.eventType === 2 ? 'WARNING' : 'INFO'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">ACTIVE</span>
                        </div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white break-words">
                          {latestAlert.eventInfo || 'System Event'}
                        </p>
                        <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-500 dark:text-slate-400">
                          <Calendar className="w-3 h-3" />
                          {latestAlert.occurrenceTime}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Bell className="w-6 h-6 text-slate-200 dark:text-slate-700" />
                    </div>
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">No Active Alerts</p>
                  </div>
                )}
              </div>
              
              <div className="p-3 border-t border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30 text-center">
                <button 
                  onClick={() => setShowDropdown(false)}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                >
                  Close Panel
                </button>
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors">{user.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-none">Administrator</p>
            </div>
            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700 group-hover:border-amber-200 dark:group-hover:border-amber-900 transition-all">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-5 h-5 text-slate-400 dark:text-slate-500" />
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
