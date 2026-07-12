import React from 'react';
import { Heart, Mail, Shield } from 'lucide-react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm py-8 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col items-center md:items-start gap-1">
          <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
            <Shield className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">License Info</span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Personal project, not for commercial use.
          </p>
        </div>

        <div className="flex flex-col items-center gap-2">
          <p className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-bold">
            Developed with <Heart className="w-4 h-4 text-rose-500 fill-rose-500 animate-pulse" /> by <span className="text-slate-900 dark:text-white">Reslan</span>
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
            © {currentYear} Solar Monitoring System
          </p>
        </div>

        <div className="flex flex-col items-center md:items-end gap-1">
          <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
            <Mail className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Contact</span>
          </div>
          <a 
            href="mailto:reslan.swed@gmail.com"
            className="text-sm text-slate-900 dark:text-white font-bold hover:text-amber-600 dark:hover:text-amber-500 transition-colors"
          >
            reslan.swed@gmail.com
          </a>
        </div>
      </div>
    </footer>
  );
};
