// API configuration and utility functions
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export type Match = {
  id: string;
  name: string;
  age: number;
  location: string;
  photos: string[];
  bio: string;
  verified: boolean;
};

export type MatchesResponse = {
  matches: Match[];
};

export class ApiClient {
  private baseUrl: string;
  private getHeaders: (() => Record<string, string>) | null = null;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || API_BASE_URL;
  }

  setGetHeaders(fn: () => Record<string, string>) {
    this.getHeaders = fn;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit & { headers?: Record<string, string> } = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      ...this.getHeaders?.(),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw {
        code: error.code || 'UNKNOWN_ERROR',
        message: error.message || `HTTP ${response.status}`,
        details: error.details,
      } as ApiError;
    }

    return response.json() as Promise<T>;
  }

  // Auth endpoints
  async requestOtp(phone: string) {
    return this.request('/auth/otp/request', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  }

  async verifyOtp(phone: string, code: string) {
    return this.request<{ token: string; userId: string }>('/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ phone, code }),
    });
  }

  async verifyVideo(videoUrl: string) {
    return this.request('/verification/video', {
      method: 'POST',
      body: JSON.stringify({ videoUrl }),
    });
  }

  async completeProfile(data: {
    firstName: string;
    lastName: string;
    birthDate: string;
    gender: string;
    location: string;
    bio: string;
  }) {
    return this.request('/profile/complete', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async uploadPhoto(file: File) {
    const formData = new FormData();
    formData.append('photo', file);
    return this.request('/photos/upload', {
      method: 'POST',
      body: formData,
      headers: {}, // FormData sets Content-Type automatically
    });
  }

  async initializePayment(data: { amount: number; currency: string }) {
    return this.request<{ sessionId: string; url: string }>('/payments/initialize', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getProfile() {
    return this.request('/profile', {
      method: 'GET',
    });
  }

  async getMatches() {
    return this.request<MatchesResponse>('/matches', {
      method: 'GET',
    });
  }
}

export const apiClient = new ApiClient();
