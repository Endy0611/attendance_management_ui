/**
 * service/device.service.ts
 * Pure fetch wrapper. Does not read cookies/localStorage directly.
 */

import type { BindDeviceRequest, DeviceResponse } from "@/types/device-types";

// Matches backend base path (/api/v1) and port (8080)
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

async function request<T>(
  path: string,
  token: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
    next: {
      tags: ["device"],
    },
  });

  if (res.status === 204) {
    return undefined as T;
  }

  const data = await res.json().catch(() => undefined);

  const isEnvelope =
    data && typeof data === "object" && !Array.isArray(data) && "success" in data;

  if (isEnvelope) {
    if (!res.ok || !data.success) {
      throw new Error(data.message ?? `Server error: ${res.status}`);
    }
    return data.payload as T;
  }

  if (!res.ok) {
    throw new Error(`Server error: ${res.status}`);
  }

  return data as T;
}

export const deviceService = {
  /** GET /api/v1/devices/me — 404s when the student hasn't bound a device yet */
  myDevice: (token: string) => request<DeviceResponse>("/devices/me", token),

  /** POST /api/v1/devices/bind */
  bind: (body: BindDeviceRequest, token: string) =>
    request<DeviceResponse>("/devices/bind", token, {
      method: "POST",
      body: JSON.stringify(body),
    }),
};
