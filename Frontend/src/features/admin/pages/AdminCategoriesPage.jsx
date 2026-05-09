import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import api from '@/services/api'
import { API_ENDPOINTS } from '@/constants/api'
import Button from '@/components/common/Button'
import Spinner from '@/components/common/Spinner'
import Modal from '@/components/common/Modal'
import Input from '@/components/common/Input'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

export default function AdminCategoriesPage() {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get(API_ENDPOINTS.CATEGORIES.BASE),
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const save = useMutation({
    mutationFn: (values) =>
      editing
        ? api.put(API_ENDPOINTS.CATEGORIES.BY_ID(editing.id), values)
        : api.post(API_ENDPOINTS.CATEGORIES.BASE, values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      toast.success(editing ? 'Category updated' : 'Category created')
      setModalOpen(false)
      setEditing(null)
      reset()
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Operation failed'),
  })

  const remove = useMutation({
    mutationFn: (id) => api.delete(API_ENDPOINTS.CATEGORIES.BY_ID(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Category deleted')
    },
  })

  const openCreate = () => {
    setEditing(null)
    reset({ name: '', description: '' })
    setModalOpen(true)
  }

  const openEdit = (cat) => {
    setEditing(cat)
    reset({ name: cat.name, description: cat.description })
    setModalOpen(true)
  }

  const categories = data?.data || []

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <Button onClick={openCreate}><Plus size={16} /> Add Category</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <div className="card divide-y divide-gray-100">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="font-medium text-gray-900">{cat.name}</p>
                {cat.description && <p className="text-xs text-gray-500">{cat.description}</p>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(cat)} className="p-1.5 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-md">
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => { if (confirm('Delete category?')) remove.mutate(cat.id) }}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
          {!categories.length && (
            <p className="px-4 py-8 text-center text-sm text-gray-500">No categories yet</p>
          )}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Category' : 'New Category'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit((d) => save.mutate(d))} loading={save.isPending}>
              {editing ? 'Save Changes' : 'Create'}
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          <Input label="Name" required error={errors.name?.message} {...register('name', { required: 'Required' })} />
          <div>
            <label className="form-label">Description</label>
            <textarea rows={3} className="form-input resize-none" {...register('description')} />
          </div>
        </form>
      </Modal>
    </div>
  )
}