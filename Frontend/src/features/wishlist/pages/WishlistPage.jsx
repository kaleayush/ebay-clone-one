import { Link } from 'react-router-dom'
import { Heart, ShoppingCart, Trash2, ArrowRight } from 'lucide-react'
import { useWishlistStore } from '@/store/wishlistStore'
import { useCartStore } from '@/store/cartStore'
import Button from '@/components/common/Button'
import { formatCurrency } from '@/utils/formatters'
import { buildRoute, ROUTES } from '@/constants/routes'
import toast from 'react-hot-toast'

export default function WishlistPage() {
  const { items, removeItem, clearWishlist } = useWishlistStore()
  const addToCart = useCartStore((s) => s.addItem)

  const handleMoveToCart = (listing) => {
    addToCart(listing)
    removeItem(listing.id)
    toast.success('Moved to cart!')
  }

  const handleRemove = (listingId) => {
    removeItem(listingId)
    toast('Removed from wishlist', { icon: '💔' })
  }

  if (!items.length) {
    return (
      <div className="text-center py-24 max-w-sm mx-auto">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
          <Heart size={36} className="text-red-300" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Your wishlist is empty</h2>
        <p className="text-gray-500 text-sm mb-8">
          Click the heart icon on any listing to save it here for later.
        </p>
        <Link to={ROUTES.LISTINGS}>
          <Button size="lg" className="gap-2">
            Browse Listings <ArrowRight size={16} />
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Wishlist</h1>
          <p className="text-sm text-gray-500 mt-0.5">{items.length} saved {items.length === 1 ? 'item' : 'items'}</p>
        </div>
        <button
          onClick={() => { clearWishlist(); toast('Wishlist cleared', { icon: '🗑️' }) }}
          className="text-sm text-red-400 hover:text-red-600 transition-colors"
        >
          Clear All
        </button>
      </div>

      {/* Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {items.map((listing) => (
          <div key={listing.id} className="card flex flex-col group overflow-hidden">
            {/* Image */}
            <Link
              to={buildRoute(ROUTES.LISTING_DETAIL, { id: listing.id })}
              className="relative aspect-square overflow-hidden bg-gray-100 block"
            >
              {listing.primaryImageUrl ? (
                <img
                  src={listing.primaryImageUrl}
                  alt={listing.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-5xl text-gray-300">
                  📦
                </div>
              )}
              <button
                onClick={(e) => { e.preventDefault(); handleRemove(listing.id) }}
                className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full text-secondary shadow-sm hover:bg-red-50 transition-colors"
                title="Remove from wishlist"
              >
                <Heart size={15} fill="currentColor" />
              </button>
            </Link>

            {/* Info */}
            <div className="p-4 flex flex-col flex-1">
              {listing.categoryName && (
                <p className="text-xs text-gray-400 mb-0.5 truncate">{listing.categoryName}</p>
              )}
              <Link
                to={buildRoute(ROUTES.LISTING_DETAIL, { id: listing.id })}
                className="text-sm font-medium text-gray-900 hover:text-primary line-clamp-2 leading-snug mb-2 transition-colors"
              >
                {listing.title}
              </Link>
              <p className="text-xl font-bold text-gray-900 mb-4">{formatCurrency(listing.price)}</p>

              <div className="mt-auto flex gap-2">
                <button
                  onClick={() => handleMoveToCart(listing)}
                  className="flex-1 flex items-center justify-center gap-1.5 btn-primary text-sm py-2 rounded-md"
                >
                  <ShoppingCart size={14} />
                  Add to Cart
                </button>
                <button
                  onClick={() => handleRemove(listing.id)}
                  className="p-2 border border-gray-200 rounded-md text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors"
                  title="Remove"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
