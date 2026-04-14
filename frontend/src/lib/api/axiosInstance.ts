import axios from 'axios'
import env from '@/config/env'
import { useAuthStore } from '@/app/store'

const axiosInstance = axios.create({
  baseURL: env.API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ─── Request interceptor: attach JWT ──────────────────────────────────────────
axiosInstance.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ─── Response interceptor: handle 401 (token refresh) ─────────────────────────
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      const { refreshToken, setTokens, logout } = useAuthStore.getState()

      if (refreshToken) {
        try {
          const { data } = await axios.post(`${env.API_BASE_URL}/auth/token/refresh/`, {
            refresh: refreshToken,
          })
          setTokens(data.access, refreshToken)
          originalRequest.headers.Authorization = `Bearer ${data.access}`
          return axiosInstance(originalRequest)
        } catch {
          logout()
        }
      } else {
        logout()
      }
    }

    return Promise.reject(error)
  }
)

export default axiosInstance
