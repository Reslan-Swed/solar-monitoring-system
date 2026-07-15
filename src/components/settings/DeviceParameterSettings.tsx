import React, { useState, useEffect } from 'react';
import { Device } from '@/src/types';
import { api } from '@/src/lib/api';
import { PARAMETER_DICTIONARY, parseParamValue, ParameterDefinition } from '@/src/lib/parameter-dictionary';
import { ArrowLeft, Save, RefreshCw, ChevronUp, ChevronDown, Check, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface DeviceParameterSettingsProps {
  device: Device;
  onBack: () => void;
  onUpdateCapacity?: (deviceSn: string, capacity: number) => void;
}

export const DeviceParameterSettings: React.FC<DeviceParameterSettingsProps> = ({ device, onBack, onUpdateCapacity }) => {
  const [params, setParams] = useState<Record<string, string>>({});
  const [initialParams, setInitialParams] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [batteryCapacity, setBatteryCapacity] = useState(String(device.batteryCapacity || 2.5));

  const fetchParams = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getDeviceParams(device.deviceSn);
      setParams(data);
      setInitialParams(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load parameters');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchParams();
  }, [device.deviceSn]);

  const handleUpdateParam = (name: string, newValue: string) => {
    setParams(prev => ({ ...prev, [name]: newValue }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const commands: Record<string, string> = {};
      let index = 1;

      // Find changed parameters
      for (const [key, value] of Object.entries(params)) {
        const initialVal = parseParamValue(String(initialParams[key] || '')).current;
        const currentVal = parseParamValue(String(value)).current;

        if (initialVal !== currentVal) {
          const dictItem = PARAMETER_DICTIONARY.find(d => d.name === key);
          if (dictItem) {
            const commandKey = `S0${index}`;
            commands[commandKey] = dictItem.command(currentVal);
            index++;
          }
        }
      }

      if (Object.keys(commands).length > 0) {
        await api.setDeviceParams(device.deviceSn, commands);
      }

      // Handle local battery capacity saving
      if (onUpdateCapacity) {
        onUpdateCapacity(device.deviceSn, parseFloat(batteryCapacity) || 2.5);
      }

      setSuccess(true);
      setInitialParams({ ...params });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
        <p className="text-slate-500 dark:text-slate-400 animate-pulse">Fetching device parameters...</p>
      </div>
    );
  }

  const availableParams = PARAMETER_DICTIONARY.filter(d => params[d.name] !== undefined);
  
  const groups = availableParams.reduce((acc, param) => {
    const groupName = param.groupName || 'other';
    if (!acc[groupName]) acc[groupName] = [];
    acc[groupName].push(param);
    return acc;
  }, {} as Record<string, ParameterDefinition[]>);

  const groupLabels: Record<string, string> = {
    'buzzer': 'System Alerts & Buzzer',
    'battery': 'Battery & Charging Configuration',
    'grid': 'Grid & AC Input Settings',
    'pv': 'Solar & PV Management',
    'output': 'Output & Load Priority',
    'other': 'Display & System Preferences',
    'local': 'Local Monitoring Settings'
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"
          >
            <ArrowLeft className="w-6 h-6 text-slate-600 dark:text-slate-400" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Device Parameters</h2>
            <p className="text-slate-500 dark:text-slate-400">Configure {device.name} settings ({device.deviceSn})</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={fetchParams}
            disabled={isLoading || isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
            Refresh
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="flex items-center gap-2 px-6 py-2 bg-amber-500 text-white rounded-xl text-sm font-bold hover:bg-amber-600 transition-all shadow-lg shadow-amber-200 dark:shadow-none disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </motion.div>
      )}

      {success && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-4 rounded-xl flex items-center gap-3 text-emerald-600 dark:text-emerald-400"
        >
          <Check className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">Settings updated successfully!</span>
        </motion.div>
      )}

      <div className="space-y-12">
        {/* Local Settings Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-2">
              {groupLabels['local']}
            </h3>
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Battery Capacity (kW)</label>
              <div className="relative group">
                <input 
                  type="number"
                  step="0.1"
                  value={batteryCapacity}
                  onChange={(e) => setBatteryCapacity(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white font-bold"
                />
                <div className="mt-2 text-[10px] text-slate-500 dark:text-slate-400 italic">
                  Used for estimating battery duration during discharge. Default is 2.5 kW.
                </div>
              </div>
            </div>
          </div>
        </div>

        {Object.entries(groups).map(([groupName, groupParams]) => (
          <div key={groupName} className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-2">
                {groupLabels[groupName] || groupName}
              </h3>
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {groupParams.map((def) => (
                <ParameterInput 
                  key={def.name}
                  definition={def}
                  rawValue={params[def.name]}
                  onChange={(val) => handleUpdateParam(def.name, val)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface ParameterInputProps {
  definition: ParameterDefinition;
  rawValue: string;
  onChange: (val: string) => void;
}

const ParameterInput: React.FC<ParameterInputProps> = ({ definition, rawValue, onChange }) => {
  const parsed = parseParamValue(rawValue);
  const value = parsed.current;
  const optionLabelOf = it => definition.getOptionLabel ? definition.getOptionLabel(it) : it;

  // Render logic for different input types
  if (parsed.options && !parsed.range) {
    // Predefined List
    return (
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">{definition.label}</label>
        <div className="relative">
          <select 
            value={value}
            onChange={(e) => {
              const newRaw = e.target.value + (rawValue.split(' ').length > 1 ? ' ' + rawValue.split(' ')[1] : '');
              onChange(newRaw);
            }}
            className="w-full appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white cursor-pointer transition-all"
          >
            {parsed.options.map(opt => (
              <option key={opt} value={opt}>
                {optionLabelOf(opt)}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </div>
    );
  }

  if (parsed.range) {
    // Range or Mix
    const handleStep = (direction: number) => {
      const min = parsed.range?.min || 0;
      const max = parsed.range?.max || 9999;
      const currentNum = Number(value);
      const step = definition.step || 1;

      let nextNum: number;
      
      // If the current value is one of the predefined options or out of range,
      // we reset to the range minimum to "start over" as requested.
      const isOption = parsed.options?.includes(value);
      const isOutOfRange = currentNum < min || currentNum > max;

      if (isOutOfRange || (isOption && currentNum !== min)) {
        nextNum = min;
      } else {
        nextNum = currentNum + (direction * step);
      }

      if (nextNum < min) nextNum = min;
      if (nextNum > max) nextNum = max;

      const newRaw = nextNum.toString() + (rawValue.split(' ').length > 1 ? ' ' + rawValue.split(' ')[1] : '');
      onChange(newRaw);
    };

    return (
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">{definition.label}</label>
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <input 
              type="text"
              readOnly
              value={optionLabelOf(value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none text-slate-900 dark:text-white"
            />
            {parsed.range && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 uppercase">
                {optionLabelOf(parsed.range.min) + ' - ' + optionLabelOf(parsed.range.max)}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <button 
              onClick={() => handleStep(1)}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button 
              onClick={() => handleStep(-1)}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>
        {parsed.options && parsed.options.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {parsed.options.map(opt => (
              <button
                key={opt}
                onClick={() => {
                  const newRaw = opt + (rawValue.split(' ').length > 1 ? ' ' + rawValue.split(' ')[1] : '');
                  onChange(newRaw);
                }}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold transition-all",
                  value === opt 
                    ? "bg-amber-500 text-white" 
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                )}
              >
                {optionLabelOf(opt)}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Boolean or Simple
  if (value === "0" || value === "1") {
    const isChecked = value === "1";
    return (
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md flex items-center justify-between">
        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{definition.label}</label>
        <button 
          onClick={() => {
            const nextVal = value === "1" ? "0" : "1";
            const newRaw = nextVal + (rawValue.split(' ').length > 1 ? ' ' + rawValue.split(' ')[1] : '');
            onChange(newRaw);
          }}
          className={cn(
            "relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none flex-shrink-0",
            isChecked ? "bg-amber-500" : "bg-slate-300 dark:bg-slate-700"
          )}
        >
          <motion.div 
            animate={{ x: isChecked ? 24 : 0 }}
            initial={false}
            className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm"
          />
        </button>
      </div>
    );
  }

  // Fallback / Text input
  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">{definition.label}</label>
      <input 
        type="text"
        value={value}
        onChange={(e) => {
          const newRaw = e.target.value + (rawValue.split(' ').length > 1 ? ' ' + rawValue.split(' ')[1] : '');
          onChange(newRaw);
        }}
        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
      />
    </div>
  );
};
