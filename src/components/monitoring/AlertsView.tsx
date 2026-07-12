import React, { useState, useEffect, useCallback } from 'react';
import { format, subDays, startOfDay, endOfDay, addHours } from 'date-fns';
import { AlertCircle, AlertTriangle, Info, Search, Calendar, ChevronLeft, ChevronRight, Bell, BellOff } from 'lucide-react';
import { api } from '../../lib/api';
import { EventLogItem } from '../../api-types';
import { Device as DeviceType } from '../../types';
import { cn } from '../../lib/utils';

interface AlertsViewProps {
  device: DeviceType | null;
}

export const AlertsView: React.FC<AlertsViewProps> = ({ device }) => {
  const [timeRange, setTimeRange] = useState('7d');
  const [customStartDate, setCustomStartDate] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [customEndDate, setCustomEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  const [alerts, setAlerts] = useState<EventLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchAlerts = useCallback(async () => {
    if (!device) return;
    setIsLoading(true);
    setError(null);
    try {
      let start: Date;
      let end: Date = endOfDay(new Date());

      if (timeRange === 'custom') {
        start = startOfDay(new Date(customStartDate));
        end = endOfDay(new Date(customEndDate));
      } else {
        const now = new Date();
        start = startOfDay(subDays(now, 7));
        if (timeRange === '24h') start = startOfDay(now);
        if (timeRange === '30d') start = startOfDay(subDays(now, 30));
        if (timeRange === '1y') start = startOfDay(subDays(now, 365));
      }

      const response = await api.getEventLogs({
        deviceSn: device.deviceSn,
        startDate: format(addHours(start, 5), 'yyyy-MM-dd HH:mm:ss'),
        endDate: format(addHours(end, 5), 'yyyy-MM-dd HH:mm:ss'),
        pageNum: currentPage,
        pageSize: 20
      });

      setAlerts(response.list);
      setTotalPages(response.pages || 1);
      setTotalCount(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch alerts');
    } finally {
      setIsLoading(false);
    }
  }, [device?.deviceSn, timeRange, currentPage, customStartDate, customEndDate]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const getEventIcon = (type: number) => {
    switch (type) {
      case 1: return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 2: return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 3: return <Info className="w-5 h-5 text-blue-500" />;
      default: return <Bell className="w-5 h-5 text-slate-400" />;
    }
  };

  const getEventTypeName = (type: number) => {
    switch (type) {
      case 1: return 'Fault';
      case 2: return 'Warning';
      case 3: return 'Info';
      default: return 'Unknown';
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
    <div className="space-y-6">
      {!device ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
          <Bell className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900">No device selected</h3>
          <p className="text-slate-500">Please select a device from the dashboard to view its event logs.</p>
        </div>
      ) : (
        <>
          {/* Header & Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-indigo-500" />
            System Alerts & Notifications
          </h2>
          <p className="text-slate-500 text-sm mt-1">Event logs and system notifications for {device.name}</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-slate-100 rounded-lg p-1">
            {['24h', '7d', '30d', 'custom'].map((range) => (
              <button
                key={range}
                onClick={() => {
                  setTimeRange(range);
                  setCurrentPage(1);
                }}
                className={cn(
                  "px-3 py-1.5 text-xs font-bold rounded-md transition-all",
                  timeRange === range ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                {range.toUpperCase()}
              </button>
            ))}
          </div>

          {timeRange === 'custom' && (
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1 px-2">
              <input 
                type="date" 
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="text-xs font-bold text-slate-600 bg-transparent outline-none cursor-pointer"
              />
              <span className="text-slate-300">-</span>
              <input 
                type="date" 
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="text-xs font-bold text-slate-600 bg-transparent outline-none cursor-pointer"
              />
              <button 
                onClick={() => { setCurrentPage(1); fetchAlerts(); }}
                className="p-1 hover:bg-slate-100 rounded text-indigo-600"
              >
                <Search className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Alerts List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            <p className="text-slate-400 font-medium animate-pulse">Retrieving event logs...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <div className="inline-flex p-3 bg-red-50 rounded-full mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Failed to load alerts</h3>
            <p className="text-slate-500 max-w-md mx-auto mb-6">{error}</p>
            <button 
              onClick={fetchAlerts}
              className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition-all"
            >
              Retry
            </button>
          </div>
        ) : alerts.length === 0 ? (
          <div className="py-24 text-center">
            <div className="inline-flex p-4 bg-slate-50 rounded-full mb-4">
              <BellOff className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-1">No alerts found</h3>
            <p className="text-slate-500">System is running smoothly. No events recorded in the selected period.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Alert Name / Info</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Occurrence Time</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Extinction Time</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Code</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {alerts.map((alert) => (
                    <tr key={alert.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getEventIcon(alert.eventType)}
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold border",
                            getEventTypeStyles(alert.eventType)
                          )}>
                            {getEventTypeName(alert.eventType).toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-slate-900">
                          {alert.eventInfo || 'Unknown System Event'}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          SN: {alert.deviceSn}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-sm font-medium">{alert.occurrenceTime}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {alert.extinctionTime ? (
                          <div className="flex items-center gap-2 text-slate-500">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 opacity-50" />
                            <span className="text-sm">{alert.extinctionTime}</span>
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[10px] font-bold">
                            ACTIVE
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-xs font-mono font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded">
                          {alert.eventCode}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              <p className="text-xs font-medium text-slate-500">
                Showing <span className="text-slate-900">{alerts.length}</span> of <span className="text-slate-900">{totalCount}</span> events
              </p>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1 || isLoading}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all shadow-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum = i + 1;
                    if (totalPages > 5 && currentPage > 3) {
                      pageNum = currentPage - 2 + i;
                      if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                    }
                    if (pageNum <= 0) return null;
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={cn(
                          "w-8 h-8 rounded-lg text-xs font-bold transition-all shadow-sm",
                          currentPage === pageNum
                            ? "bg-indigo-600 text-white"
                            : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                        )}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  disabled={currentPage === totalPages || isLoading}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all shadow-sm"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      </>
    )}
    </div>
  );
};
