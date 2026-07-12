import React, { useEffect, useState } from 'react';
import { DeviceRateData } from '@/src/api-types';
import { Device } from '@/src/types';
import { api } from '@/src/lib/api';
import { X, Cpu, Zap, Activity, Info, Settings, ShieldCheck, Wifi, Globe, Clock, Trash2, Edit2, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';

interface DeviceRateModalProps {
  device: Device;
  onClose: () => void;
  onDelete: (id: string) => void;
  onRename: (deviceSn: string, name: string) => void;
}

export const DeviceRateModal: React.FC<DeviceRateModalProps> = ({ device, onClose, onDelete, onRename }) => {
  const [data, setData] = useState<DeviceRateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(device.name);
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (confirmDelete) {
      timer = setTimeout(() => setConfirmDelete(false), 3000);
    }
    return () => clearTimeout(timer);
  }, [confirmDelete]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await api.getDeviceRate(device.deviceSn);
        setData(result);
      } catch (err) {
        setError('Failed to fetch rating information');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [device.deviceSn]);

  const handleRename = async () => {
    if (!newName.trim() || newName === device.name) {
      setIsEditingName(false);
      return;
    }

    setIsUpdatingName(true);
    try {
      await api.updateDeviceNickName(device.deviceSn, newName);
      onRename(device.deviceSn, newName);
      setIsEditingName(false);
    } catch (err) {
      console.error('Failed to update nickname', err);
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete(device.id);
    } finally {
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-transparent dark:border-slate-800"
      >
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex-grow">
            {isEditingName ? (
              <div className="flex items-center gap-2 max-w-md">
                <input 
                  type="text"
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-lg font-bold outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 dark:text-white transition-all w-full"
                />
                <button 
                  onClick={handleRename}
                  disabled={isUpdatingName}
                  className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
                >
                  {isUpdatingName ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                </button>
                <button 
                  onClick={() => { setIsEditingName(false); setNewName(device.name); }}
                  className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{device.name}</h2>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setIsEditingName(true)}
                    className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-all"
                    title="Edit Nickname"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-sm font-bold",
                      confirmDelete 
                        ? "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-200 dark:shadow-red-900/20 animate-pulse" 
                        : "text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    )}
                    title={confirmDelete ? "Click again to confirm" : "Delete Device"}
                  >
                    {isDeleting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : confirmDelete ? (
                      <>
                        <Trash2 className="w-4 h-4" />
                        <span>Confirm?</span>
                      </>
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            )}
            <p className="text-sm text-slate-500 dark:text-slate-400 font-mono mt-1">SN: {device.deviceSn}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 self-start"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
              <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-500 dark:text-slate-400 font-medium">Retrieving Rating Data...</p>
            </div>
          ) : error ? (
            <div className="py-20 text-center">
              <Info className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-slate-900 dark:text-white font-bold">{error}</p>
              <button onClick={onClose} className="mt-4 px-6 py-2 bg-slate-100 dark:bg-slate-800 dark:text-white rounded-lg font-bold">Close</button>
            </div>
          ) : data && (
            <div className="space-y-8">
              {/* Product Info */}
              <section>
                <div className="flex items-center gap-2 mb-4 text-amber-600 dark:text-amber-500">
                  <ShieldCheck className="w-5 h-5" />
                  <h3 className="font-bold uppercase tracking-wider text-xs">Product Information</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoItem label="Main Firmware" value={data.mainVersion} icon={<Cpu className="w-4 h-4" />} />
                  <InfoItem label="Comm Firmware" value={data.remoteVersion} icon={<Settings className="w-4 h-4" />} />
                  <InfoItem label="Slave Firmware" value={data.slaveVersion === 'null' ? 'N/A' : data.slaveVersion} icon={<Cpu className="w-4 h-4" />} />
                  <InfoItem label="Wifi Version" value={data.wifiVersion} icon={<Wifi className="w-4 h-4" />} valueClassName="text-[10px]" />
                </div>
              </section>

              {/* Rating Information */}
              <section>
                <div className="flex items-center gap-2 mb-4 text-indigo-600 dark:text-indigo-400">
                  <Zap className="w-5 h-5" />
                  <h3 className="font-bold uppercase tracking-wider text-xs">Rating Information</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <StatItem label="Input Rated" value={data.inputVoltage} unit="V" />
                  <StatItem label="Output Rated" value={data.outputVoltage} unit="V" />
                  <StatItem label="Rated Power" value={data.outputPowerW} unit="W" />
                  <StatItem label="Rated Apparent" value={data.outputPowerVa} unit="VA" />
                  <StatItem label="Battery Rated" value={data.batteryVoltage} unit="V" />
                  <StatItem label="Rated Freq" value={(data.outputFrenquency / 100).toFixed(1)} unit="Hz" />
                </div>
              </section>

              {/* Operational Defaults */}
              <section>
                <div className="flex items-center gap-2 mb-4 text-emerald-600 dark:text-emerald-500">
                  <Activity className="w-5 h-5" />
                  <h3 className="font-bold uppercase tracking-wider text-xs">Operational Parameters</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoItem label="MPPT Tracks" value={data.mpptTrack} />
                  <InfoItem label="Float Voltage" value={`${data.voltageFloatDefault} V`} />
                  <InfoItem label="Max Voltage" value={`${data.voltageMaxDefault} V`} />
                  <InfoItem label="Timezone" value={data.timezone} icon={<Clock className="w-4 h-4" />} />
                </div>
              </section>
              
              <div className="pt-6 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                <div className="flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  Nation: {data.nation}
                </div>
                <div>ID: {data.id}</div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const InfoItem = ({ label, value, icon, valueClassName }: { label: string, value: any, icon?: React.ReactNode, valueClassName?: string }) => (
  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
    <div className="flex items-center gap-2">
      {icon && <span className="text-slate-400 dark:text-slate-500">{icon}</span>}
      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">{label}</span>
    </div>
    <span className={cn("font-bold text-slate-900 dark:text-white text-sm", valueClassName)}>{value}</span>
  </div>
);

const StatItem = ({ label, value, unit }: { label: string, value: any, unit: string }) => (
  <div className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm">
    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">{label}</p>
    <p className="text-xl font-black text-slate-900 dark:text-white">
      {value} <span className="text-xs font-bold text-slate-400 dark:text-slate-500">{unit}</span>
    </p>
  </div>
);

