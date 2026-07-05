export interface MajorResponse {
  id: string;
  name: string;
  code: string;
  groupCount: number;
  createdAt: string;
}

export interface MajorRequest {
  name: string;
  code: string;
}
