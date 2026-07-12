import React, { useEffect, useState } from 'react';
import { Device } from '@/src/types';
import { TelemetryData } from '@/src/api-types';
import { api } from '@/src/lib/api';
import { Zap, Battery, Cpu, ArrowUpRight, Sun, Activity, Box, Trash2, Edit2, Loader2 } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion } from 'motion/react';

interface DeviceCardProps {
  device: Device;
  onClick: (device: Device) => void;
  onDelete: (id: string) => void;
  onRename: (deviceSn: string, name: string) => void;
  showMonitoringInfo?: boolean;
  hoverOverlayText?: string;
}

const getWorkModeLabel = (mode: string) => {
  const modes: Record<string, string> = {
    P: "Power on",
    S: "Standby",
    L: "Line mode",
    B: "Battery mode",
    Y: "Bypass mode",
    E: "ECO mode",
    F: "Fault",
    H: "Power saving",
    C: "Charge mode"
  };
  return modes[mode] || mode;
};

export const DeviceCard: React.FC<DeviceCardProps> = ({ device, onClick, onDelete, onRename, showMonitoringInfo, hoverOverlayText }) => {
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);

  useEffect(() => {
    if (showMonitoringInfo && device.status === 'online') {
      const fetchTelem = async () => {
        try {
          const data = await api.getRealTimeTelemetry(device.deviceSn);
          setTelemetry(data);
        } catch (err) {
          console.error('Failed to fetch card telemetry', err);
        }
      };
      fetchTelem();
      const interval = setInterval(fetchTelem, 30000);
      return () => clearInterval(interval);
    }
  }, [showMonitoringInfo, device.deviceSn, device.status]);

  const statusColors = {
    online: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10',
    offline: 'text-slate-400 bg-slate-50 dark:bg-slate-800/50',
    warning: 'text-amber-500 bg-amber-50 dark:bg-amber-500/10',
    error: 'text-red-500 bg-red-50 dark:bg-red-500/10',
  };

  const Icon = device.type === 'panel' ? Zap : device.type === 'battery' ? Battery : Cpu;

  const currentWorkMode = telemetry ? getWorkModeLabel(telemetry.workMode) : device.workMode;
  const currentPvPower = telemetry ? telemetry.pvInputPower1 : device.pvOutput;
  const currentBattery = telemetry ? telemetry.batteryCapacity : device.batteryCapacity;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      onClick={() => onClick(device)}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 cursor-pointer hover:shadow-xl hover:shadow-slate-200 dark:hover:shadow-slate-950 transition-all group flex flex-col h-full relative overflow-hidden"
    >
      {/* Subtle hover background effect */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 dark:bg-amber-900/10 rounded-full -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-3xl -z-0" />

      {/* Hover Overlay for specific text like "Show Device Logs" */}
      {hoverOverlayText && (
        <div className="absolute inset-0 bg-amber-500/0 group-hover:bg-amber-600/90 transition-all duration-300 z-50 flex items-center justify-center opacity-0 group-hover:opacity-100 backdrop-blur-[2px]">
          <div className="flex flex-col items-center gap-2 text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
            <Activity className="w-8 h-8" />
            <span className="font-black text-sm uppercase tracking-widest">{hoverOverlayText}</span>
            <div className="w-8 h-1 bg-white/30 rounded-full" />
          </div>
        </div>
      )}

      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className="flex gap-3">
          <div className={cn("p-3 rounded-xl h-fit", statusColors[device.status])}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
        <div className={cn(
          "px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5",
          device.status === 'online' ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500" :
          device.status === 'warning' ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500" :
          device.status === 'error' ? "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-500" : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
        )}>
          <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", 
            device.status === 'online' ? "bg-emerald-500" : 
            device.status === 'warning' ? "bg-amber-500" : 
            device.status === 'error' ? "bg-red-500" : "bg-slate-400"
          )}></span>
          {device.status.toUpperCase()}
        </div>
      </div>

      <div className="mb-4 relative z-10">
        <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors">{device.name}</h3>
        <div className="flex flex-col gap-1 mt-1">
          <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-xs font-mono">
            <span className="font-bold uppercase text-[10px] text-slate-400 dark:text-slate-500">SN:</span>
            {device.deviceSn}
          </div>
        </div>
      </div>

      {showMonitoringInfo && (
        <div className="grid grid-cols-1 gap-3 mb-6 flex-grow relative z-10">
          <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 group-hover:bg-white dark:group-hover:bg-slate-800 border border-transparent group-hover:border-slate-100 dark:group-hover:border-slate-700 rounded-xl transition-colors">
            <div className="flex items-center gap-2">
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">PV Power</span>
            </div>
            <span className="text-sm font-bold text-slate-900 dark:text-white">{currentPvPower} W</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 group-hover:bg-white dark:group-hover:bg-slate-800 border border-transparent group-hover:border-slate-100 dark:group-hover:border-slate-700 rounded-xl transition-colors">
            <div className="flex items-center gap-2">
              <Battery className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Battery</span>
            </div>
            <span className="text-sm font-bold text-slate-900 dark:text-white">{currentBattery}%</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 group-hover:bg-white dark:group-hover:bg-slate-800 border border-transparent group-hover:border-slate-100 dark:group-hover:border-slate-700 rounded-xl transition-colors">
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Work Mode</span>
            </div>
            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">{currentWorkMode}</span>
          </div>
        </div>
      )}

      {showMonitoringInfo && (
        <div className="flex items-center justify-end pt-4 border-t border-slate-100 dark:border-slate-800 mt-auto relative z-10">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500 text-sm font-bold transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
            Monitor Device
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>
      )}
    </motion.div>
  );
};
