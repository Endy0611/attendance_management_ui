export interface GroupSessionResponse {
  id: string;
  groupId: string;
  groupName: string;
  courseCode: string;
  zoneId: string;
  zoneName: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  startTime: string;
  endTime: string;
  active: boolean;
  createdAt: string;
}

export interface GroupSessionRequest {
  groupId: string;
  zoneId: string;
  startTime: string;
  endTime: string;
}
