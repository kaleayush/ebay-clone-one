import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ShoppingCart, Package, Shield, Heart, Store, ChevronRight, Minus, Plus } from 'lucide-react'
import { useListing } from '../hooks/useListings'
import Spinner from '@/components/common/Spinner'
import Button from '@/components/common/Button'
import Badge from '@/components/common/Badge'
import Breadcrumbs from '@/components/common/Breadcrumbs'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { useCartStore } from '@/store/cartStore'
import { useWishlistStore } from '@/store/wishlistStore'
import { ListingStatus, ListingStatusLabel } from '@/constants/enums'
import { ROUTES } from '@/constants/routes'
import toast from 'react-hot-toast'

const statusVariant = {
  [ListingStatus.ACTIVE]: 'success',
  [ListingStatus.DRAFT]: 'default',
  [ListingStatus.SOLD]: 'danger',
  [ListingStatus.ENDED]: 'warning',
  [ListingStatus.REMOVED]: 'danger',
}

export default function ListingDetailPage() {
  const { id } = useParams()
  const { data, isLoading } = useListing(id)
  const addItem = useCartStore((s) => s.addItem)
  const { toggleItem, isInWishlist } = useWishlistStore()
  const [qty, setQty] = useState(1)

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner size="lg" />
      </div>
    )
  }

  const listing = data?.data
  if (!listing) {
    return (
      <div className="text-center py-24">
        <p className="text-6xl mb-4">🔍</p>
        <p className="text-xl font-bold text-gray-700 mb-2">Listing not found</p>
        <Link to={ROUTES.LISTINGS} className="text-primary text-sm">Browse all listings</Link>
      </div>
    )
  }

  const inWishlist = isInWishlist(listing.id)
  const isAvailable = listing.status === ListingStatus.ACTIVE && listing.quantity > 0

  const handleAddToCart = () => {
    addItem(listing, qty)
    toast.success(qty > 1 ? `${qty}× added to cart!` : 'Added to cart!')
  }

  const handleWishlist = () => {
    toggleItem(listing)
    toast(inWishlist ? 'Removed from wishlist' : 'Saved to wishlist!', {
      icon: inWishlist ? '💔' : '❤️',
    })
  }

  const breadcrumbs = [
    { label: 'Listings', to: ROUTES.LISTINGS },
    ...(listing.categoryName
      ? [{ label: listing.categoryName, to: `${ROUTES.LISTINGS}?category=${listing.categoryName}` }]
      : []),
    { label: listing.title },
  ]

  return (
    <div className="space-y-6">
      <Breadcrumbs items={breadcrumbs} />

      <div className="grid md:grid-cols-2 gap-8">
        {/* ── Image ── */}
        <div className="card overflow-hidden aspect-square bg-gray-50">
          {listing.primaryImageUrl ? (
            <img
              src={listing.primaryImageUrl}
              alt={listing.title}
              className="w-full h-full object-contain p-4"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-8xl text-gray-200">
              📦
            </div>
          )}
        </div>

        {/* ── Details panel ── */}
        <div className="space-y-5">
          {/* Title + badge */}
          <div>
            <div className="flex items-start justify-between gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900 leading-tight">{listing.title}</h1>
              <Badge variant={statusVariant[listing.status]} className="shrink-0 mt-0.5">
                {ListingStatusLabel[listing.status]}
              </Badge>
            </div>
            {listing.categoryName && (
              <Link
                to={`${ROUTES.LISTINGS}?category=${listing.categoryName}`}
                className="text-sm text-primary hover:text-primary-700 font-medium"
              >
                {listing.categoryName}
              </Link>
            )}
          </div>

          {/* Price */}
          <div>
            <p className="text-4xl font-extrabold text-gray-900">{formatCurrency(listing.price)}</p>
            {listing.freeShipping && (
              <p className="text-sm text-success font-semibold mt-1">✓ Free Shipping</p>
            )}
          </div>

          {/* Availability */}
          <p className={`text-sm font-semibold ${listing.quantity > 5 ? 'text-success' : listing.quantity > 0 ? 'text-amber-600' : 'text-red-500'}`}>
            {listing.quantity > 5
              ? `In Stock (${listing.quantity} available)`
              : listing.quantity > 0
              ? `Only ${listing.quantity} left!`
              : 'Out of Stock'}
          </p>

          {/* Quantity + CTA */}
          {isAvailable ? (
            <div className="space-y-3">
              {/* Qty picker */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">Qty:</span>
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="px-3 py-2 text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="px-4 py-2 text-sm font-bold min-w-[2.5rem] text-center border-x border-gray-300">
                    {qty}
                  </span>
                  <button
                    onClick={() => setQty(Math.min(listing.quantity, qty + 1))}
                    className="px-3 py-2 text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              <Button onClick={handleAddToCart} size="lg" className="w-full gap-2">
                <ShoppingCart size={18} /> Add to Cart
              </Button>

              <Button variant="secondary" size="lg" className="w-full gap-2" onClick={handleWishlist}>
                <Heart size={16} fill={inWishlist ? 'currentColor' : 'none'} className={inWishlist ? 'text-secondary' : ''} />
                {inWishlist ? 'Saved to Wishlist' : 'Add to Wishlist'}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-center">
                <p className="font-semibold text-gray-700 text-base mb-1">Item Unavailable</p>
                <p className="text-sm text-gray-500">This listing is no longer active</p>
              </div>
              <Button variant="secondary" size="lg" className="w-full gap-2" onClick={handleWishlist}>
                <Heart size={16} fill={inWishlist ? 'currentColor' : 'none'} />
                {inWishlist ? 'Saved' : 'Save for Later'}
              </Button>
            </div>
          )}

          {/* Trust card */}
          <div className="card p-4 space-y-3 text-sm text-gray-600">
            <div className="flex items-start gap-2.5">
              <Shield size={16} className="text-primary mt-0.5 shrink-0" />
              <span>eBay Clone Buyer Protection — covered on eligible purchases.</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Store size={16} className="text-primary shrink-0" />
              <span>Sold by <span className="font-semibold text-gray-900">{listing.sellerName}</span></span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-gray-400">
              <Package size={14} className="shrink-0" />
              <span>Listed on {formatDate(listing.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Description ── */}
      {listing.description && (
        <div className="card p-6">
          <h2 className="font-bold text-gray-900 text-lg mb-4">Item Description</h2>
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{listing.description}</p>
        </div>
      )}

      {/* ── Shipping & Returns ── */}
      <div className="card p-6">
        <h2 className="font-bold text-gray-900 text-lg mb-5">Shipping &amp; Returns</h2>
        <div className="grid sm:grid-cols-2 gap-5 text-sm text-gray-600">
          <div className="flex gap-3">
            <Package size={18} className="text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-gray-900 mb-1">Shipping</p>
              <p>{listing.freeShipping ? 'Free standard shipping included' : 'Shipping calculated at checkout'}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Shield size={18} className="text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-gray-900 mb-1">Returns</p>
              <p>30-day return policy. Item must be in original condition.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
