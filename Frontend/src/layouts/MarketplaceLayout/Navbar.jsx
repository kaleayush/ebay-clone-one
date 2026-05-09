import { Link, NavLink, useNavigate } from 'react-router-dom'
import {
  ShoppingCart, User, Search, LogOut, Package,
  ChevronDown, Heart, Menu, X, Home, ShoppingBag, Store, LayoutDashboard,
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useCartStore } from '@/store/cartStore'
import { useWishlistStore } from '@/store/wishlistStore'
import { ROUTES } from '@/constants/routes'

const CATEGORIES = [
  { label: 'Electronics', emoji: '📱', value: 'electronics' },
  { label: 'Fashion', emoji: '👗', value: 'fashion' },
  { label: 'Home & Garden', emoji: '🏡', value: 'home-garden' },
  { label: 'Vehicles', emoji: '🚗', value: 'vehicles' },
  { label: 'Sports', emoji: '⚽', value: 'sports' },
  { label: 'Toys', emoji: '🧸', value: 'toys' },
  { label: 'Books', emoji: '📚', value: 'books' },
  { label: 'Collectibles', emoji: '🏆', value: 'collectibles' },
]

function CountBadge({ count }) {
  if (!count) return null
  return (
    <span className="absolute -top-1 -right-1 bg-secondary text-white text-xs w-4.5 h-4.5 min-w-[1.1rem] min-h-[1.1rem] rounded-full flex items-center justify-center font-bold leading-none px-0.5">
      {count > 9 ? '9+' : count}
    </span>
  )
}

export default function Navbar() {
  const { isAuthenticated, user, isAdmin, logout } = useAuth()
  const totalItems = useCartStore((s) => s.totalItems)
  const wishlistCount = useWishlistStore((s) => s.items.length)
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileOpen(false)
  }, [navigate])

  const handleSearch = (e) => {
    e.preventDefault()
    const q = searchQuery.trim()
    if (q) navigate(`${ROUTES.LISTINGS}?q=${encodeURIComponent(q)}`)
    setMobileOpen(false)
  }

  const handleLogout = () => {
    logout()
    navigate(ROUTES.HOME)
    setMobileOpen(false)
    setDropdownOpen(false)
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      {/* ── Main bar ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-3 h-16">
          {/* Hamburger (mobile) */}
          <button
            className="lg:hidden p-2 -ml-1 text-gray-600 hover:text-primary rounded-md"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>

          {/* Logo */}
          <Link to={ROUTES.HOME} className="flex-shrink-0 flex items-center gap-0.5 select-none">
            <span className="text-ebay-blue  font-extrabold text-2xl leading-none">e</span>
            <span className="text-ebay-red   font-extrabold text-2xl leading-none">B</span>
            <span className="text-ebay-yellow font-extrabold text-2xl leading-none">a</span>
            <span className="text-ebay-green  font-extrabold text-2xl leading-none">y</span>
            <span className="text-gray-700 font-semibold text-base ml-1 hidden sm:inline">Clone</span>
          </Link>

          {/* Search (desktop) */}
          <form onSubmit={handleSearch} className="hidden sm:flex flex-1 max-w-2xl">
            <div className="flex w-full shadow-sm">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for anything"
                className="flex-1 border border-gray-300 border-r-0 rounded-l-full px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
              />
              <button
                type="submit"
                className="bg-primary hover:bg-primary-600 text-white px-5 rounded-r-full transition-colors"
              >
                <Search size={16} />
              </button>
            </div>
          </form>

          {/* Right actions */}
          <div className="flex items-center gap-0.5 ml-auto">
            {isAuthenticated ? (
              <>
                <Link
                  to={ROUTES.CREATE_LISTING}
                  className="hidden md:flex items-center gap-1.5 text-sm font-semibold text-gray-700 hover:text-primary px-3 py-2 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Sell
                </Link>

                {/* Wishlist */}
                <Link to={ROUTES.WISHLIST} className="relative p-2 text-gray-500 hover:text-secondary transition-colors" title="Wishlist">
                  <Heart size={22} />
                  <CountBadge count={wishlistCount} />
                </Link>

                {/* Cart */}
                <Link to={ROUTES.CART} className="relative p-2 text-gray-500 hover:text-primary transition-colors" title="Cart">
                  <ShoppingCart size={22} />
                  <CountBadge count={totalItems} />
                </Link>

                {/* User dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen((v) => !v)}
                    className="flex items-center gap-1.5 text-sm text-gray-700 hover:text-primary px-2 py-1.5 rounded-md hover:bg-gray-50 ml-1"
                  >
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {user?.firstName?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <span className="hidden md:block font-medium max-w-[100px] truncate">{user?.firstName}</span>
                    <ChevronDown size={14} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-1 w-56 card py-1 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-100">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900 truncate">{user?.firstName} {user?.lastName}</p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{user?.email}</p>
                      </div>
                      {[
                        ...(isAdmin ? [{ to: ROUTES.ADMIN_DASHBOARD, icon: LayoutDashboard, label: 'Admin Panel' }] : []),
                        { to: ROUTES.PROFILE, icon: User, label: 'My Profile' },
                        { to: ROUTES.MY_LISTINGS, icon: Package, label: 'My Listings' },
                        { to: ROUTES.ORDERS, icon: ShoppingBag, label: 'My Orders' },
                        { to: ROUTES.WISHLIST, icon: Heart, label: 'Wishlist' },
                      ].map(({ to, icon: Icon, label }) => (
                        <Link
                          key={to}
                          to={to}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <Icon size={15} className="text-gray-400" />
                          {label}
                        </Link>
                      ))}
                      <hr className="my-1 border-gray-100" />
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut size={15} />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to={ROUTES.LOGIN} className="text-sm font-medium text-gray-700 hover:text-primary px-3 py-2">
                  Sign In
                </Link>
                <Link to={ROUTES.REGISTER} className="btn-primary text-sm px-4 py-2 rounded-full">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile search */}
        <div className="sm:hidden pb-3">
          <form onSubmit={handleSearch} className="flex">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for anything"
              className="flex-1 border border-gray-300 border-r-0 rounded-l-full px-4 py-2 text-sm focus:outline-none focus:border-primary"
            />
            <button type="submit" className="bg-primary hover:bg-primary-600 text-white px-4 rounded-r-full transition-colors">
              <Search size={16} />
            </button>
          </form>
        </div>
      </div>

      {/* ── Category navigation strip ── */}
      <div className="border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide py-1">
            <NavLink
              to={ROUTES.LISTINGS}
              end
              className={({ isActive }) =>
                `shrink-0 px-3 py-1.5 text-xs font-medium rounded-full transition-colors whitespace-nowrap ${
                  isActive ? 'bg-primary text-white' : 'text-gray-600 hover:text-primary hover:bg-gray-50'
                }`
              }
            >
              All Categories
            </NavLink>
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.value}
                to={`${ROUTES.LISTINGS}?category=${cat.value}`}
                className="shrink-0 flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-primary hover:bg-gray-50 rounded-full transition-colors whitespace-nowrap"
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 bg-white z-50 shadow-2xl flex flex-col overflow-hidden">
            {/* Drawer header */}
            <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 shrink-0">
              <Link to={ROUTES.HOME} onClick={() => setMobileOpen(false)} className="flex items-center gap-0.5">
                <span className="text-ebay-blue  font-extrabold text-xl">e</span>
                <span className="text-ebay-red   font-extrabold text-xl">B</span>
                <span className="text-ebay-yellow font-extrabold text-xl">a</span>
                <span className="text-ebay-green  font-extrabold text-xl">y</span>
                <span className="text-gray-700 font-semibold ml-1">Clone</span>
              </Link>
              <button onClick={() => setMobileOpen(false)} className="p-2 text-gray-500 hover:text-gray-800 rounded-md">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {isAuthenticated ? (
                <>
                  {/* User card */}
                  <div className="flex items-center gap-3 p-4 bg-primary/5 border-b border-gray-100">
                    <div className="w-11 h-11 bg-primary rounded-full flex items-center justify-center text-white text-lg font-bold shrink-0">
                      {user?.firstName?.[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{user?.firstName} {user?.lastName}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                  </div>

                  {/* Nav links */}
                  <nav className="p-3 space-y-0.5">
                    {[
                      { to: ROUTES.HOME, icon: Home, label: 'Home' },
                      ...(isAdmin ? [{ to: ROUTES.ADMIN_DASHBOARD, icon: LayoutDashboard, label: 'Admin Panel' }] : []),
                      { to: ROUTES.PROFILE, icon: User, label: 'My Profile' },
                      { to: ROUTES.MY_LISTINGS, icon: Package, label: 'My Listings' },
                      { to: ROUTES.ORDERS, icon: ShoppingBag, label: 'My Orders' },
                      { to: ROUTES.WISHLIST, icon: Heart, label: `Wishlist${wishlistCount ? ` (${wishlistCount})` : ''}` },
                      { to: ROUTES.CART, icon: ShoppingCart, label: `Cart${totalItems ? ` (${totalItems})` : ''}` },
                      { to: ROUTES.CREATE_LISTING, icon: Store, label: 'Sell an Item' },
                    ].map(({ to, icon: Icon, label }) => (
                      <Link
                        key={to}
                        to={to}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary rounded-lg transition-colors"
                      >
                        <Icon size={17} className="text-gray-400" />
                        {label}
                      </Link>
                    ))}
                  </nav>
                  <hr className="border-gray-100 mx-3" />
                  <div className="p-3">
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <LogOut size={17} />
                      Sign Out
                    </button>
                  </div>
                </>
              ) : (
                <div className="p-4 space-y-3">
                  <Link
                    to={ROUTES.LOGIN}
                    onClick={() => setMobileOpen(false)}
                    className="block w-full btn-secondary text-center py-3 rounded-xl"
                  >
                    Sign In
                  </Link>
                  <Link
                    to={ROUTES.REGISTER}
                    onClick={() => setMobileOpen(false)}
                    className="block w-full btn-primary text-center py-3 rounded-xl"
                  >
                    Register
                  </Link>
                </div>
              )}

              {/* Categories */}
              <div className="p-3 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-2">
                  Categories
                </p>
                {CATEGORIES.map((cat) => (
                  <Link
                    key={cat.value}
                    to={`${ROUTES.LISTINGS}?category=${cat.value}`}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary rounded-lg transition-colors"
                  >
                    <span className="text-lg">{cat.emoji}</span>
                    {cat.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  )
}
