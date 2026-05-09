import { Link } from 'react-router-dom'
import { Menu, Home, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'

export default function AdminNavbar({ onMenuToggle }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center px-4 gap-4 sticky top-0 z-20">
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-2 text-gray-500 hover:text-gray-900"
      >
        <Menu size={20} />
      </button>

      <div className="flex-1" />

      <Link
        to="/"
        className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-primary"
      >
        <Home size={16} />
        <span className="hidden sm:block">View Store</span>
      </Link>

      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold">
          {user?.firstName?.[0]?.toUpperCase() || 'A'}
        </div>
        <span className="hidden md:block text-sm font-medium text-gray-700">{user?.firstName}</span>
      </div>

      <button
        onClick={handleLogout}
        className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 px-2 py-1 rounded-md hover:bg-red-50"
      >
        <LogOut size={16} />
        <span className="hidden sm:block">Sign Out</span>
      </button>
    </header>
  )
}