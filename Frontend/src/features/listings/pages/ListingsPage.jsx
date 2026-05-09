import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SlidersHorizontal, X, LayoutGrid, List } from 'lucide-react'
import { useListings } from '../hooks/useListings'
import ListingGrid from '../components/ListingGrid'
import { useDebounce } from '@/hooks/useDebounce'
import Breadcrumbs from '@/components/common/Breadcrumbs'
import { ROUTES } from '@/constants/routes'

const SORT_OPTIONS = [
  { label: 'Newest First', value: 'createdAt_desc' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Title A–Z', value: 'title_asc' },
]

function FilterPanel({ minPrice, setMinPrice, maxPrice, setMaxPrice, sortKey, setSortKey, onReset, setPage }) {
  return (
    <div className="space-y-6">
      {/* Sort */}
      <div>
        <p className="form-label">Sort By</p>
        <div className="space-y-0.5 mt-1">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setSortKey(opt.value); setPage(1) }}
              className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                sortKey === opt.value
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div>
        <p className="form-label">Price Range</p>
        <div className="flex items-center gap-2 mt-1">
          <input
            type="number"
            placeholder="Min $"
            value={minPrice}
            onChange={(e) => { setMinPrice(e.target.value); setPage(1) }}
            className="form-input text-xs py-2"
          />
          <span className="text-gray-400 shrink-0">—</span>
          <input
            type="number"
            placeholder="Max $"
            value={maxPrice}
            onChange={(e) => { setMaxPrice(e.target.value); setPage(1) }}
            className="form-input text-xs py-2"
          />
        </div>
      </div>

      {/* Condition */}
      <div>
        <p className="form-label">Condition</p>
        <div className="space-y-1.5 mt-1">
          {['New', 'Like New', 'Good', 'Acceptable'].map((c) => (
            <label key={c} className="flex items-center gap-2.5 cursor-pointer text-sm text-gray-700 hover:text-primary">
              <input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary" />
              {c}
            </label>
          ))}
        </div>
      </div>

      {/* Shipping */}
      <div>
        <p className="form-label">Shipping</p>
        <label className="flex items-center gap-2.5 cursor-pointer text-sm text-gray-700 hover:text-primary mt-1">
          <input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary" />
          Free shipping only
        </label>
      </div>

      <button
        onClick={onReset}
        className="w-full text-xs text-gray-400 hover:text-red-500 transition-colors pt-2 border-t border-gray-100"
      >
        Clear all filters
      </button>
    </div>
  )
}

export default function ListingsPage() {
  const [searchParams] = useSearchParams()
  const [page, setPage] = useState(1)
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sortKey, setSortKey] = useState('createdAt_desc')
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const q = searchParams.get('q') || ''
  const category = searchParams.get('category') || ''
  const debouncedQ = useDebounce(q, 400)
  const [sortBy, sortDir] = sortKey.split('_')

  const { data, isLoading } = useListings({
    page,
    pageSize: 24,
    status: 1,
    search: debouncedQ || undefined,
    category: category || undefined,
    minPrice: minPrice || undefined,
    maxPrice: maxPrice || undefined,
    sortBy,
    sortDirection: sortDir,
  })

  const handlePageChange = (p) => {
    setPage(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleReset = () => {
    setMinPrice('')
    setMaxPrice('')
    setSortKey('createdAt_desc')
    setPage(1)
  }

  const activeFilterCount = [minPrice, maxPrice].filter(Boolean).length

  const breadcrumbs = [
    ...(category ? [{ label: decodeURIComponent(category), to: `${ROUTES.LISTINGS}?category=${category}` }] : [{ label: 'All Listings' }]),
    ...(q ? [{ label: `"${q}"` }] : []),
  ]

  return (
    <div>
      {/* Breadcrumbs */}
      <div className="mb-4">
        <Breadcrumbs items={breadcrumbs} />
      </div>

      {/* Page header */}
      <div className="flex flex-wrap items-end gap-3 mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {q ? `Results for "${q}"` : category ? decodeURIComponent(category) : 'All Listings'}
          </h1>
          {data?.data?.totalCount != null && !isLoading && (
            <p className="text-sm text-gray-500 mt-0.5">
              {data.data.totalCount.toLocaleString()} {data.data.totalCount === 1 ? 'item' : 'items'} found
            </p>
          )}
        </div>

        {/* Mobile filter toggle */}
        <button
          onClick={() => setMobileFiltersOpen(true)}
          className="lg:hidden ml-auto flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:border-primary hover:text-primary bg-white transition-colors"
        >
          <SlidersHorizontal size={15} />
          Filters
          {activeFilterCount > 0 && (
            <span className="bg-primary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      <div className="flex gap-6">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-52 shrink-0">
          <div className="card p-4 sticky top-[108px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
                <SlidersHorizontal size={15} /> Filters
              </h3>
              {activeFilterCount > 0 && (
                <button onClick={handleReset} className="text-xs text-red-400 hover:text-red-600 transition-colors">
                  Reset
                </button>
              )}
            </div>
            <FilterPanel
              minPrice={minPrice} setMinPrice={setMinPrice}
              maxPrice={maxPrice} setMaxPrice={setMaxPrice}
              sortKey={sortKey} setSortKey={setSortKey}
              onReset={handleReset} setPage={setPage}
            />
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <ListingGrid data={data?.data} isLoading={isLoading} onPageChange={handlePageChange} />
        </div>
      </div>

      {/* Mobile filter bottom sheet */}
      {mobileFiltersOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50 lg:hidden"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="fixed bottom-0 inset-x-0 bg-white z-50 rounded-t-2xl shadow-2xl max-h-[85vh] flex flex-col lg:hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <SlidersHorizontal size={16} /> Filters
              </h3>
              <button onClick={() => setMobileFiltersOpen(false)} className="p-1 text-gray-400 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-5">
              <FilterPanel
                minPrice={minPrice} setMinPrice={setMinPrice}
                maxPrice={maxPrice} setMaxPrice={setMaxPrice}
                sortKey={sortKey} setSortKey={setSortKey}
                onReset={handleReset} setPage={setPage}
              />
            </div>
            <div className="p-4 border-t border-gray-100 shrink-0">
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full btn-primary py-3 rounded-xl text-sm"
              >
                Show Results
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
