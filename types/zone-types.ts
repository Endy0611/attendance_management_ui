export interface ZoneRequest {
  name: string;
  latitude?: number;
  longitude?: number;
  radiusMeters?: number;
}

export interface ZoneResponse {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  createdBy: string;
  createdByName: string;
  createdAt: string;
}
