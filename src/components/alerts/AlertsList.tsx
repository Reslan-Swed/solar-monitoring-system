import React from 'react';
import { Alert } from '@/src/types';
import { Bell, AlertTriangle, Info, AlertOctagon, Check, Trash2, MoreVertical } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion } from 'motion/react';

interface AlertsListProps {
  alerts: Alert[];
  onMarkRead: (id: string) => void;
}

export const AlertsList: React.FC<AlertsListProps> = ({ alerts, onMarkRead }) => {
  const severityStyles = {
    low: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-100 dark:border-blue-900/30' },
    medium: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-100 dark:border-amber-900/30' },
    high: { icon: AlertOctagon, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-100 dark:border-red-900/30' },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">System Alerts</h2>
          <p className="text-slate-500 dark:text-slate-400">Real-time notifications about your solar infrastructure</p>
        </div>
        <button className="text-sm font-bold text-amber-600 dark:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/10 px-4 py-2 rounded-lg transition-all">
          Mark All as Read
        </button>
      </div>

      <div className="space-y-4">
        {alerts.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white">All systems operational</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm mt-1">No alerts found for the current period. We'll notify you if anything changes.</p>
          </div>
        ) : (
          alerts.map((alert, i) => {
            const style = severityStyles[alert.severity];
            const Icon = style.icon;
            
            return (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                key={alert.id}
                className={cn(
                  "bg-white dark:bg-slate-900 border rounded-2xl p-5 flex items-start gap-4 transition-all hover:shadow-lg hover:shadow-slate-100 dark:hover:shadow-slate-950",
                  style.border,
                  !alert.isRead && "ring-2 ring-amber-500/10 dark:ring-amber-500/20"
                )}
              >
                <div className={cn("p-3 rounded-xl shrink-0", style.bg)}>
                  <Icon className={cn("w-6 h-6", style.color)} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold text-slate-900 dark:text-white truncate">{alert.deviceName}</h4>
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">{alert.timestamp}</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-3">
                    {alert.message}
                  </p>
                  <div className="flex items-center gap-4">
                    {!alert.isRead && (
                      <button 
                        onClick={() => onMarkRead(alert.id)}
                        className="text-xs font-bold text-amber-600 dark:text-amber-500 hover:underline"
                      >
                        Mark as read
                      </button>
                    )}
                    <button className="text-xs font-bold text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                      View Details
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-400 dark:text-slate-500 transition-all">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};
