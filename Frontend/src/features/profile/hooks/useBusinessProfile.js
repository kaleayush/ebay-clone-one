import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { businessProfileService } from '../services/businessProfileService'

const QUERY_KEY = ['business-profile']

export const useBusinessProfile = () => {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => businessProfileService.get(),
    select: (data) => data?.data ?? null,
    retry: false,
  })
}

export const useSubmitBusinessProfile = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: businessProfileService.submit,
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEY, data)
      toast.success('Business profile submitted for verification!')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Submission failed. Please try again.')
    },
  })
}

export const useUpdateBusinessProfile = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: businessProfileService.update,
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEY, data)
      toast.success('Business profile updated!')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Update failed. Please try again.')
    },
  })
}

export const useUploadDocument = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ file, documentType }) => businessProfileService.uploadDocument(file, documentType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      toast.success('Document uploaded successfully!')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Upload failed. Please try again.')
    },
  })
}

export const useDeleteDocument = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: businessProfileService.deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      toast.success('Document removed.')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Delete failed.')
    },
  })
}
