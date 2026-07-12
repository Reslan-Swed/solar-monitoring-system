/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { User, Device, MonitoringData, Alert, DeviceSettings } from './types';
import { api } from './lib/api';
import { LoginData, DeviceListItem, EventLogItem } from './api-types';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { ForgotPasswordForm } from './components/auth/ForgotPasswordForm';
import { Sidebar } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { cn } from './lib/utils';
import { Zap } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { DeviceList } from './components/dashboard/DeviceList';
import { DeviceRateModal } from './components/dashboard/DeviceRateModal';
import { AddDeviceModal } from './components/dashboard/AddDeviceModal';
import { RealTimeMonitor } from './components/monitoring/RealTimeMonitor';
import { HistoryView } from './components/monitoring/HistoryView';
import { AlertsView } from './components/monitoring/AlertsView';
import { SettingsForm } from './components/settings/SettingsForm';
import { motion, AnimatePresence } from 'motion/react';

// --- MOCK DATA ---
const MOCK_USER: User = {
  id: 'u1',
  name: 'Alex Rivera',
  username: 'arivera',
  email: 'alex@solar-intel.com',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
};

const MOCK_DEVICES: Device[] = [
  { id: 'd1', name: 'Main Roof Array A', deviceSn: 'SN001', type: 'panel', status: 'online', pvOutput: 4200, currentOutput: 1240, efficiency: 98, location: 'Sector 4, Roof', lastUpdated: '2 mins ago', batteryCapacity: 85, workMode: 'Line mode' },
  { id: 'd2', name: 'East Wing Inverter', deviceSn: 'SN002', type: 'inverter', status: 'warning', pvOutput: 3800, currentOutput: 850, efficiency: 82, location: 'East Hall', lastUpdated: '5 mins ago', batteryCapacity: 42, workMode: 'Battery mode' },
  { id: 'd3', name: 'Storage Battery 5kWh', deviceSn: 'SN003', type: 'battery', status: 'online', pvOutput: 500, currentOutput: 2400, efficiency: 95, location: 'Basement', lastUpdated: 'Just now', batteryCapacity: 98, workMode: 'Charge mode' },
  { id: 'd4', name: 'South Garden Panels', deviceSn: 'SN004', type: 'panel', status: 'online', pvOutput: 2100, currentOutput: 450, efficiency: 92, location: 'Ground Level', lastUpdated: '10 mins ago', batteryCapacity: 100, workMode: 'Line mode' },
  { id: 'd5', name: 'West Gate Array', deviceSn: 'SN005', type: 'panel', status: 'offline', pvOutput: 0, currentOutput: 0, efficiency: 0, location: 'West Gate', lastUpdated: '1 hour ago', batteryCapacity: 0, workMode: 'Standby mode' },
];

const MOCK_ALERTS: Alert[] = [
  { id: 'a1', deviceId: 'd2', deviceName: 'East Wing Inverter', severity: 'medium', message: 'Inverter efficiency dropped below 85%. Possible dust accumulation detected.', timestamp: '10:45 AM', isRead: false },
  { id: 'a2', deviceId: 'd5', deviceName: 'West Gate Array', severity: 'high', message: 'Communication failure. Device reported as offline.', timestamp: '08:20 AM', isRead: false },
  { id: 'a3', deviceId: 'd1', deviceName: 'Main Roof Array A', severity: 'low', message: 'Peak output reached. Optimal performance.', timestamp: 'Yesterday', isRead: true },
];

const MOCK_SETTINGS: DeviceSettings = {
  updateFrequency: 5,
  efficiencyThreshold: 85,
  notificationEnabled: true,
  alertOnOffline: true,
  theme: 'light',
};

const mapApiDeviceToDevice = (item: DeviceListItem): Device => {
  const getWorkModeLabel = (mode: string) => {
    const modes: Record<string, string> = {
      P: "Power on",
      S: "Standby",
      L: "Line",
      B: "Battery",
      Y: "Bypass",
      E: "ECO",
      F: "Fault",
      H: "Power saving",
      C: "Charge"
    };
    return modes[mode] || mode;
  };

  return {
    id: String(item.id),
    name: item.nickName || `Device ${item.deviceSn}`,
    deviceSn: item.deviceSn,
    type: 'inverter',
    status: item.onlineStatus === 1 ? 'online' : 'offline',
    pvOutput: parseFloat(item.pvInputPower) || 0,
    currentOutput: parseFloat(item.acOutputActivePowerTotal) || 0,
    efficiency: 95,
    location: item.nation || 'Unknown',
    lastUpdated: 'Just now',
    batteryCapacity: parseFloat(item.batteryCapacity) || 0,
    workMode: getWorkModeLabel(item.workMode)
  };
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [historyDevice, setHistoryDevice] = useState<Device | null>(null);
  const [rateDevice, setRateDevice] = useState<Device | null>(null);
  const [isAddingDevice, setIsAddingDevice] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>(MOCK_ALERTS);
  const [latestAlert, setLatestAlert] = useState<EventLogItem | null>(null);
  const [settings, setSettings] = useState<DeviceSettings>(() => {
    try {
      const saved = localStorage.getItem('appSettings');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...MOCK_SETTINGS, ...parsed };
      }
    } catch (e) {
      console.error('Failed to load settings', e);
    }
    return { ...MOCK_SETTINGS };
  });

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.theme]);

  // Load settings from localStorage whenever the user state changes (e.g., after login)
  useEffect(() => {
    if (user) {
      try {
        const saved = localStorage.getItem('appSettings');
        if (saved) {
          const parsed = JSON.parse(saved);
          setSettings({ ...MOCK_SETTINGS, ...parsed });
        }
      } catch (e) {
        console.error('Failed to load settings on login', e);
      }
    }
  }, [user]);

  const handleUpdateSettings = (newSettings: DeviceSettings) => {
    setSettings(newSettings);
    localStorage.setItem('appSettings', JSON.stringify(newSettings));
  };

  const handlePreviewTheme = (theme: 'light' | 'dark') => {
    setSettings(prev => ({ ...prev, theme }));
    
    // Actually apply the theme class immediately for the preview
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDevices = async (isBackground = false) => {
    if (isBackground) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const response = await api.getDevices();
      const mapped = response.list.map(mapApiDeviceToDevice);
      setDevices(mapped);
    } catch (err) {
      console.error('Failed to fetch devices', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleDeleteDevice = async (id: string) => {
    try {
      const numericId = parseInt(id, 10);
      if (isNaN(numericId)) {
        // If it's a mock device (e.g., 'd1'), just remove it from local state
        setDevices(prev => prev.filter(d => d.id !== id));
        if (rateDevice?.id === id) setRateDevice(null);
        return;
      }
      await api.deleteDevice(numericId);
      fetchDevices();
      if (rateDevice?.id === id) setRateDevice(null);
    } catch (err) {
      console.error('Failed to delete device', err);
    }
  };

  const handleRenameDevice = async (deviceSn: string, name: string) => {
    // This is a fallback if called from DeviceCard directly
    // Usually DeviceRateModal handles its own rename and calls onSuccess
    try {
      await api.updateDeviceNickName(deviceSn, name);
      fetchDevices();
    } catch (err) {
      console.error('Failed to rename device', err);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchDevices();

    // Periodically refresh devices every 1 minute to track online/offline status
    const interval = setInterval(() => fetchDevices(true), 60000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (!user || devices.length === 0) return;

    const fetchLatestAlert = async () => {
      try {
        const targetDevice = selectedDevice || devices[0];
        if (!targetDevice) return;

        const response = await api.getEventLogs({
          deviceSn: targetDevice.deviceSn,
          startDate: format(subDays(new Date(), 7), 'yyyy-MM-dd HH:mm:ss'),
          endDate: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
          pageNum: 1,
          pageSize: 20
        });

        // Find the latest active alert (extinctionTime is null)
        const activeAlerts = response.list.filter(a => !a.extinctionTime);
        if (activeAlerts.length > 0) {
          // Sort by occurrenceTime descending just in case
          const sorted = activeAlerts.sort((a, b) =>
            new Date(b.occurrenceTime).getTime() - new Date(a.occurrenceTime).getTime()
          );
          setLatestAlert(sorted[0]);
        } else {
          setLatestAlert(null);
        }
      } catch (err) {
        console.error('Failed to fetch latest alert', err);
      }
    };

    fetchLatestAlert();
    const interval = setInterval(fetchLatestAlert, 60000); // Poll every minute
    return () => clearInterval(interval);
  }, [user, devices, selectedDevice]);

  const handleLogin = (data: LoginData) => {
    setUser({
      id: String(data.userInfo.id),
      name: data.userInfo.nickName || data.userInfo.userName,
      username: data.userInfo.userName,
      email: data.userInfo.mail,
    });
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (err) {
      console.error('Logout failed', err);
    } finally {
      setUser(null);
      setSelectedDevice(null);
      setActiveTab('dashboard');
    }
  };

  const handleMarkAlertRead = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, isRead: true } : a));
  };

  const currentTitle = useMemo(() => {
    if (selectedDevice) return `Monitoring: ${selectedDevice.name}`;
    return activeTab.replace(/([A-Z])/g, ' $1');
  }, [activeTab, selectedDevice]);

  if (!user) {
    if (isRegistering) {
      return (
        <RegisterForm
          onBackToLogin={() => setIsRegistering(false)}
          onSuccess={() => setIsRegistering(false)}
        />
      );
    }
    if (isForgotPassword) {
      return (
        <ForgotPasswordForm
          onBackToLogin={() => setIsForgotPassword(false)}
        />
      );
    }
    return (
      <LoginForm
        onLogin={handleLogin}
        onRegisterClick={() => setIsRegistering(true)}
        onForgotPasswordClick={() => setIsForgotPassword(true)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setSelectedDevice(null);
          setHistoryDevice(null);
        }}
        onLogout={handleLogout}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      <div className={cn(
        "flex flex-col min-h-screen transition-all duration-300",
        isSidebarCollapsed ? "lg:pl-20" : "lg:pl-64"
      )}>
        <Navbar 
          user={user} 
          title={currentTitle} 
          latestAlert={latestAlert} 
          onMenuClick={() => setIsSidebarOpen(true)}
          isSidebarCollapsed={isSidebarCollapsed}
        />

        <main className="flex-1 pt-24 pb-0 px-4 sm:px-8 max-w-[1600px] mx-auto w-full flex flex-col">
          <div className="flex-1 pb-12">
            {isLoading && (
              <div className="fixed inset-0 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center transition-colors">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-amber-900 dark:text-amber-200 font-bold">Synchronizing Assets...</p>
                </div>
              </div>
            )}
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedDevice?.id || activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {selectedDevice ? (
                  <RealTimeMonitor
                    device={selectedDevice}
                    onBack={() => setSelectedDevice(null)}
                  />
                ) : (
                  <>
                    {activeTab === 'dashboard' && (
                      <>
                        <DeviceList
                          devices={devices}
                          onSelectDevice={setRateDevice}
                          onDeleteDevice={handleDeleteDevice}
                          onRenameDevice={handleRenameDevice}
                          onAddDevice={() => setIsAddingDevice(true)}
                          onRefresh={() => fetchDevices(true)}
                          isRefreshing={isRefreshing}
                        />
                        <AnimatePresence>
                          {rateDevice && (
                            <DeviceRateModal
                              device={rateDevice}
                              onClose={() => setRateDevice(null)}
                              onDelete={handleDeleteDevice}
                              onRename={(sn, name) => {
                                fetchDevices();
                                setRateDevice(null);
                              }}
                            />
                          )}
                          {isAddingDevice && (
                            <AddDeviceModal
                              onClose={() => setIsAddingDevice(false)}
                              onSuccess={fetchDevices}
                            />
                          )}
                        </AnimatePresence>
                      </>
                    )}
                    {activeTab === 'monitoring' && (
                      <DeviceList
                        devices={devices}
                        onSelectDevice={setSelectedDevice}
                        onDeleteDevice={handleDeleteDevice}
                        onRenameDevice={handleRenameDevice}
                        onRefresh={() => fetchDevices(true)}
                        isRefreshing={isRefreshing}
                        title="Select Asset to Monitor"
                        subtitle="Choose a device to view real-time telemetry and diagnostics"
                        showMonitoringInfo={true}
                      />
                    )}
                    {activeTab === 'history' && (
                      historyDevice ? (
                        <HistoryView
                          device={historyDevice}
                          onBack={() => setHistoryDevice(null)}
                        />
                      ) : (
                        <DeviceList
                          devices={devices}
                          onSelectDevice={setHistoryDevice}
                          onDeleteDevice={handleDeleteDevice}
                          onRenameDevice={handleRenameDevice}
                          onRefresh={() => fetchDevices(true)}
                          isRefreshing={isRefreshing}
                          title="View Historical Logs"
                          subtitle="Select a device to analyze past performance and telemetry history"
                          hoverOverlayText="Show Device Logs"
                        />
                      )
                    )}
                    {activeTab === 'alerts' && (
                      <AlertsView
                        device={selectedDevice || (devices.length > 0 ? devices[0] : null)}
                      />
                    )}
                    {activeTab === 'settings' && (
                      <SettingsForm
                        settings={settings}
                        onSave={handleUpdateSettings}
                        onPreviewTheme={handlePreviewTheme}
                        user={user}
                        onUserUpdate={(updated) => setUser(prev => prev ? { ...prev, ...updated } : null)}
                        onLogout={handleLogout}
                      />
                    )}
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}

