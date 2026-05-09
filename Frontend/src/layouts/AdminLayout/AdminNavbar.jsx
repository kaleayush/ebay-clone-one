import { Link, useLocation } from 'react-router-dom'
import { Menu, Home, LogOut, Search } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'

const pageTitles = {
  [ROUTES.ADMIN_DASHBOARD]: 'Dashboard',
  [ROUTES.ADMIN_LISTINGS]: 'Listings',
  [ROUTES.ADMIN_USERS]: 'Users',
  [ROUTES.ADMIN_ORDERS]: 'Orders',
  [ROUTES.ADMIN_CATEGORIES]: 'Categories',
}

export default function AdminNavbar({ onMenuToggle }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const title = pageTitles[location.pathname] || 'Admin'

  const handleLogout = () => {
    logout()
    navigate(ROUTES.HOME)
  }

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center px-4 sm:px-6 gap-4 sticky top-0 z-20 shadow-sm">
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-2 text-gray-500 hover:text-gray-900 rounded-md hover:bg-gray-100"
      >
        <Menu size={20} />
      </button>

      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wider text-primary">Admin Portal</p>
        <h1 className="text-lg font-bold leading-tight text-gray-950">{title}</h1>
      </div>

      <div className="hidden md:flex flex-1 max-w-xl">
        {/* <div className="relative w-full">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder="Search admin records"
            className="w-full rounded-md border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-700 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div> */}
      </div>

      <Link
        to="/"
        className="hidden sm:flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:border-primary/40 hover:text-primary"
      >
        <Home size={16} />
        <span>View Store</span>
      </Link>

      <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-2 py-1.5">
        <div className="w-8 h-8 bg-[#071b45] rounded-full flex items-center justify-center text-white text-sm font-bold">
          {user?.firstName?.[0]?.toUpperCase() || 'A'}
        </div>
        <div className="hidden md:block leading-tight">
          <p className="text-sm font-semibold text-gray-800">{user?.firstName}</p>
          <p className="text-[11px] text-gray-500">Administrator</p>
        </div>
      </div>

      <button
        onClick={handleLogout}
        className="flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700 px-2 py-2 rounded-md hover:bg-red-50"
      >
        <LogOut size={16} />
        <span className="hidden sm:block">Sign Out</span>
      </button>
    </header>
  )
}
