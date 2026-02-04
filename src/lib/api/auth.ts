import api from "../api";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phoneNumber: string | null;
  role: string;
  active: boolean;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user: User;
}

export interface CurrentUserResponse {
  success: boolean;
  message: string;
  user: User;
}

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post("/auth/login", data);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.get("/auth/logout");
  },

  getCurrentUser: async (): Promise<User> => {
    try {
      const response = await api.get<CurrentUserResponse>("/auth/me");
      return response.data.user;
    } catch (error: any) {
      console.log(error);
      throw error;
    }
  },
};
