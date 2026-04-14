import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authApi } from '../api/authApi'
import { useAuthStore } from '@/app/store'
import { ROUTES } from '@/config/routes'

export function useAuth() {
  const { user, isAuthenticated, setTokens, setUser, logout: clearAuth } = useAuthStore()
  const navigate = useNavigate()

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: async (data) => {
      setTokens(data.access, data.refresh)
      const me = await authApi.me()
      setUser(me)
      toast.success(`Welcome back, ${me.full_name}!`)
      // Redirect by role
      const roleRoutes: Record<string, string> = {
        owner: ROUTES.OWNER_DASHBOARD,
        doctor: ROUTES.DOCTOR_DASHBOARD,
        receptionist: ROUTES.RECEPTIONIST_DASHBOARD,
        patient: ROUTES.PATIENT_DASHBOARD,
        hr: ROUTES.HR_DASHBOARD,
        employee: ROUTES.EMPLOYEE_DASHBOARD,
      }
      navigate(roleRoutes[me.role] ?? ROUTES.HOME)
    },
    onError: () => {
      toast.error('Invalid email or password.')
    },
  })

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      clearAuth()
      navigate(ROUTES.LOGIN)
    },
  })

  return {
    user,
    isAuthenticated,
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    isLoggingIn: loginMutation.isPending,
  }
}
