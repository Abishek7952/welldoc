// src/lib/api.ts

const API_BASE_URL = 'http://127.0.0.1:8000';

export interface User {
  id?: number;
  email: string;
  firstName: string;
  lastName: string;
  userType: string;
  is_active?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  userType: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface ScoreRequest {
  patient_id: number;
  diabetes_baseline_features: {
    gender: string;
    age: number;
    hypertension: number;
    heart_disease: number;
    smoking_history: string;
    bmi: number;
    HbA1c_level: number;
    blood_glucose_level: number;
  };
  glucose_realtime_features: {
    mean_gluc_weak: number;
    std_gluc: number;
    cov: number;
    iqr: number;
    mean_slope: number;
    max_slope: number;
    skew: number;
    kurtosis: number;
    pct_above_140: number;
    circadian_diff: number;
    samp_entropy: number;
    median_rise: number;
    short_spikes: number;
    sustained_spikes: number;
    glucose_sequence: number[];
  };
  hypertension_features: {
    placeholder_feature_1: number;
    placeholder_feature_2: number;
  };
  heart_disease_features: {
    placeholder_feature_a: number;
    placeholder_feature_b: string;
  };
}

export interface ScoreResponse {
  database_status: string;
  patient_id: number;
  risk_profile: {
    diabetes_baseline_risk: any;
    glucose_realtime_risk: any;
    hypertension_risk: any;
    heart_disease_risk: any;
  };
}

class ApiService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Registration failed');
    }

    return response.json();
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }

    return response.json();
  }

  async getCurrentUser(): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/me`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get user info');
    }

    return response.json();
  }

  async getScore(scoreData: ScoreRequest): Promise<ScoreResponse> {
    const response = await fetch(`${API_BASE_URL}/score`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(scoreData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get score');
    }

    return response.json();
  }

  async getUserHealthSummary(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/user/health-summary`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch health summary');
    }

    return response.json();
  }
}

export const apiService = new ApiService();

// Authentication utilities
export const authUtils = {
  setToken: (token: string) => {
    localStorage.setItem('access_token', token);
  },

  getToken: (): string | null => {
    return localStorage.getItem('access_token');
  },

  removeToken: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('userType');
    localStorage.removeItem('isAuthenticated');
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('userType');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('newUser');
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('access_token');
  },

  setUserType: (userType: string) => {
    localStorage.setItem('userType', userType);
  },

  getUserType: (): string | null => {
    return localStorage.getItem('userType');
  }
};
