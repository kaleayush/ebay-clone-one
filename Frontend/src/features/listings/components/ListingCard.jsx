import { Link } from 'react-router-dom'
import { Heart, ShoppingCart } from 'lucide-react'
import { buildRoute, ROUTES } from '@/constants/routes'
import { formatCurrency } from '@/utils/formatters'
import { useCartStore } from '@/store/cartStore'
import { useWishlistStore } from '@/store/wishlistStore'
import toast from 'react-hot-toast'

export default function ListingCard({ listing }) {
  const addItem = useCartStore((s) => s.addItem)
  const { toggleItem, isInWishlist } = useWishlistStore()
  const inWishlist = isInWishlist(listing.id)

  const handleAddToCart = (e) => {
    e.preventDefault()
    addItem(listing)
    toast.success('Added to cart!')
  }

  const handleWishlist = (e) => {
    e.preventDefault()
    toggleItem(listing)
    toast(inWishlist ? 'Removed from wishlist' : 'Saved to wishlist!', {
      icon: inWishlist ? '💔' : '❤️',
    })
  }

  return (
    <Link
      to={buildRoute(ROUTES.LISTING_DETAIL, { id: listing.id })}
      className="card hover:shadow-md transition-all duration-200 flex flex-col group overflow-hidden"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        {listing.primaryImageUrl ? (
          <img
            src={listing.primaryImageUrl}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl text-gray-300">
            📦
          </div>
        )}

        {/* Wishlist button */}
        <button
          onClick={handleWishlist}
          className={`absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-sm transition-all ${
            inWishlist
              ? 'text-secondary opacity-100'
              : 'text-gray-400 hover:text-secondary opacity-0 group-hover:opacity-100'
          }`}
          title={inWishlist ? 'Remove from wishlist' : 'Save to wishlist'}
        >
          <Heart size={15} fill={inWishlist ? 'currentColor' : 'none'} />
        </button>

        {/* Free shipping badge */}
        {listing.freeShipping && (
          <div className="absolute bottom-2 left-2">
            <span className="text-xs bg-success text-white px-1.5 py-0.5 rounded font-medium leading-none">
              Free Ship
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col flex-1">
        <p className="text-xs text-gray-400 mb-0.5 truncate">{listing.categoryName}</p>
        <p className="text-sm text-gray-800 font-medium line-clamp-2 leading-snug mb-auto">
          {listing.title}
        </p>
        <div className="mt-2">
          <p className="text-lg font-bold text-gray-900">{formatCurrency(listing.price)}</p>
        </div>

        {/* Add to cart — visible on hover */}
        <button
          onClick={handleAddToCart}
          className="mt-2 w-full flex items-center justify-center gap-1.5 bg-primary text-white text-xs py-2 rounded-md hover:bg-primary-600 transition-all opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0"
        >
          <ShoppingCart size={13} />
          Add to Cart
        </button>
      </div>
    </Link>
  )
}
