import CryptoJS from 'crypto-js';
import { ApiResponse, LoginData, DeviceListResponse, TelemetryData, HistoricalDataResponse, EventLogResponse, DeviceRateData } from '../api-types';
import { hex_md5 } from './crypto';

const BASE_URL = 'https://www.tumcapp.com/app/api/mobile/';

class ApiClient {
  private token: string | null = null;
  private vrtKey: string | null = null;

  setAuth(token: string, vrtKey: string) {
    this.token = token;
    this.vrtKey = vrtKey;
  }

  getAuth() {
    return { token: this.token, vrtKey: this.vrtKey };
  }

  private calculateVrt(data: Record<string, any>): string {
    if (!this.vrtKey) return '';

    // 1. Create data string (User says: "don't encode things like space or colon")
    // We sort the keys alphabetically for consistency
    const dataString = Object.entries(data)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('&');

    // 2 & 3. Calculate character sum
    let h = 0;
    for (let i = 0; i < dataString.length; i++) {
      h += dataString.charCodeAt(i);
    }

    // 4. Convert to string
    const a = String(h);

    // 5. SHA-256 hash the sum
    const hashA = CryptoJS.SHA256(a).toString();

    // 6. Extract 8-character segments
    const b = hashA.slice(-8);
    const y = hashA.slice(0, 8);

    // 7. Concatenate
    const S = this.vrtKey + b + y;

    // 8. Final SHA-256
    return CryptoJS.SHA256(S).toString();
  }

  async get<T>(endpoint: string, data: Record<string, any>, useAuth = true): Promise<T> {
    const queryString = Object.entries(data)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
    
    const url = `${BASE_URL}${endpoint}${queryString ? `?${queryString}` : ''}`;
    
    const headers: Record<string, string> = {};
    if (useAuth && this.token) {
      headers['token'] = this.token;
      headers['vrt'] = this.calculateVrt(data);
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    const result: ApiResponse<T> = await response.json();
    if (result.code !== 0) {
      throw new Error(result.message || `API Error: ${result.code}`);
    }
    return result.data;
  }

  async post<T>(endpoint: string, data: Record<string, any>, useAuth = true): Promise<T> {
    // Create raw data string for the body (unencoded, as per user requirement for VRT consistency)
    const body = Object.entries(data)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('&');

    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    if (useAuth && this.token) {
      headers['token'] = this.token;
      headers['vrt'] = this.calculateVrt(data);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body,
    });

    const result: ApiResponse<T> = await response.json();

    if (result.code !== 0) {
      throw new Error(result.message || `API Error: ${result.code}`);
    }

    return result.data;
  }

  async login(username: string, password: string): Promise<LoginData> {
    const encodedPassword = hex_md5(password);
    const data = await this.post<LoginData>('user/login', { username, password: encodedPassword }, false);
    this.setAuth(data.token, data.vrtKey);
    return data;
  }

  async sendOtp(email: string): Promise<number> {
    return this.post<number>('user/gmail', { email }, false);
  }

  async verifyOtp(email: string, code: string): Promise<void> {
    await this.post('user/emailCode', { mail: email, mailCode: code }, false);
  }

  async emailLogin(email: string): Promise<LoginData> {
    const data = await this.post<LoginData>('user/emailLogin', { email }, false);
    this.setAuth(data.token, data.vrtKey);
    return data;
  }

  async getDevices(page = 1): Promise<DeviceListResponse> {
    return this.post<DeviceListResponse>('deviceUser/getMyDevice', {
      groupId: 0,
      pageSize: 20,
      pageNum: page,
      openPage: 1
    });
  }

  async getRealTimeTelemetry(deviceSn: string): Promise<TelemetryData> {
    return this.post<TelemetryData>('realData/getRealByDeviceSn', { deviceSn });
  }

  async getHistoricalData(params: {
    deviceSn: string;
    startDate: string;
    endDate: string;
    pageNum: number;
    pageSize: number;
  }): Promise<HistoricalDataResponse> {
    return this.post<HistoricalDataResponse>('workInfo/getHistoricalData', params);
  }

  async getEventLogs(params: {
    deviceSn: string;
    startDate: string;
    endDate: string;
    pageNum: number;
    pageSize: number;
  }): Promise<EventLogResponse> {
    return this.post<EventLogResponse>('eventNew/page', params);
  }

  async getDeviceRate(deviceSn: string): Promise<DeviceRateData> {
    return this.post<DeviceRateData>('rate/getRate', { deviceSn });
  }

  async getDeviceParams(deviceSn: string): Promise<Record<string, any>> {
    return this.post<Record<string, any>>('paramSet/getParam', { deviceSn });
  }

  async setDeviceParams(deviceSn: string, commands: Record<string, string>): Promise<void> {
    await this.post('paramSet/setParam', { 
      deviceSn, 
      commands: JSON.stringify(commands) 
    });
  }

  async calculateDeviceSns(devSn: string): Promise<string> {
    // Step 1: Construct the input string
    const inputString = "Voltronic" + devSn + "Power";
    
    // Step 2: Apply SHA256 hash using Web Crypto API
    const encoder = new TextEncoder();
    const data = encoder.encode(inputString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    
    // Step 3: Convert hash to hexadecimal string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Step 4: Extract last 16 characters
    const last16Chars = hashHex.substring(hashHex.length - 16);
    
    // Step 5: Format and return the final value
    return devSn + "-" + last16Chars;
  }

  async addDevice(deviceSn: string): Promise<void> {
    const calculatedSn = await this.calculateDeviceSns(deviceSn);
    await this.post('device/addDevices', {
      groupId: 0,
      deviceSns: calculatedSn
    });
  }

  async updateDeviceNickName(deviceSn: string, nickName: string): Promise<void> {
    await this.post('deviceUser/updateNickName', { deviceSn, nickName });
  }

  async deleteDevice(id: number): Promise<void> {
    await this.post('device/deleteById', { id });
  }

  async register(payload: { userName: string; password: string; mail: string; nickName: string }): Promise<void> {
    const encodedPassword = hex_md5(payload.password);
    await this.post('user/register', { ...payload, password: encodedPassword }, false);
  }

  async logout(): Promise<void> {
    try {
      await this.post('user/logout', {});
    } finally {
      this.token = null;
      this.vrtKey = null;
    }
  }

  async updateUserInfo(data: { mail?: string; nickName?: string }): Promise<void> {
    await this.post('user/updateUserInfo', data);
  }

  async updatePassword(oldPassword: string, newPassword: string): Promise<void> {
    const encodedOld = hex_md5(oldPassword);
    const encodedNew = hex_md5(newPassword);
    await this.post('user/updatePassword', { 
      oldPassword: encodedOld, 
      newPassword: encodedNew 
    });
  }

  async deleteMe(password: string): Promise<void> {
    const encodedPassword = hex_md5(password);
    await this.post('user/deleteMe', { password: encodedPassword });
  }

  async resetPassword(mail: string, password: string): Promise<void> {
    const encodedPassword = hex_md5(password);
    await this.post('user/updateEmail', { mail, password: encodedPassword }, false);
  }

  async downloadHistoricalExcel(deviceSn: string, queryParams: Record<string, string>): Promise<Blob> {
    const data = { deviceSn, ...queryParams };
    const queryString = Object.entries(data)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
    
    const url = `${BASE_URL}excel/Download?${queryString}`;
    
    const headers: Record<string, string> = {};
    if (this.token) {
      headers['token'] = this.token;
      headers['vrt'] = this.calculateVrt(data);
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error('Download failed');
    }

    return response.blob();
  }
}

export const api = new ApiClient();
