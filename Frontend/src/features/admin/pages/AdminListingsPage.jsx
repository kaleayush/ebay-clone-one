import { useEffect, useState } from 'react'
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

const sortOptions = [
  { value: 'createdAt_desc', label: 'Newest created' },
  { value: 'updatedAt_desc', label: 'Recently updated' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'title_asc', label: 'Title: A to Z' },
  { value: 'title_desc', label: 'Title: Z to A' },
  { value: 'seller_asc', label: 'Seller: A to Z' },
]

const pageSizeOptions = [15, 30, 50, 100]

export default function AdminListingsPage() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [visibility, setVisibility] = useState('')
  const [sortKey, setSortKey] = useState('createdAt_desc')
  const [sortBy, sortDirection] = sortKey.split('_')

  useEffect(() => {
    setPage(1)
  }, [pageSize, search, sortKey, status, visibility])

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'listings', page, pageSize, search, status, visibility, sortKey],
    queryFn: () => api.get(API_ENDPOINTS.ADMIN.LISTINGS, {
      params: {
        page,
        pageSize,
        search: search || undefined,
        status: status !== '' ? Number(status) : undefined,
        visibility: visibility || undefined,
        sortBy,
        sortDirection,
      },
    }),
  })

  const listings = data?.items || data?.data?.items || []
  const totalPages = data?.totalPages || data?.data?.totalPages || 1
  const totalCount = data?.totalCount || data?.data?.totalCount || 0

  const resetFilters = () => {
    setSearch('')
    setStatus('')
    setVisibility('')
    setSortKey('createdAt_desc')
    setPageSize(15)
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Listings</h1>
        <p className="text-sm text-gray-500">{totalCount.toLocaleString()} total listings</p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_150px_140px_180px_110px_auto]">
          <input
            type="search"
            placeholder="Search title or seller"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input h-10 text-sm"
          />
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="form-input h-10 bg-white text-sm">
            <option value="">All statuses</option>
            {Object.values(ListingStatus).map((value) => (
              <option key={value} value={value}>{ListingStatusLabel[value]}</option>
            ))}
          </select>
          <select value={visibility} onChange={(e) => setVisibility(e.target.value)} className="form-input h-10 bg-white text-sm">
            <option value="">All visibility</option>
            <option value="active">Visible</option>
            <option value="deleted">Deleted</option>
          </select>
          <select value={sortKey} onChange={(e) => setSortKey(e.target.value)} className="form-input h-10 bg-white text-sm">
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} className="form-input h-10 bg-white text-sm">
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>{size} / page</option>
            ))}
          </select>
          <button type="button" onClick={resetFilters} className="h-10 rounded-md border border-gray-200 px-3 text-sm font-medium text-gray-600 hover:border-primary hover:text-primary">
            Reset
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <>
          <div className="card overflow-x-auto">
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
                    <td className="px-4 py-3 font-semibold">
                      <div className="flex items-baseline gap-2">
                        <span>{formatCurrency(listing.finalPrice ?? listing.price)}</span>
                        {Number(listing.discountAmount || 0) > 0 && (
                          <span className="text-xs font-normal text-gray-400 line-through">{formatCurrency(listing.price)}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant[listing.status]}>{ListingStatusLabel[listing.status]}</Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(listing.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!listings.length && (
              <p className="px-4 py-8 text-center text-sm text-gray-500">No listings found</p>
            )}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}
