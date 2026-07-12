import React from 'react';
import { LayoutDashboard, Zap, History, Bell, Settings, LogOut, Sun, ChevronLeft, ChevronRight, Menu, X } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  onLogout, 
  isCollapsed, 
  setIsCollapsed,
  isOpen,
  setIsOpen
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'monitoring', label: 'Monitoring', icon: Zap },
    { id: 'history', label: 'Historical Data', icon: History },
    { id: 'alerts', label: 'Alerts', icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const sidebarVariants = {
    expanded: { width: 256 },
    collapsed: { width: 80 },
  };

  const SidebarContent = (
    <>
      <div className={cn(
        "p-6 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 transition-all",
        isCollapsed ? "justify-center p-4" : "justify-between"
      )}>
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex-shrink-0 flex items-center justify-center">
            <Sun className="w-6 h-6 text-amber-500" />
          </div>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="whitespace-nowrap"
            >
              <h2 className="font-bold text-slate-900 dark:text-white leading-tight">SolarMonitor</h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">Enterprise v2.0</span>
            </motion.div>
          )}
        </div>
        
        {/* Desktop Collapse Toggle */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "hidden lg:flex w-6 h-6 items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-all duration-300",
            isCollapsed ? "absolute -right-3 top-1/2 -translate-y-1/2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm z-50" : "relative"
          )}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Mobile Close Toggle */}
        <button 
          onClick={() => setIsOpen(false)}
          className="lg:hidden w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto overflow-x-hidden">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (window.innerWidth < 1024) setIsOpen(false);
              }}
              title={isCollapsed ? item.label : undefined}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium relative group",
                isActive 
                  ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-500 shadow-sm" 
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800",
                isCollapsed && "justify-center px-0"
              )}
            >
              <Icon className={cn("w-5 h-5 flex-shrink-0", isActive ? "text-amber-600 dark:text-amber-500" : "text-slate-400 dark:text-slate-500")} />
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="whitespace-nowrap"
                >
                  {item.label}
                </motion.span>
              )}
              {isCollapsed && (
                <div className="absolute left-full ml-3 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-100 dark:border-slate-800">
        <button
          onClick={onLogout}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-all font-medium group",
            isCollapsed && "justify-center px-0"
          )}
        >
          <LogOut className="w-5 h-5 text-slate-400 group-hover:text-red-600 flex-shrink-0" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Desktop & Mobile Sidebar */}
      <motion.aside
        initial={false}
        animate={window.innerWidth >= 1024 ? (isCollapsed ? 'collapsed' : 'expanded') : (isOpen ? 'expanded' : 'collapsed')}
        variants={sidebarVariants}
        className={cn(
          "h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col fixed left-0 top-0 z-50 transition-colors",
          !isOpen && "hidden lg:flex",
          isOpen && "flex w-64 shadow-2xl"
        )}
      >
        {SidebarContent}
      </motion.aside>
    </>
  );
};
