import React, { useState, useEffect, useCallback } from 'react';
import { Device } from '@/src/types';
import { TelemetryData } from '@/src/api-types';
import { api } from '@/src/lib/api';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import {
  Zap, Thermometer, Activity, ArrowLeft, RefreshCw, Battery,
  Cpu, Power, Gauge, Droplets, Wind, Sun, Loader2, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';

interface RealTimeMonitorProps {
  device: Device;
  onBack: () => void;
}

const StatusRow: React.FC<{ 
  label: string; 
  value: number | undefined; 
  mapping: Record<number, { label: string; color: string; bg: string }> 
}> = ({ label, value, mapping }) => {
  const status = value !== undefined ? mapping[value] : null;
  return (
    <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-800 last:border-0">
      <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">{label}</span>
      {status ? (
        <span className={cn("px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider", status.color, status.bg)}>
          {status.label}
        </span>
      ) : (
        <span className="text-xs font-bold text-slate-400">N/A</span>
      )}
    </div>
  );
};

export const RealTimeMonitor: React.FC<RealTimeMonitorProps> = ({ device, onBack }) => {
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    if (!device) return;
    setIsLoading(true);
    try {
      const data = await api.getRealTimeTelemetry(device.deviceSn);
      setTelemetry(data);
      setLastUpdated(new Date());

      // Update local history for the chart
      const newHistoryPoint = {
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        power: data.acOutputActivePowerTotal,
        pv: parseFloat(data.pvInputPower1)
      };

      setHistory(prev => {
        const next = [...prev, newHistoryPoint];
        if (next.length > 20) return next.slice(1);
        return next;
      });
    } catch (err) {
      console.error('Telemetry fetch failed', err);
    } finally {
      setIsLoading(false);
    }
  }, [device?.deviceSn]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Auto update every 10s
    return () => clearInterval(interval);
  }, [fetchData]);

  if (!telemetry && isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
        <p className="text-slate-500 dark:text-slate-400 font-medium">Connecting to {device.name}...</p>
      </div>
    );
  }

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

  const calculateBatteryEstimation = () => {
    if (telemetry?.workMode !== 'B') return null;

    const capacity = parseFloat(telemetry?.batteryCapacity || '0');
    const dischargePower = parseFloat(telemetry?.batteryDischargingPower || '0');

    if (dischargePower <= 0 || capacity <= 0) return null;

    // Assuming a standard 5.12kWh battery bank (100Ah @ 51.2V) for estimation
    // If we had the actual Ah from settings, we'd use that.
    const totalEnergyWh = 2500;
    const remainingEnergyWh = totalEnergyWh * (capacity / 100);
    const hoursRemaining = remainingEnergyWh / dischargePower;

    const h = Math.floor(hoursRemaining);
    const m = Math.round((hoursRemaining - h) * 60);

    return { h, m };
  };

  const estimation = calculateBatteryEstimation();

  const mainStats = [
    { label: 'Work Mode', value: getWorkModeLabel(telemetry?.workMode || ''), unit: '', icon: Cpu, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
    { label: 'PV Power', value: telemetry?.pvInputPower1, unit: 'W', icon: Sun, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { label: 'Battery', value: telemetry?.batteryCapacity, unit: '%', icon: Battery, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { label: 'AC Load', value: telemetry?.acOutputActivePowerTotal, unit: 'W', icon: Zap, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Grid Power', value: telemetry?.gridPowerInputActiveTotal, unit: 'W', icon: Activity, color: 'text-slate-500', bg: 'bg-slate-50 dark:bg-slate-800/50' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"
          >
            <ArrowLeft className="w-6 h-6 text-slate-600 dark:text-slate-400" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{device.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Live Sn: <span className="font-mono text-xs">{device.deviceSn}</span>
              </p>
              {lastUpdated && (
                <p className="text-xs text-slate-400 dark:text-slate-500 border-l border-slate-200 dark:border-slate-800 pl-2">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={fetchData}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
        >
          <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          Sync Data
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {mainStats.map((stat, i) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={stat.label}
            className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={cn("p-2 rounded-xl", stat.bg)}>
                <stat.icon className={cn("w-5 h-5", stat.color)} />
              </div>
              <span className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{stat.label}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <p className={cn(
                "font-black text-slate-900 dark:text-white tracking-tight",
                stat.label === 'Work Mode' ? "text-xl" : "text-3xl"
              )}>
                {stat.value || '0'}
              </p>
              <span className="text-sm font-bold text-slate-400 dark:text-slate-500">{stat.unit}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">Power Performance</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Comparing PV Input vs AC Load Output</p>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">PV Input</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">AC Output</span>
                </div>
              </div>
            </div>

            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history}>
                  <defs>
                    <linearGradient id="colorPV" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorAC" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.1} />
                  <XAxis dataKey="timestamp" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip contentStyle={{ border: 'none', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: '#1e293b', color: '#f8fafc' }} itemStyle={{ color: '#f8fafc' }} />
                  <Area type="monotone" dataKey="pv" stroke="#f59e0b" fill="url(#colorPV)" strokeWidth={2} />
                  <Area type="monotone" dataKey="power" stroke="#3b82f6" fill="url(#colorAC)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Battery className="w-5 h-5 text-emerald-500" />
                  Battery Diagnostics
                </div>
                {estimation && (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 rounded-full animate-pulse">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-500 uppercase">Est. {estimation.h}h {estimation.m}m</span>
                  </div>
                )}
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-slate-50 dark:border-slate-800">
                  <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Voltage</span>
                  <span className="font-bold text-slate-900 dark:text-white">{telemetry?.batteryVoltage} V</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-50 dark:border-slate-800">
                  <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Charging Power</span>
                  <span className="font-bold text-slate-900 dark:text-white">{telemetry?.batteryChargingPower || '0'} W</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-50 dark:border-slate-800">
                  <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Charge Current</span>
                  <span className="font-bold text-slate-900 dark:text-white">{telemetry?.chargingCurrent} A</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-50 dark:border-slate-800">
                  <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Discharge Power</span>
                  <span className="font-bold text-slate-900 dark:text-white">{telemetry?.batteryDischargingPower} W</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-50 dark:border-slate-800">
                  <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Discharge Current</span>
                  <span className="font-bold text-slate-900 dark:text-white">{telemetry?.dischargingCurrent} A</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <Gauge className="w-5 h-5 text-indigo-500" />
                Grid & AC Info
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-slate-50 dark:border-slate-800">
                  <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Grid Voltage</span>
                  <span className="font-bold text-slate-900 dark:text-white">{telemetry?.gridVoltageR} V</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-50 dark:border-slate-800">
                  <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Grid Current</span>
                  <span className="font-bold text-slate-900 dark:text-white">{(+telemetry?.gridPowerInputActiveTotal > 0 && +telemetry?.gridVoltageR > 0) ? (+telemetry?.gridPowerInputActiveTotal / +telemetry?.gridVoltageR).toFixed(1) : '0'} A</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-50 dark:border-slate-800">
                  <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Grid Frequency</span>
                  <span className="font-bold text-slate-900 dark:text-white">{telemetry?.gridFrequency} Hz</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-50 dark:border-slate-800">
                  <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">AC Output Voltage</span>
                  <span className="font-bold text-slate-900 dark:text-white">{telemetry?.acOutputVoltageR} V</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-50 dark:border-slate-800">
                  <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">AC Output Current</span>
                  <span className="font-bold text-slate-900 dark:text-white">{(telemetry?.acOutputApparentPowerTotal > 0 && +telemetry?.acOutputVoltageR > 0) ? (telemetry?.acOutputApparentPowerTotal / +telemetry?.acOutputVoltageR).toFixed(1) : '0'} A</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-50 dark:border-slate-800">
                  <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">AC Output Frequency</span>
                  <span className="font-bold text-slate-900 dark:text-white">{telemetry?.acOutputFrequency} Hz</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-amber-500" />
              System Status
            </h3>
            <div className="space-y-4">
              <StatusRow 
                label="Solar Status" 
                value={telemetry?.statusSolar1} 
                mapping={{
                  0: { label: 'No Solar', color: 'text-slate-500', bg: 'bg-slate-50 dark:bg-slate-800' },
                  1: { label: 'Solar Available', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' }
                }}
              />
              <StatusRow 
                label="Battery Status" 
                value={telemetry?.statusBattery} 
                mapping={{
                  0: { label: 'Idle', color: 'text-slate-500', bg: 'bg-slate-50 dark:bg-slate-800' },
                  1: { label: 'Charging', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                  2: { label: 'Discharging', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' }
                }}
              />
              <StatusRow 
                label="Grid Status" 
                value={telemetry?.statusGrid} 
                mapping={{
                  0: { label: 'No Grid', color: 'text-slate-500', bg: 'bg-slate-50 dark:bg-slate-800' },
                  1: { label: 'Grid Available', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' }
                }}
              />
              <StatusRow 
                label="Load Status" 
                value={telemetry?.statusLoad} 
                mapping={{
                  0: { label: 'No Load', color: 'text-slate-500', bg: 'bg-slate-50 dark:bg-slate-800' },
                  1: { label: 'Active Load', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' }
                }}
              />
              <StatusRow 
                label="Inverter Mode" 
                value={telemetry?.statusInverter} 
                mapping={{
                  0: { label: 'Bypass', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                  1: { label: 'Charging', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                  2: { label: 'Discharging', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' }
                }}
              />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Sun className="w-5 h-5 text-amber-500" />
              PV Input Status
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-800">
                <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">PV Voltage</span>
                <span className="font-bold text-slate-900 dark:text-white">{telemetry?.pvInputVoltage1} V</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-800">
                <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">PV Current</span>
                <span className="font-bold text-slate-900 dark:text-white">{telemetry?.currentInput1} A</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Thermometer className="w-5 h-5 text-orange-500" />
              Thermal Status
            </h3>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Internal Temp</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{telemetry?.innerTemperature}°C</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-orange-500 h-full rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min(100, (parseFloat(telemetry?.innerTemperature || '0') / 80) * 100)}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Heat Sink Temp</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{telemetry?.maxTemperature}°C</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-red-500 h-full rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min(100, (parseFloat(telemetry?.maxTemperature || '0') / 80) * 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Power className="w-5 h-5 text-amber-500" />
              Generator & Aux
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-800">
                <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Gen Voltage</span>
                <span className="font-bold text-slate-900 dark:text-white">{telemetry?.generatorInputVoltage} V</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-800">
                <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Gen Frequency</span>
                <span className="font-bold text-slate-900 dark:text-white">{telemetry?.generatorInputFrequency} Hz</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-800">
                <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Output 2 Voltage</span>
                <span className="font-bold text-slate-900 dark:text-white">{telemetry?.output2Voltage} V</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-800">
                <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Output 2 Frequency</span>
                <span className="font-bold text-slate-900 dark:text-white">{telemetry?.output2Frequency} Hz</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 dark:bg-slate-800 rounded-2xl p-6 text-white relative overflow-hidden group">
            <Activity className="absolute -right-4 -bottom-4 w-32 h-32 text-slate-800 dark:text-slate-700 opacity-50 group-hover:scale-110 transition-transform duration-700" />
            <div className="relative z-10">
              <h3 className="font-bold mb-1">Load Efficiency</h3>
              <p className="text-3xl font-black mb-2">{telemetry?.acOutputLoadTotal}%</p>
              <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                <Info className="w-3 h-3" />
                Current system utilization
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
