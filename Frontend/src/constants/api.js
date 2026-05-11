export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    REGISTER: '/api/v1/auth/register',
    REFRESH: '/api/v1/auth/refresh',
    LOGOUT: '/api/v1/auth/logout',
    ME: '/api/v1/auth/me',
    VERIFY_EMAIL: '/api/v1/auth/verify-email',
    RESEND_VERIFICATION: '/api/v1/auth/resend-verification',
    FORGOT_PASSWORD: '/api/v1/auth/forgot-password',
    RESET_PASSWORD: '/api/v1/auth/reset-password',
  },
  // Listings
  LISTINGS: {
    BASE: '/api/v1/listings',
    BY_ID: (id) => `/api/v1/listings/${id}`,
    MY: '/api/v1/listings/my',
    RESTORE: (id) => `/api/v1/listings/${id}/restore`,
    RECENTLY_VIEWED: '/api/v1/listings/recently-viewed',
    VIEW: (id) => `/api/v1/listings/${id}/views`,
    IMAGES: '/api/v1/listings/images',
    AUTOCOMPLETE: '/api/v1/listings/autocomplete',
    FACETS: '/api/v1/listings/facets',
  },
  // Categories
  CATEGORIES: {
    BASE: '/api/v1/categories',
    BY_ID: (id) => `/api/v1/categories/${id}`,
    TREE: '/api/v1/categories/tree',
    METADATA: (id) => `/api/v1/categories/${id}/metadata`,
    ATTRIBUTES: (id) => `/api/v1/categories/${id}/attributes`,
    ATTRIBUTE_BY_ID: (id, attributeId) => `/api/v1/categories/${id}/attributes/${attributeId}`,
  },
  // Cart
  CART: {
    BASE: '/api/v1/cart',
    ADD: '/api/v1/cart/items',
    REMOVE: (itemId) => `/api/v1/cart/items/${itemId}`,
    CHECKOUT: '/api/v1/cart/checkout',
    CLEAR: '/api/v1/cart/clear',
  },
  // Orders
  ORDERS: {
    BASE: '/api/v1/orders',
    BY_ID: (id) => `/api/v1/orders/${id}`,
    CANCEL: (id) => `/api/v1/orders/${id}/cancel`,
  },
  // Users
  USERS: {
    BASE: '/api/v1/users',
    BY_ID: (id) => `/api/v1/users/${id}`,
    PROFILE: '/api/v1/users/profile',
    SUSPEND: (id) => `/api/v1/users/${id}/suspend`,
    ACTIVATE: (id) => `/api/v1/users/${id}/activate`,
  },
  // Business Profile
  BUSINESS_PROFILE: {
    BASE: '/api/v1/business-profile',
    DOCUMENTS: '/api/v1/business-profile/documents',
    DOCUMENT_BY_ID: (id) => `/api/v1/business-profile/documents/${id}`,
  },
  // Admin
  ADMIN: {
    STATS: '/api/v1/admin/stats',
    USERS: '/api/v1/admin/users',
    USER_SUSPEND: (id) => `/api/v1/admin/users/${id}/suspend`,
    USER_ACTIVATE: (id) => `/api/v1/admin/users/${id}/activate`,
    LISTINGS: '/api/v1/admin/listings',
    ORDERS: '/api/v1/admin/orders',
    BUSINESS_PROFILES: '/api/v1/admin/business-profiles',
    BUSINESS_PROFILE_REVIEW: (id) => `/api/v1/admin/business-profiles/${id}/review`,
  },
}
