import React from 'react';
import { Device } from '@/src/types';
import { DeviceCard } from './DeviceCard';
import { Filter, Search as SearchIcon, Plus, RefreshCw } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface DeviceListProps {
  devices: Device[];
  onSelectDevice: (device: Device) => void;
  onDeleteDevice: (id: string) => void;
  onRenameDevice: (deviceSn: string, name: string) => void;
  onAddDevice?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  title?: string;
  subtitle?: string;
  showMonitoringInfo?: boolean;
  hoverOverlayText?: string;
}

export const DeviceList: React.FC<DeviceListProps> = ({ 
  devices, 
  onSelectDevice, 
  onDeleteDevice, 
  onRenameDevice, 
  onAddDevice, 
  onRefresh, 
  isRefreshing,
  title, 
  subtitle, 
  showMonitoringInfo, 
  hoverOverlayText 
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white transition-colors">{title || "Connected Assets"}</h2>
          <p className="text-slate-500 dark:text-slate-400 transition-colors">{subtitle || `Monitoring ${devices.length} devices across your infrastructure`}</p>
        </div>
        
        <div className="flex items-center gap-3">
          {onRefresh && (
            <button 
              onClick={onRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
              title="Refresh device status"
            >
              <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          )}
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
            <Filter className="w-4 h-4" />
            Filter
          </button>
          {onAddDevice && (
            <button 
              onClick={onAddDevice}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600 transition-all shadow-md shadow-amber-200"
            >
              <Plus className="w-4 h-4" />
              Add Device
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {devices.map((device) => (
          <DeviceCard 
            key={device.id} 
            device={device} 
            onClick={onSelectDevice}
            onDelete={onDeleteDevice}
            onRename={onRenameDevice}
            showMonitoringInfo={showMonitoringInfo}
            hoverOverlayText={hoverOverlayText}
          />
        ))}
      </div>
    </div>
  );
};
