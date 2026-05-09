import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import Input from '@/components/common/Input'
import Select from '@/components/common/Select'
import Button from '@/components/common/Button'
import { useCreateListing } from '../hooks/useListings'
import { ROUTES } from '@/constants/routes'

const schema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(80),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.coerce.number().positive('Price must be positive'),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
  freeShipping: z.boolean().optional(),
})

const statusOptions = [
  { value: 0, label: 'Save as Draft' },
  { value: 1, label: 'Publish Now' },
]

export default function CreateListingPage() {
  const navigate = useNavigate()
  const { mutate: createListing, isPending } = useCreateListing()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { quantity: 1, freeShipping: false },
  })

  const onSubmit = (data) => {
    createListing(data, {
      onSuccess: () => navigate(ROUTES.MY_LISTINGS),
    })
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create a Listing</h1>
        <p className="text-sm text-gray-500 mt-1">Fill in the details to list your item for sale</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-5">
        <Input
          label="Title"
          placeholder="What are you selling?"
          required
          error={errors.title?.message}
          {...register('title')}
        />

        <div>
          <label className="form-label">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={5}
            placeholder="Describe your item in detail (condition, features, dimensions, etc.)"
            className={`form-input resize-none ${errors.description ? 'border-red-400' : ''}`}
            {...register('description')}
          />
          {errors.description && <p className="form-error">{errors.description.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Price (USD)"
            type="number"
            step="0.01"
            placeholder="0.00"
            required
            error={errors.price?.message}
            {...register('price')}
          />
          <Input
            label="Quantity"
            type="number"
            placeholder="1"
            required
            error={errors.quantity?.message}
            {...register('quantity')}
          />
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4 text-primary rounded border-gray-300"
            {...register('freeShipping')}
          />
          <span className="text-sm font-medium text-gray-700">Offer free shipping</span>
        </label>

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate(ROUTES.MY_LISTINGS)}
          >
            Cancel
          </Button>
          <Button type="submit" loading={isPending} className="flex-1">
            Create Listing
          </Button>
        </div>
      </form>
    </div>
  )
}