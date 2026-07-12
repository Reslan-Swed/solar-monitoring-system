import React, { useState, useEffect, useCallback } from 'react';
import { Device } from '@/src/types';
import { HistoricalDataItem } from '@/src/api-types';
import { api } from '@/src/lib/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
  Download, Calendar, FileText, Filter, ChevronRight, ChevronLeft, 
  Loader2, AlertCircle, Clock, Zap, Activity, Thermometer, Sun 
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay, addHours } from 'date-fns';
import { cn } from '@/src/lib/utils';

interface HistoryViewProps {
  device: Device;
  onBack: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ device, onBack }) => {
  const [timeRange, setTimeRange] = useState('7d');
  const [customStartDate, setCustomStartDate] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [customEndDate, setCustomEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [exportDate, setExportDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [exportMonth, setExportMonth] = useState(format(new Date(), 'yyyy-MM'));
  
  const [historyData, setHistoryData] = useState<HistoricalDataItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hourlyTrendData, setHourlyTrendData] = useState<any[]>([]);
  const [isTrendLoading, setIsTrendLoading] = useState(false);

  const fetch24hTrend = useCallback(async () => {
    if (!device) return;
    setIsTrendLoading(true);
    try {
      const end = new Date();
      const start = subDays(end, 1);
      
      // Server assumes UTC+5, so we add 5 hours to the local time to match the expected window
      const offsetEnd = addHours(end, 5);
      const offsetStart = addHours(start, 5);

      let allRecords: HistoricalDataItem[] = [];
      let pageNum = 1;
      let hasMore = true;
      const pageSize = 50; // Use larger page size for trend

      // Fetch all records to cover 24h
      while (hasMore) {
        const response = await api.getHistoricalData({
          deviceSn: device.deviceSn,
          startDate: format(offsetStart, 'yyyy-MM-dd HH:mm:ss'),
          endDate: format(offsetEnd, 'yyyy-MM-dd HH:mm:ss'),
          pageNum,
          pageSize
        });
        
        allRecords = [...allRecords, ...response.list];
        
        if (response.list.length < pageSize || pageNum >= response.pages) {
          hasMore = false;
        } else {
          // Check if the last record in this page is already older than our start time
          const lastRecord = response.list[response.list.length - 1];
          if (lastRecord && new Date(lastRecord.createTime) < start) {
            hasMore = false;
          } else {
            pageNum++;
          }
        }
      }

      // Group by hour
      const hourlyGroups: Record<string, HistoricalDataItem[]> = {};
      allRecords.forEach(record => {
        const date = new Date(record.createTime);
        if (date >= start && date <= end) {
          const hourKey = format(date, 'yyyy-MM-dd HH:00');
          if (!hourlyGroups[hourKey]) hourlyGroups[hourKey] = [];
          hourlyGroups[hourKey].push(record);
        }
      });

      // Calculate averages
      const trendData = Object.entries(hourlyGroups).map(([hour, records]) => {
        const avg = (fn: (r: HistoricalDataItem) => number) => 
          records.length ? records.reduce((sum, r) => sum + fn(r), 0) / records.length : 0;

        return {
          time: format(new Date(hour), 'HH:00'),
          fullTime: hour,
          pvPower: Math.round(avg(r => Number(r.pvInputPower1) || 0)),
          load: Math.round(avg(r => Number(r.acOutputActivePowerTotal) || 0)),
          grid: Math.round(avg(r => Number(r.gridPowerInputActiveTotal) || 0)),
          // Battery Charge: use chargingPower if available, else current * voltage
          batteryCharge: Math.round(avg(r => 
            Number(r.batteryChargingPower) || (Number(r.chargingCurrent) * Number(r.batteryVoltage)) || 0
          )),
          batteryDischarge: Math.round(avg(r => Number(r.batteryDischargingPower) || 0))
        };
      }).sort((a, b) => a.fullTime.localeCompare(b.fullTime));

      setHourlyTrendData(trendData);
    } catch (err) {
      console.error('Failed to fetch 24h trend', err);
    } finally {
      setIsTrendLoading(false);
    }
  }, [device?.deviceSn]);

  const fetchData = useCallback(async () => {
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

      const response = await api.getHistoricalData({
        deviceSn: device.deviceSn,
        startDate: format(addHours(start, 5), 'yyyy-MM-dd HH:mm:ss'),
        endDate: format(addHours(end, 5), 'yyyy-MM-dd HH:mm:ss'),
        pageNum: currentPage,
        pageSize: 20
      });

      setHistoryData(response.list);
      setTotalPages(response.pages);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch historical data');
    } finally {
      setIsLoading(false);
    }
  }, [device?.deviceSn, timeRange, currentPage, customStartDate, customEndDate]);

  useEffect(() => {
    fetchData();
    fetch24hTrend();
  }, [fetchData, fetch24hTrend]);

  const [downloadType, setDownloadType] = useState<'day' | 'month'>('day');

  const handleDownload = async () => {
    try {
      let queryParams: Record<string, string> = {};
      
      if (downloadType === 'day') {
        queryParams = {
          startTime: exportDate,
          endTime: exportDate
        };
      } else {
        queryParams = {
          yearMonth: exportMonth
        };
      }

      const blob = await api.downloadHistoricalExcel(device.deviceSn, queryParams);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const filename = downloadType === 'day' ? exportDate : exportMonth;
      a.download = `${device.name}_History_${filename}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Excel download failed', err);
    }
  };

  const getWorkModeLabel = (mode: string) => {
    const modes: Record<string, string> = {
      P: "Power on mode",
      S: "Standby mode",
      L: "Line mode",
      B: "Battery mode",
      Y: "Bypass mode",
      E: "ECO mode",
      F: "Fault mode",
      H: "Power saving mode",
      C: "Charge mode"
    };
    return modes[mode] || mode;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-600 transition-all shadow-sm"
            title="Back to Device Selection"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Historical Performance</h2>
            <p className="text-slate-500">Analyze long-term yield and efficiency trends for {device.name}</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-white border border-slate-200 rounded-lg p-1">
            {['24h', '7d', '30d', '1y', 'custom'].map((range) => (
              <button
                key={range}
                onClick={() => {
                  setTimeRange(range);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  timeRange === range ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700'
                }`}
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
            </div>
          )}

          <div className="flex items-center gap-2 p-1 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center gap-1 mr-2 px-2 border-r border-slate-200">
              <button 
                onClick={() => setDownloadType('day')}
                className={cn(
                  "px-2 py-1 text-[10px] font-bold rounded transition-all",
                  downloadType === 'day' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                DAY
              </button>
              <button 
                onClick={() => setDownloadType('month')}
                className={cn(
                  "px-2 py-1 text-[10px] font-bold rounded transition-all",
                  downloadType === 'month' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                MONTH
              </button>
            </div>

            {downloadType === 'day' ? (
              <input 
                type="date" 
                value={exportDate}
                onChange={(e) => setExportDate(e.target.value)}
                className="text-xs font-bold text-slate-600 bg-transparent outline-none cursor-pointer pr-2"
              />
            ) : (
              <input 
                type="month" 
                value={exportMonth}
                onChange={(e) => setExportMonth(e.target.value)}
                className="text-xs font-bold text-slate-600 bg-transparent outline-none cursor-pointer pr-2"
              />
            )}
          </div>
          <button 
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-semibold hover:bg-emerald-600 transition-all shadow-md shadow-emerald-200"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-3 text-red-600">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-3 bg-white p-6 rounded-2xl border border-slate-200 relative min-h-[450px]">
          {isTrendLoading && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            </div>
          )}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-bold text-slate-900">24h Power Distribution Trend</h3>
              <p className="text-sm text-slate-500">Hourly average power metrics across all sources</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-6 text-xs font-medium">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-slate-600">PV Power</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-slate-600">Load</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-slate-600">Grid</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                  <span className="text-slate-600">Batt Charge</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-pink-500" />
                  <span className="text-slate-600">Batt Discharge</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyTrendData}>
                <defs>
                  <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="time" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  unit="W"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: 'none', 
                    borderRadius: '12px', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' 
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="pvPower" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorPv)" 
                  name="PV Power"
                />
                <Area 
                  type="monotone" 
                  dataKey="load" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorLoad)" 
                  name="Load"
                />
                <Area 
                  type="monotone" 
                  dataKey="grid" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  fillOpacity={0.1}
                  fill="#10b981"
                  name="Grid"
                />
                <Area 
                  type="monotone" 
                  dataKey="batteryCharge" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  fillOpacity={0.1}
                  fill="#8b5cf6"
                  name="Battery Charge"
                />
                <Area 
                  type="monotone" 
                  dataKey="batteryDischarge" 
                  stroke="#ec4899" 
                  strokeWidth={2}
                  fillOpacity={0.1}
                  fill="#ec4899"
                  name="Battery Discharge"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 relative min-h-[400px]">
          {isLoading && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            </div>
          )}
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-slate-900">Energy Production Trends (Watts)</h3>
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <Calendar className="w-4 h-4" />
              {format(new Date(), 'MMMM yyyy')}
            </div>
          </div>
          
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={historyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="createTime" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  tickFormatter={(val) => val.split(' ')[0]} // Show only date
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: 'none', 
                    borderRadius: '12px', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' 
                  }}
                />
                <Bar 
                  dataKey="acOutputActivePowerTotal" 
                  fill="#f59e0b" 
                  radius={[4, 4, 0, 0]} 
                  name="Output (W)"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h3 className="font-bold text-slate-900 mb-6">Device Insights</h3>
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">Max Thermal Load</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-orange-500" />
                  <span className="text-lg font-black text-slate-900">
                    {historyData.length > 0 ? Math.max(...historyData.map(d => parseFloat(d.maxTemperature))) : '0'}°C
                  </span>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">Peak PV Input</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span className="text-lg font-black text-slate-900">
                    {historyData.length > 0 ? Math.max(...historyData.map(d => parseFloat(d.pvInputPower1))) : '0'} W
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">Peak AC Output</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-500" />
                  <span className="text-lg font-black text-slate-900">
                    {historyData.length > 0 ? Math.max(...historyData.map(d => d.acOutputActivePowerTotal)) : '0'} W
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-slate-900 rounded-xl text-white">
            <h4 className="text-xs uppercase font-bold text-slate-400 mb-4 tracking-wider">Operational Status</h4>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-300">System Stability</span>
              <span className="text-sm font-bold text-emerald-400">98.2%</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full w-[98%] rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900">Data Logs</h3>
          <div className="flex items-center gap-2">
            <button 
              disabled={currentPage === 1 || isLoading}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-500">Page {currentPage} of {totalPages}</span>
            <button 
              disabled={currentPage === totalPages || isLoading}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase whitespace-nowrap">Timestamp</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase whitespace-nowrap">Mode</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase whitespace-nowrap">PV Power (W)</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase whitespace-nowrap">PV Voltage (V)</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase whitespace-nowrap">Bat Capacity (%)</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase whitespace-nowrap">Bat Voltage (V)</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase whitespace-nowrap">Bat Dis. Pwr (W)</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase whitespace-nowrap">Dis. Cur (A)</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase whitespace-nowrap">Cha. Cur (A)</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase whitespace-nowrap">AC Act. Pwr (W)</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase whitespace-nowrap">AC App. Pwr (VA)</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase whitespace-nowrap">AC Vol (V)</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase whitespace-nowrap">AC Freq (Hz)</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase whitespace-nowrap">AC Load (%)</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase whitespace-nowrap">Grid Vol (V)</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase whitespace-nowrap">Grid Freq (Hz)</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase whitespace-nowrap">Grid Act. Pwr (W)</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase whitespace-nowrap">Gen Vol (V)</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase whitespace-nowrap">Gen Freq (Hz)</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase whitespace-nowrap">Out2 Vol (V)</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase whitespace-nowrap">Out2 Freq (Hz)</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase whitespace-nowrap">Max Temp (°C)</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase whitespace-nowrap">Inner Temp (°C)</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase whitespace-nowrap">Cur In 1 (A)</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase whitespace-nowrap">Fault</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {historyData.map((log, i) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-600 font-medium whitespace-nowrap">
                    {log.createTime}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-[10px] font-bold">
                      {getWorkModeLabel(log.workMode)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-900 font-bold whitespace-nowrap">{log.pvInputPower1}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">{log.pvInputVoltage1}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">{log.batteryCapacity}%</td>
                  <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">{log.batteryVoltage}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">{log.batteryDischargingPower}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">{log.dischargingCurrent}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">{log.chargingCurrent}</td>
                  <td className="px-6 py-4 text-sm text-slate-900 font-bold whitespace-nowrap">{log.acOutputActivePowerTotal}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">{log.acOutputApparentPowerTotal}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">{log.acOutputVoltageR}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">{log.acOutputFrequency}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">{log.acOutputLoadTotal}%</td>
                  <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">{log.gridVoltageR}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">{log.gridFrequency}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">{log.gridPowerInputActiveTotal}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">{log.generatorInputVoltage}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">{log.generatorInputFrequency}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">{log.output2Voltage}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">{log.output2Frequency}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">{log.maxTemperature}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">{log.innerTemperature}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">{log.currentInput1}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={cn(
                      "px-2 py-1 rounded text-[10px] font-bold",
                      log.fault1 === '0' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                    )}>
                      {log.fault1 === '0' ? 'NORMAL' : `FAULT ${log.fault1}`}
                    </span>
                  </td>
                </tr>
              ))}
              {historyData.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={25} className="px-6 py-12 text-center text-slate-400">
                    No records found for the selected period
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
