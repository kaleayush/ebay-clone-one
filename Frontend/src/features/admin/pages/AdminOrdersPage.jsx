import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'
import { API_ENDPOINTS } from '@/constants/api'
import Badge from '@/components/common/Badge'
import Spinner from '@/components/common/Spinner'
import Pagination from '@/components/common/Pagination'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { OrderStatus, OrderStatusLabel } from '@/constants/enums'

const statusVariant = {
  [OrderStatus.PENDING]: 'warning',
  [OrderStatus.CONFIRMED]: 'primary',
  [OrderStatus.SHIPPED]: 'info',
  [OrderStatus.DELIVERED]: 'success',
  [OrderStatus.CANCELLED]: 'danger',
  [OrderStatus.REFUNDED]: 'default',
}

const sortOptions = [
  { value: 'createdAt_desc', label: 'Newest orders' },
  { value: 'createdAt_asc', label: 'Oldest orders' },
  { value: 'totalAmount_desc', label: 'Total: high to low' },
  { value: 'totalAmount_asc', label: 'Total: low to high' },
  { value: 'buyer_asc', label: 'Buyer: A to Z' },
  { value: 'orderNumber_desc', label: 'Order #: high to low' },
  { value: 'itemCount_desc', label: 'Most items' },
]

const pageSizeOptions = [15, 30, 50, 100]

export default function AdminOrdersPage() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [sortKey, setSortKey] = useState('createdAt_desc')
  const [sortBy, sortDirection] = sortKey.split('_')

  useEffect(() => {
    setPage(1)
  }, [pageSize, search, sortKey, status])

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'orders', page, pageSize, search, status, sortKey],
    queryFn: () => api.get(API_ENDPOINTS.ADMIN.ORDERS, {
      params: {
        page,
        pageSize,
        search: search || undefined,
        status: status !== '' ? Number(status) : undefined,
        sortBy,
        sortDirection,
      },
    }),
  })

  const orders = data?.items || data?.data?.items || []
  const totalPages = data?.totalPages || data?.data?.totalPages || 1
  const totalCount = data?.totalCount || data?.data?.totalCount || 0

  const resetFilters = () => {
    setSearch('')
    setStatus('')
    setSortKey('createdAt_desc')
    setPageSize(15)
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="text-sm text-gray-500">{totalCount.toLocaleString()} total orders</p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_160px_190px_110px_auto]">
          <input
            type="search"
            placeholder="Search order, buyer, email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input h-10 text-sm"
          />
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="form-input h-10 bg-white text-sm">
            <option value="">All statuses</option>
            {Object.values(OrderStatus).map((value) => (
              <option key={value} value={value}>{OrderStatusLabel[value]}</option>
            ))}
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
                  {['Order #', 'Buyer', 'Items', 'Total', 'Status', 'Date'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">#{order.orderNumber}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{order.buyerName}</td>
                    <td className="px-4 py-3 text-gray-500">{order.itemCount}</td>
                    <td className="px-4 py-3 font-semibold">{formatCurrency(order.totalAmount)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant[order.status]}>{OrderStatusLabel[order.status]}</Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(order.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!orders.length && (
              <p className="px-4 py-8 text-center text-sm text-gray-500">No orders found</p>
            )}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}
