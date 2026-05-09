import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import Input from '@/components/common/Input'
import Button from '@/components/common/Button'
import Spinner from '@/components/common/Spinner'
import { useListing, LISTING_KEYS } from '../hooks/useListings'
import { listingService } from '../services/listingService'
import { ROUTES } from '@/constants/routes'
import { useEffect } from 'react'

const schema = z.object({
  title: z.string().min(3).max(80),
  description: z.string().min(10),
  price: z.coerce.number().positive(),
  quantity: z.coerce.number().int().min(1),
  freeShipping: z.boolean().optional(),
})

export default function EditListingPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { data, isLoading } = useListing(id)

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (data?.data) {
      const l = data.data
      reset({ title: l.title, description: l.description, price: l.price, quantity: l.quantity, freeShipping: l.freeShipping })
    }
  }, [data, reset])

  const { mutate: update, isPending } = useMutation({
    mutationFn: (values) => listingService.update(id, values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LISTING_KEYS.all })
      toast.success('Listing updated!')
      navigate(ROUTES.MY_LISTINGS)
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Update failed'),
  })

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Listing</h1>
      <form onSubmit={handleSubmit(update)} className="card p-6 space-y-5">
        <Input label="Title" required error={errors.title?.message} {...register('title')} />
        <div>
          <label className="form-label">Description <span className="text-red-500">*</span></label>
          <textarea rows={5} className={`form-input resize-none ${errors.description ? 'border-red-400' : ''}`} {...register('description')} />
          {errors.description && <p className="form-error">{errors.description.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Price (USD)" type="number" step="0.01" error={errors.price?.message} {...register('price')} />
          <Input label="Quantity" type="number" error={errors.quantity?.message} {...register('quantity')} />
        </div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" className="w-4 h-4 text-primary rounded border-gray-300" {...register('freeShipping')} />
          <span className="text-sm font-medium text-gray-700">Free shipping</span>
        </label>
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={() => navigate(ROUTES.MY_LISTINGS)}>Cancel</Button>
          <Button type="submit" loading={isPending} className="flex-1">Save Changes</Button>
        </div>
      </form>
    </div>
  )
}