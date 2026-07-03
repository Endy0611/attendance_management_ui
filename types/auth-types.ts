// ─── Request types (what we send to the API) ───────────────────────────────

export interface LoginRequest {
  identifier: string; // email or studentId
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ForgotPasswordRequest {
  email: string; // must be @gmail.com
}

export interface VerifyForgotPasswordRequest {
  email: string;
  otp: string; // 6 digits
}

export interface ResetPasswordRequest {
  resetToken: string;
  newPassword: string; // min 8 chars
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string; // min 8 chars
}

export interface UpdateProfileRequest {
  name: string;
  phone?: string;
  avatar?: string;
}

// ─── Admin user management (POST/PUT /admin/users) ─────────────────────────

export interface AdminCreateUserRequest {
  name: string;
  email: string;
  phone?: string;
  studentId?: string;
  generation?: number;
  role: "ADMIN" | "INSTRUCTOR" | "STUDENT";
}

export interface AdminUpdateUserRequest {
  name: string;
  phone?: string;
  studentId?: string;
  generation?: number;
}

// ─── Response types (what the API sends back) ──────────────────────────────

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  firstLogin: boolean;
}

export interface AppUserResponse {
  id: string;
  name: string;
  email: string;
  phone?: string;
  studentId?: string;
  generation?: number;
  role: "ADMIN" | "INSTRUCTOR" | "STUDENT";
  avatar?: string;
  verified: boolean;
  active: boolean;
  deviceBound: boolean;
  firstLogin: boolean;
  createdAt: string;
}

// ─── Generic API wrapper ────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  status: string;
  payload: T;
  timestamp: string;
}