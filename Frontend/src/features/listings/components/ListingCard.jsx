import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { buildRoute, ROUTES } from '@/constants/routes'
import { formatCurrency } from '@/utils/formatters'
import { assetUrl } from '@/utils/assets'
import { useWishlistStore } from '@/store/wishlistStore'
import toast from 'react-hot-toast'

export default function ListingCard({ listing }) {
  const { toggleItem, isInWishlist } = useWishlistStore()
  const inWishlist = isInWishlist(listing.id)

  const handleWishlist = (e) => {
    e.preventDefault()
    toggleItem(listing)
    toast(inWishlist ? 'Removed from wishlist' : 'Saved to wishlist!')
  }

  return (
    <Link
      to={buildRoute(ROUTES.LISTING_DETAIL, { id: listing.id })}
      className="card hover:shadow-md transition-all duration-200 flex flex-col group overflow-hidden"
    >
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        {listing.primaryImageUrl ? (
          <img
            src={assetUrl(listing.primaryImageUrl)}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-sm text-gray-400">
            No image
          </div>
        )}

        <button
          onClick={handleWishlist}
          className={`absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-sm transition-all ${
            inWishlist
              ? 'text-secondary opacity-100'
              : 'text-gray-400 hover:text-secondary opacity-100'
          }`}
          title={inWishlist ? 'Remove from wishlist' : 'Save to wishlist'}
        >
          <Heart size={15} fill={inWishlist ? 'currentColor' : 'none'} />
        </button>

      </div>

      <div className={`px-3 pb-3 flex flex-col flex-1 ${listing.freeShipping ? 'pt-0' : 'pt-3'}`}>
        {listing.freeShipping && (
          <div className="-mt-2 mb-1 relative z-10">
            <span className="inline-flex text-[10px] uppercase bg-[#f68b1e] text-white px-1.5 py-0.5 rounded font-bold leading-none border border-white shadow-sm">
              Free Ship
            </span>
          </div>
        )}
        <p className="text-xs text-gray-400 mb-0.5 truncate">{listing.categoryName}</p>
        <p className="text-sm text-gray-800 font-medium line-clamp-2 leading-snug mb-auto">
          {listing.title}
        </p>
        <div className="mt-2">
          <p className="text-lg font-bold text-gray-900">{formatCurrency(listing.price)}</p>
        </div>
      </div>
    </Link>
  )
}
