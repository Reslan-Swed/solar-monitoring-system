export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface LoginData {
  userInfo: {
    id: number;
    userName: string;
    nickName: string;
    mail: string;
    vrtKey: string;
    [key: string]: any;
  };
  token: string;
  vrtKey: string;
}

export interface DeviceListItem {
  id: number;
  userId: number;
  status: number;
  nickName: string;
  deviceSn: string;
  onlineStatus: number;
  acOutputActivePowerR: string;
  acOutputActivePowerTotal: string;
  pvInputPower: string;
  timezone: string;
  nation: string;
  [key: string]: any;
}

export interface DeviceListResponse {
  pageNum: number;
  pageSize: number;
  size: number;
  pages: number;
  total: number;
  list: DeviceListItem[];
  onlineSum: number;
  offlineSum: number;
}

export interface TelemetryData {
  id: number;
  pvInputPower1: string;
  pvInputVoltage1: string;
  batteryDischargingPower: string;
  batteryVoltage: string;
  batteryCapacity: string;
  acOutputVoltageR: string;
  acOutputFrequency: string;
  dischargingCurrent: string;
  chargingCurrent: string;
  gridVoltageR: string;
  gridFrequency: string;
  maxTemperature: string;
  innerTemperature: string;
  acOutputLoadTotal: string;
  acOutputActivePowerTotal: number;
  acOutputApparentPowerTotal: number;
  gridPowerInputActiveTotal: string;
  workMode: string;
  currentInput1: string;
  generatorInputVoltage: string;
  generatorInputFrequency: string;
  output2Voltage: string;
  output2Frequency: string;
  deviceSn: string;
  currentTime: string;
  createTime: string;
  [key: string]: any;
}

export interface HistoricalDataItem extends TelemetryData {
  fault1: string;
  workMode: string;
}

export interface HistoricalDataResponse {
  pageNum: number;
  pageSize: number;
  size: number;
  pages: number;
  total: number;
  list: HistoricalDataItem[];
}

export interface EventLogItem {
  id: number;
  deviceSn: string;
  eventType: number; // 1: Fault, 2: Warning, 3: Info
  eventCode: string;
  eventStatus: number;
  eventInfo: string | null;
  occurrenceTime: string;
  extinctionTime: string | null;
  prodId: string;
  subId: string;
  timeZone: string;
}

export interface EventLogResponse {
  total: number;
  list: EventLogItem[];
  pageNum: number;
  pageSize: number;
  pages: number;
}

export interface DeviceRateData {
  id: number;
  deviceSn: string;
  mainVersion: string;
  slaveVersion: string;
  remoteVersion: string;
  relayCpuVersion: string;
  inputVoltage: number;
  outputVoltage: number;
  outputFrenquency: number;
  batteryVoltage: number;
  outputPowerVa: number;
  outputPowerW: number;
  mpptTrack: number;
  voltageMaxDefault: number;
  voltageFloatDefault: number;
  wifiVersion: string;
  prodId: string;
  subId: string;
  timezone: string;
  nation: string;
}

export interface GetRateResponse {
  code: number;
  message: string;
  data: DeviceRateData;
}
