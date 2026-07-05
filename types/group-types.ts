export interface GroupRequest {
  courseId: string;
  name: string;
  instructorId: string;
  capacity?: number;
  semester?: string;
  /**
   * Real academic hierarchy fields (Batch -> Major -> Group -> TimetableSlot).
   * courseId/instructorId above are the deprecated legacy fields kept for
   * backward compatibility — see CLAUDE.md §2. batchId has no listing UI yet
   * because BatchController isn't exposed over REST (service layer only).
   */
  batchId?: string;
  majorId?: string;
  shift?: string;
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
  batchId: string | null;
  batchName: string | null;
  majorId: string | null;
  majorName: string | null;
  shift: string | null;
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
