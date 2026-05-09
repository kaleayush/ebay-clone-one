import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useMyListings, useDeleteListing } from '@/features/listings/hooks/useListings'
import Badge from '@/components/common/Badge'
import Button from '@/components/common/Button'
import Spinner from '@/components/common/Spinner'
import Pagination from '@/components/common/Pagination'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { ListingStatus, ListingStatusLabel } from '@/constants/enums'
import { buildRoute, ROUTES } from '@/constants/routes'

const statusVariant = {
  [ListingStatus.DRAFT]: 'default',
  [ListingStatus.ACTIVE]: 'success',
  [ListingStatus.SOLD]: 'primary',
  [ListingStatus.ENDED]: 'warning',
  [ListingStatus.REMOVED]: 'danger',
}

export default function MyListingsPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useMyListings({ page, pageSize: 10 })
  const { mutate: deleteListing } = useDeleteListing()

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  const listings = data?.data?.items || []
  const totalPages = data?.data?.totalPages || 1

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
        <Link to={ROUTES.CREATE_LISTING}>
          <Button><Plus size={16} /> New Listing</Button>
        </Link>
      </div>

      {!listings.length ? (
        <div className="card p-12 text-center">
          <p className="text-4xl mb-3">📦</p>
          <p className="font-semibold text-gray-700">No listings yet</p>
          <p className="text-sm text-gray-500 mt-1 mb-5">Start selling by creating your first listing</p>
          <Link to={ROUTES.CREATE_LISTING}><Button>Create Listing</Button></Link>
        </div>
      ) : (
        <>
          <div className="card divide-y divide-gray-100">
            {listings.map((listing) => (
              <div key={listing.id} className="flex items-center gap-4 p-4">
                <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                  {listing.primaryImageUrl
                    ? <img src={listing.primaryImageUrl} alt="" className="w-full h-full object-cover rounded-lg" />
                    : '📦'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{listing.title}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <Badge variant={statusVariant[listing.status]}>{ListingStatusLabel[listing.status]}</Badge>
                    <span className="text-xs text-gray-500">{formatDate(listing.createdAt)}</span>
                  </div>
                </div>
                <p className="font-bold text-gray-900 text-sm">{formatCurrency(listing.price)}</p>
                <div className="flex items-center gap-2">
                  <Link to={buildRoute(ROUTES.EDIT_LISTING, { id: listing.id })}>
                    <button className="p-1.5 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-md">
                      <Pencil size={16} />
                    </button>
                  </Link>
                  <button
                    onClick={() => {
                      if (confirm('Delete this listing?')) deleteListing(listing.id)
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}