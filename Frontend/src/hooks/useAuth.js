import { useAuthStore } from '@/store/authStore'
import { UserRole } from '@/constants/enums'

export const useAuth = () => {
  const { user, isAuthenticated, accessToken, clearAuth } = useAuthStore()

  return {
    user,
    isAuthenticated,
    accessToken,
    isAdmin: user?.role === UserRole.ADMIN,
    logout: clearAuth,
  }
}