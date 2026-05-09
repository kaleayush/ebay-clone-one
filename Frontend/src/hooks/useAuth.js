import { useAuthStore } from '@/store/authStore'
import { UserRole } from '@/constants/enums'

export const useAuth = () => {
  const { user, isAuthenticated, accessToken, clearAuth } = useAuthStore()
  const role = String(user?.role || '').toLowerCase()

  return {
    user,
    isAuthenticated,
    accessToken,
    isAdmin: role === UserRole.ADMIN.toLowerCase(),
    logout: clearAuth,
  }
}
