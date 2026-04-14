/**
 * lib/auth/tokenManager.ts
 * Thin helpers to read/write tokens from the Zustand persisted store.
 * Use these in non-React contexts (e.g., axios interceptors, service workers).
 */
import { useAuthStore } from '@/app/store'

export const tokenManager = {
  getAccessToken: (): string | null => useAuthStore.getState().accessToken,
  getRefreshToken: (): string | null => useAuthStore.getState().refreshToken,

  setTokens: (access: string, refresh: string): void => {
    useAuthStore.getState().setTokens(access, refresh)
  },

  clearTokens: (): void => {
    useAuthStore.getState().logout()
  },

  isAuthenticated: (): boolean => useAuthStore.getState().isAuthenticated,
}
