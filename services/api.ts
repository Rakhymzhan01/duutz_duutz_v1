// API service for communicating with the backend
import { User, AuthTokens } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

class ApiService {
  private getAuthHeaders(token?: string): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  async register(
    email: string, 
    password: string, 
    firstName: string, 
    lastName: string
  ): Promise<{ user: User; tokens: AuthTokens }> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Registration error:', { 
        status: response.status, 
        statusText: response.statusText, 
        error 
      });
      throw new Error(error || 'Registration failed');
    }

    const data = await response.json();
    return {
      user: data.user,
      tokens: {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        token_type: data.token_type,
        expires_in: data.expires_in,
      },
    };
  }

  async login(email: string, password: string): Promise<{ user: User; tokens: AuthTokens }> {
    const requestBody = JSON.stringify({
      email: email.trim(),
      password: password,
    });

    console.log('Login request:', { 
      email: email.trim(), 
      url: `${API_BASE_URL}/auth/login`,
      bodyLength: requestBody.length,
      body: requestBody
    });

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: requestBody,
        mode: 'cors',
        credentials: 'omit',
      });

      console.log('Login response:', { 
        status: response.status, 
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Login error response:', error);
        throw new Error(error || 'Login failed');
      }

      const data = await response.json();
      return {
        user: data.user,
        tokens: {
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          token_type: data.token_type,
          expires_in: data.expires_in,
        },
      };
    } catch (error) {
      console.error('Login fetch error:', error);
      throw error;
    }
  }

  async refreshToken(refreshToken: string): Promise<{ tokens: AuthTokens }> {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    return {
      tokens: {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        token_type: data.token_type,
        expires_in: data.expires_in,
      },
    };
  }

  async getProfile(accessToken: string): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/user/profile`, {
      method: 'GET',
      headers: this.getAuthHeaders(accessToken),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch profile');
    }

    return await response.json();
  }

  async uploadImage(file: File, accessToken: string): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_BASE_URL}/images/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Image upload failed');
    }

    return await response.json();
  }

  async generateVideo(
    prompt: string,
    options: {
      image_id?: string;
      duration_seconds?: number;
      resolution_width?: number;
      resolution_height?: number;
      fps?: number;
      provider?: string;
    },
    accessToken: string
  ): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/videos/generate`, {
      method: 'POST',
      headers: this.getAuthHeaders(accessToken),
      body: JSON.stringify({
        prompt,
        ...options,
      }),
    });

    if (!response.ok) {
      throw new Error('Video generation failed');
    }

    return await response.json();
  }

  async getVideoStatus(videoId: string, accessToken: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/videos/${videoId}/status`, {
      method: 'GET',
      headers: this.getAuthHeaders(accessToken),
    });

    if (!response.ok) {
      throw new Error('Failed to get video status');
    }

    return await response.json();
  }

  async getUserVideos(accessToken: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/videos/`, {
      method: 'GET',
      headers: this.getAuthHeaders(accessToken),
    });

    if (!response.ok) {
      throw new Error('Failed to get user videos');
    }

    return await response.json();
  }
}

export const apiService = new ApiService();