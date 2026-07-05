export interface AttendanceCheckInRequest {
  latitude: number;
  longitude: number;
  deviceFingerprint: string;
  faceImageBase64: string;
}

export interface AttendanceResponse {
  attendanceId: string;
  sessionId: string;
  studentId: string;
  studentName: string;
  checkedInAt: string;
  latitude: number;
  longitude: number;
  distanceMeters: number;
  status: "PRESENT" | "LATE" | "ABSENT";
}
