"use server";

import { authService } from "@/service/auth.service";
import { fileService } from "@/service/file.service";
import { getTokens, setAuthCookies } from "@/lib/server-auth";
import type { FileUploadResponse } from "@/types/file-types";

type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export async function uploadAvatarServerAction(
  formData: FormData
): Promise<ActionResult<FileUploadResponse>> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Please select an image to upload" };
  }
  if (!file.type.startsWith("image/")) {
    return { ok: false, error: "Only image files are allowed" };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { ok: false, error: "Image must be under 5MB" };
  }

  const { accessToken, refreshToken } = await getTokens();
  if (!accessToken) {
    return { ok: false, error: "Not authenticated" };
  }

  try {
    const data = await fileService.upload(file, accessToken);
    return { ok: true, data };
  } catch (err) {
    // Same expired-access-token gap as updateProfileServerAction — retry
    // once with a refreshed token before surfacing an error. Safe to write
    // cookies here since this only ever runs inside a real Server Action.
    if (!refreshToken) {
      return { ok: false, error: err instanceof Error ? err.message : "Upload failed" };
    }

    try {
      const auth = await authService.refresh({ refreshToken });
      await setAuthCookies(auth.accessToken, auth.refreshToken);

      const data = await fileService.upload(file, auth.accessToken);
      return { ok: true, data };
    } catch (retryErr) {
      return {
        ok: false,
        error: retryErr instanceof Error ? retryErr.message : "Upload failed",
      };
    }
  }
}