import { useNavigate } from 'react-router-dom'
import Button from '@/components/common/Button'
import ListingForm from '../components/ListingForm'
import { useCreateListing } from '../hooks/useListings'
import { ROUTES } from '@/constants/routes'

export default function CreateListingPage() {
  const navigate = useNavigate()
  const { mutate: createListing, isPending } = useCreateListing()

  const handleSubmit = (data) => {
    createListing(data, {
      onSuccess: () => navigate(ROUTES.MY_LISTINGS),
    })
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create a Listing</h1>
          <p className="text-sm text-gray-500 mt-1">Choose a child category to load the right listing form.</p>
        </div>
        <Button variant="ghost" onClick={() => navigate(ROUTES.MY_LISTINGS)}>Cancel</Button>
      </div>

      <ListingForm onSubmit={handleSubmit} isPending={isPending} submitLabel="Create Listing" />
    </div>
  )
}
