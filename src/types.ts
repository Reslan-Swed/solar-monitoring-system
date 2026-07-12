export type User = {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar?: string;
};

export type DeviceStatus = 'online' | 'offline' | 'warning' | 'error';

export type Device = {
  id: string;
  name: string;
  deviceSn: string;
  type: 'panel' | 'inverter' | 'battery';
  status: DeviceStatus;
  pvOutput: number; // in Watt
  currentOutput: number; // in Watt
  efficiency: number; // percentage
  location: string;
  lastUpdated: string;
  batteryCapacity?: number;
  workMode?: string;
};

export type MonitoringData = {
  timestamp: string;
  power: number;
  voltage: number;
  current: number;
  temperature: number;
};

export type Alert = {
  id: string;
  deviceId: string;
  deviceName: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
  timestamp: string;
  isRead: boolean;
};

export type DeviceSettings = {
  updateFrequency: number;
  efficiencyThreshold: number;
  notificationEnabled: boolean;
  alertOnOffline: boolean;
};
