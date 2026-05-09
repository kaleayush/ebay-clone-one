import ListingCard from './ListingCard'
import Spinner from '@/components/common/Spinner'
import Pagination from '@/components/common/Pagination'

export default function ListingGrid({ data, isLoading, onPageChange }) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!data?.items?.length) {
    return (
      <div className="text-center py-20">
        <p className="text-5xl mb-4">🔍</p>
        <p className="text-lg font-semibold text-gray-700">No listings found</p>
        <p className="text-sm text-gray-500 mt-1">Try adjusting your filters or search terms</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
        {data.items.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
      <Pagination
        page={data.page}
        totalPages={data.totalPages}
        onPageChange={onPageChange}
      />
    </>
  )
}