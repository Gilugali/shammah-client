import api from "../api";

export interface User {
  id: string;
  name: string;
  email: string;
  phoneNumber: string | null;
  role: string;
  nationalId: string;
  active: boolean;
  salary?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface UsersResponse {
  success: boolean;
  users: User[];
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber: string;
  role: string;
  nationalId: string;
  salary: number;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  phoneNumber?: string;
  role?: string;
  salary?: number;
  active?: boolean;
}

export interface Profile {
  active: boolean;
  name: string;
  nationalId: string;
  salary: number | null;
  role: string;
  email: string;
  phoneNumber: string | null;
}

export interface ProfileResponse {
  success: boolean;
  message: string;
  profile: Profile;
}

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
  phoneNumber?: string;
  nationalId?: string;
  oldPassword?: string;
  password?: string;
}

export const userApi = {
  getAll: async (): Promise<UsersResponse> => {
    const response = await api.get("/user/users");
    return response.data;
  },

  create: async (
    data: CreateUserRequest,
  ): Promise<{ message: string; user: User }> => {
    const response = await api.post("/auth/signup", data);
    return response.data;
  },

  update: async (
    id: string,
    data: UpdateUserRequest,
  ): Promise<{ success: boolean; message: string; user: User }> => {
    const response = await api.put(`/user/update/${id}`, data);
    return response.data;
  },

  disable: async (
    id: string,
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.put(`/user/update/status/${id}`, {
      data: { status: false },
    });
    return response.data;
  },

  enable: async (
    id: string,
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.put(`/user/update/status/${id}`, {
      data: { status: true },
    });
    return response.data;
  },

  getProfile: async (): Promise<ProfileResponse> => {
    const response = await api.get("/user/profile");
    return response.data;
  },

  updateProfile: async (
    id: string,
    data: UpdateProfileRequest,
  ): Promise<{ message: string; user: User }> => {
    const response = await api.put(`/user/update/${id}`, data);
    return response.data;
  },
};
