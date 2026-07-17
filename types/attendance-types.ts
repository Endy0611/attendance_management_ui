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

export interface AttendanceSummaryResponse {
  sessionId: string;
  totalStudents: number;
  present: number;
  late: number;
  absent: number;
}

export interface AbsentStudentResponse {
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentNumber: string;
}

export interface StudentAttendanceResponse {
  attendanceId: string;
  sessionId: string;
  sessionTitle: string;
  groupName: string;
  courseCode: string;
  status: "PRESENT" | "LATE" | "ABSENT";
  checkedInAt: string;
}