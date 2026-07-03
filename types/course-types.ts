export interface CourseResponse {
  id: string;
  code: string;
  name: string;
  groupCount: number;
  createdAt: string;
}

export interface CourseRequest {
  code: string;
  name: string;
}