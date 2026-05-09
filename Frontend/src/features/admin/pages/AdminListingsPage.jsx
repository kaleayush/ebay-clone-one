import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'
import { API_ENDPOINTS } from '@/constants/api'
import Badge from '@/components/common/Badge'
import Spinner from '@/components/common/Spinner'
import Pagination from '@/components/common/Pagination'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { ListingStatus, ListingStatusLabel } from '@/constants/enums'

const statusVariant = {
  [ListingStatus.DRAFT]: 'default',
  [ListingStatus.ACTIVE]: 'success',
  [ListingStatus.SOLD]: 'primary',
  [ListingStatus.ENDED]: 'warning',
  [ListingStatus.REMOVED]: 'danger',
}

export default function AdminListingsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'listings', page, search],
    queryFn: () => api.get(API_ENDPOINTS.ADMIN.LISTINGS, { params: { page, pageSize: 15, search: search || undefined } }),
  })

  const listings = data?.items || data?.data?.items || []
  const totalPages = data?.totalPages || data?.data?.totalPages || 1

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Listings</h1>
        <input
          type="text"
          placeholder="Search listings..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="form-input w-56"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Title', 'Seller', 'Price', 'Status', 'Created'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {listings.map((listing) => (
                  <tr key={listing.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">{listing.title}</td>
                    <td className="px-4 py-3 text-gray-500">{listing.sellerName}</td>
                    <td className="px-4 py-3 font-semibold">{formatCurrency(listing.price)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant[listing.status]}>{ListingStatusLabel[listing.status]}</Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(listing.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}
