/**
 * auth.service.ts
 *
 * All raw API calls for authentication.
 * Each function throws an Error with the server message on failure.
 * This keeps your components clean — they just try/catch.
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

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

// ─── Helper ─────────────────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });

  const data: ApiResponse<T> = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.message ?? "Something went wrong");
  }

  return data.payload;
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
    request<void>("/auths/logout", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  /** GET /auths/me  (requires JWT) */
  getMe: (token: string) =>
    request<AppUserResponse>("/auths/me", {
      headers: { Authorization: `Bearer ${token}` },
    }),

  /** PUT /auths/me  (requires JWT) */
  updateMe: (body: UpdateProfileRequest, token: string) =>
    request<AppUserResponse>("/auths/me", {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    }),
};