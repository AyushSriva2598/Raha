import { LoginPayload, RegisterPayload, UserAccount, UserProfile } from '@/types';
import { getResolvedApiUrl } from './api';

export interface AuthResponse {
  success: boolean;
  message?: string;
  token: string;
  user?: UserAccount;
  profile: UserProfile;
}

class AuthService {
  private getBaseUrl(): string {
    return getResolvedApiUrl().replace(/\/+$/, '');
  }

  async getTestUsers(): Promise<UserAccount[]> {
    try {
      const res = await fetch(`${this.getBaseUrl()}/api/auth/users`);
      if (res.ok) {
        return (await res.json()) as UserAccount[];
      }
    } catch {
      // offline fallback test accounts
    }
    return [
      {
        id: 'u-pasang',
        name: 'Pasang Lhamu Sherpa',
        phone: '+977 9841-582910',
        email: 'pasang.sherpa@khumbu.np',
        role: 'resident',
        homeZoneId: 'dingboche-zone',
        createdAt: '2026-01-15T08:00:00Z',
      },
      {
        id: 'u-dawa',
        name: 'Dawa Tenzing',
        phone: '+977 9843-110943',
        email: 'dawa.tenzing@khumbu.np',
        role: 'resident',
        homeZoneId: 'dingboche-zone',
        createdAt: '2026-02-10T12:00:00Z',
      },
      {
        id: 'u-operator',
        name: 'Nepal EWS Field Operator',
        phone: '+977 9801-000000',
        email: 'operator@dhm.gov.np',
        role: 'operator',
        homeZoneId: 'dingboche-zone',
        createdAt: '2026-01-01T00:00:00Z',
      },
    ];
  }

  async login(payload: LoginPayload): Promise<AuthResponse> {
    const res = await fetch(`${this.getBaseUrl()}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Login failed' }));
      throw new Error(err.error || 'Login failed');
    }

    return (await res.json()) as AuthResponse;
  }

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const res = await fetch(`${this.getBaseUrl()}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Registration failed' }));
      throw new Error(err.error || 'Registration failed');
    }

    return (await res.json()) as AuthResponse;
  }

  async sendOtp(phone: string): Promise<{ success: boolean; testCode?: string; message: string }> {
    const res = await fetch(`${this.getBaseUrl()}/api/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to send OTP' }));
      throw new Error(err.error || 'Failed to send OTP');
    }

    return await res.json();
  }

  async verifyOtp(phone: string, code: string): Promise<AuthResponse> {
    const res = await fetch(`${this.getBaseUrl()}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Invalid verification code' }));
      throw new Error(err.error || 'Invalid verification code');
    }

    return (await res.json()) as AuthResponse;
  }
}

export const authService = new AuthService();
