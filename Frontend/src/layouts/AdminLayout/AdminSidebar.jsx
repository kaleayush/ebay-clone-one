import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Package, Users, ShoppingBag, Tag, X,
} from 'lucide-react'
import { ROUTES } from '@/constants/routes'

const navItems = [
  { to: ROUTES.ADMIN_DASHBOARD, icon: LayoutDashboard, label: 'Dashboard' },
  { to: ROUTES.ADMIN_LISTINGS, icon: Package, label: 'Listings' },
  { to: ROUTES.ADMIN_USERS, icon: Users, label: 'Users' },
  { to: ROUTES.ADMIN_ORDERS, icon: ShoppingBag, label: 'Orders' },
  { to: ROUTES.ADMIN_CATEGORIES, icon: Tag, label: 'Categories' },
]

export default function AdminSidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-gray-900 text-white z-40 transform transition-transform duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto`}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-700">
          <span className="font-bold text-lg text-white">Admin Panel</span>
          <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  )
}