import React, { useState, useRef, useEffect } from 'react';
import { Search, User as UserIcon, Bell, AlertCircle, AlertTriangle, Info, X, Calendar } from 'lucide-react';
import { EventLogItem } from '@/src/api-types';
import { User } from '@/src/types';
import { cn } from '@/src/lib/utils';

interface NavbarProps {
  user: User;
  title: string;
  latestAlert?: EventLogItem | null;
}

export const Navbar: React.FC<NavbarProps> = ({ user, title, latestAlert }) => {
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
      case 1: return 'bg-red-50 text-red-700 border-red-100';
      case 2: return 'bg-amber-50 text-amber-700 border-amber-100';
      case 3: return 'bg-blue-50 text-blue-700 border-blue-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-8 fixed top-0 right-0 left-64 z-10">
      <div className="flex flex-col">
        <h1 className="text-xl font-bold text-slate-900 capitalize">{title}</h1>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search devices, reports..."
            className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
          />
        </div>

        <div className="flex items-center gap-4 border-l border-slate-200 pl-6 relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="relative group flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-slate-50 text-slate-500 transition-all border border-transparent hover:border-slate-100"
          >
            <div className="relative">
              <Bell className={cn("w-5 h-5 transition-colors", latestAlert ? "text-amber-500" : "text-slate-500")} />
              {latestAlert && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-bounce"></span>
              )}
            </div>
            {latestAlert && (
              <span className="text-xs font-bold text-slate-700 hidden lg:block max-w-[150px] truncate">
                {latestAlert.eventInfo}
              </span>
            )}
          </button>

          {showDropdown && (
            <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-indigo-500" />
                  <h3 className="font-bold text-slate-900 text-sm">Active Alerts</h3>
                </div>
                <button onClick={() => setShowDropdown(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="max-h-[400px] overflow-y-auto p-2">
                {latestAlert ? (
                  <div className="p-3 bg-white rounded-xl border border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer group">
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
                        <p className="text-sm font-bold text-slate-900 break-words">
                          {latestAlert.eventInfo || 'System Event'}
                        </p>
                        <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-500">
                          <Calendar className="w-3 h-3" />
                          {latestAlert.occurrenceTime}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Bell className="w-6 h-6 text-slate-200" />
                    </div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">No Active Alerts</p>
                  </div>
                )}
              </div>
              
              <div className="p-3 border-t border-slate-50 bg-slate-50/30 text-center">
                <button 
                  onClick={() => setShowDropdown(false)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  Close Panel
                </button>
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-900 group-hover:text-amber-600 transition-colors">{user.name}</p>
              <p className="text-xs text-slate-500 leading-none">Administrator</p>
            </div>
            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center overflow-hidden border border-slate-200 group-hover:border-amber-200 transition-all">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-5 h-5 text-slate-400" />
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
