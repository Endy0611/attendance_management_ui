// types/file-types.ts
//
// Matches the backend's FileController response exactly per OpenAPI spec:
// FileMetaDataResponse { fileName, fileType, fileUrl, fileSize }

export interface FileUploadResponse {
  fileName: string;
  fileType: string;
  fileUrl: string;
  fileSize: number;
}