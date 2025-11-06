
export interface Tool {
  id: string;
  title: string;
  description: string;
  gifSrc: string;
  tintClass: string;
  shadowClass: string;
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  credits_balance: number;
  subscription_tier: string;
  is_verified: boolean;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface AuthContextType {
  user: User | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<boolean>;
  logout: () => void;
  refreshTokens: () => Promise<boolean>;
}
