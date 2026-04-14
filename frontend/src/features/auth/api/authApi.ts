import axiosInstance from '@/lib/api/axiosInstance'
import API from '@/lib/api/endpoints'
import { useAuthStore } from '@/app/store'
import type { Role } from '@/config/roles'

interface LoginPayload {
  email: string
  password: string
}

interface LoginResponse {
  access: string
  refresh: string
}

interface MeResponse {
  id: string
  email: string
  full_name: string
  role: Role
  branch_id: string | null
  avatar?: string
}

export const authApi = {
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const { data } = await axiosInstance.post<LoginResponse>(API.AUTH.LOGIN, payload)
    return data
  },

  me: async (): Promise<MeResponse> => {
    const { data } = await axiosInstance.get<MeResponse>(API.AUTH.ME)
    return data
  },

  logout: async (): Promise<void> => {
    const refreshToken = useAuthStore.getState().refreshToken
    await axiosInstance.post(API.AUTH.LOGOUT, { refresh: refreshToken })
  },
}
