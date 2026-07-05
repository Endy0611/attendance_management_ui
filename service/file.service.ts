/**
 * service/file.service.ts
 * Pure fetch wrapper. Does not read cookies/localStorage directly.
 *
 * Multipart is the odd one out among services here — every other service
 * sends JSON, so this is the only place that must NOT set a Content-Type
 * header manually. When the body is a FormData, fetch sets
 * `multipart/form-data; boundary=...` itself; overriding it strips the
 * boundary and the backend can't parse the parts.
 */

import type { FileUploadResponse } from "@/types/file-types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

async function parseEnvelope<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => undefined);
  const isEnvelope =
    data && typeof data === "object" && !Array.isArray(data) && "success" in data;

  if (isEnvelope) {
    if (!res.ok || !data.success) {
      throw new Error(data.message ?? `Server error: ${res.status}`);
    }
    return data.payload as T;
  }

  if (!res.ok) throw new Error(`Server error: ${res.status}`);
  return data as T;
}

export const fileService = {
  /** POST /api/v1/files/upload-file?folder=general (multipart) */
  upload: async (file: File, token: string, folder = "general") => {
    const body = new FormData();
    body.append("file", file);

    const res = await fetch(
      `${BASE_URL}/files/upload-file?folder=${encodeURIComponent(folder)}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }, // no Content-Type — see note above
        body,
      }
    );

    return parseEnvelope<FileUploadResponse>(res);
  },
};