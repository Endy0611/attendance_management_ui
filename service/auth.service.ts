/**
 * auth.service.ts
 *
 * All raw API calls for authentication.
 * Each function throws an ApiError(status, message) on failure — the status
 * lets callers (actions/*.action.ts) distinguish "expired token" from "wrong
 * password" from "backend bug" via lib/api-error.ts's toFriendlyMessage(),
 * without ever showing a raw status code or stack trace to the end user.
 * Full technical detail is logged here via console.error (server-side only —
 * shows up in your `npm run dev` terminal, never sent to the browser).
 */

import type {
  ApiResponse,
  AppUserResponse,
  AuthResponse,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  LoginRequest,
  RefreshTokenRequest,
  RegisterRequest,
  ResetPasswordRequest,
  UpdateProfileRequest,
  VerifyForgotPasswordRequest,
} from "@/types/auth-types";
import { ApiError } from "@/lib/api-error";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

// ─── Helper ─────────────────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const method = options.method ?? "GET";
  let res: Response;

  try {
    res = await fetch(`${BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json", ...options.headers },
      ...options,
    });
  } catch (networkErr) {
    console.error(`[auth.service] ${method} ${path} → network failure:`, networkErr);
    throw new ApiError(0, "Network request failed");
  }

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    console.error(`[auth.service] ${method} ${path} → ${res.status}, non-JSON response body`);
    throw new ApiError(res.status, "Server returned a non-JSON response");
  }

  if (!res.ok) {
    console.error(
      `[auth.service] ${method} ${path} → ${res.status}:`,
      JSON.stringify(data, null, 2)
    );
    const errorMsg = data?.detail || data?.message || "Something went wrong";
    throw new ApiError(res.status, errorMsg);
  }

  return data && typeof data === "object" && "payload" in data ? data.payload : data;
}

// ─── Auth endpoints ──────────────────────────────────────────────────────────

export const authService = {
  /** POST /auths/login */
  login: (body: LoginRequest) =>
    request<AuthResponse>("/auths/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  /** POST /auths/register */
  register: (body: RegisterRequest) =>
    request<AppUserResponse>("/auths/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  /** POST /auths/verify-otp?email=&otp= */
  verifyOtp: (email: string, otp: string) =>
    request<void>(
      `/auths/verify-otp?email=${encodeURIComponent(email)}&otp=${otp}`,
      { method: "POST" }
    ),

  /** POST /auths/resend?email= */
  resendOtp: (email: string) =>
    request<void>(`/auths/resend?email=${encodeURIComponent(email)}`, {
      method: "POST",
    }),

  /** POST /auths/forgot-password */
  forgotPassword: (body: ForgotPasswordRequest) =>
    request<void>("/auths/forgot-password", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  /** POST /auths/verify-forgot-password → returns resetToken string */
  verifyForgotPassword: (body: VerifyForgotPasswordRequest) =>
    request<string>("/auths/verify-forgot-password", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  /** POST /auths/reset-password */
  resetPassword: (body: ResetPasswordRequest) =>
    request<void>("/auths/reset-password", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  /** POST /auths/change-password  (requires JWT) */
  changePassword: (body: ChangePasswordRequest, token: string) =>
    request<void>("/auths/change-password", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    }),

  /** POST /auths/refresh */
  refresh: (body: RefreshTokenRequest) =>
    request<AuthResponse>("/auths/refresh", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  /** POST /auths/logout */
  logout: (body: RefreshTokenRequest) =>
    request<void>(`/auths/logout`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  /** GET /auths/me  (requires JWT) */
  getMe: (token: string) =>
    request<AppUserResponse>("/auths/me", {
      headers: { Authorization: `Bearer ${token}` },
    }),
    
  /** PUT /auths/me  (requires JWT) */
    async updateMe(body: UpdateProfileRequest, token: string): Promise<AppUserResponse> {
    // Force the production domain string directly to match where your images live
    const url = `${process.env.NEXT_PUBLIC_API_URL}/auths/me`;
    
    console.log("[auth.service.updateMe] Fetching production endpoint:", url);

    const res = await fetch(url, {
      method: "PUT",
      // Use clean, stripped headers to bypass Next.js internal header pollution
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const text = await res.text();
    console.log("[auth.service.updateMe] Response Status:", res.status);

    if (!res.ok) {
      console.error("[auth.service.updateMe] Failed response body:", text);
      let parsedError;
      try {
        parsedError = JSON.parse(text);
      } catch {
        parsedError = { detail: text };
      }
      throw new ApiError(res.status, parsedError.detail || parsedError.message || "Internal Update Error");
    }

    const data = JSON.parse(text);
    return data && typeof data === "object" && "payload" in data ? data.payload : data;
  },
};