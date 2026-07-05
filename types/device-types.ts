export interface BindDeviceRequest {
  fingerprint: string;
  deviceInfo: string;
}

export interface DeviceResponse {
  id: string;
  deviceInfo: string;
  createdAt: string;
}
