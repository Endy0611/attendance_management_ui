export interface GroupRequest {
  courseId: string;
  name: string;
  instructorId: string;
  capacity?: number;
  semester?: string;
}

export interface GroupResponse {
  id: string;
  courseId: string;
  courseCode: string;
  name: string;
  instructorId: string;
  instructorName: string;
  capacity: number | null;
  memberCount: number;
  semester: string | null;
  createdAt: string;
}

export interface GroupMemberResponse {
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentNumber: string;
  joinedAt: string;
}

export interface AddGroupMembersRequest {
  studentIds: string[];
}
