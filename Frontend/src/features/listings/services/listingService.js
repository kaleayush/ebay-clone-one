import api from '@/services/api'
import { API_ENDPOINTS } from '@/constants/api'

export const listingService = {
  getAll: (params) => api.get(API_ENDPOINTS.LISTINGS.BASE, { params }),
  getById: (id) => api.get(API_ENDPOINTS.LISTINGS.BY_ID(id)),
  getMyListings: (params) => api.get(API_ENDPOINTS.LISTINGS.MY, { params }),
  create: (data) => api.post(API_ENDPOINTS.LISTINGS.BASE, data),
  update: (id, data) => api.put(API_ENDPOINTS.LISTINGS.BY_ID(id), data),
  delete: (id) => api.delete(API_ENDPOINTS.LISTINGS.BY_ID(id)),
}