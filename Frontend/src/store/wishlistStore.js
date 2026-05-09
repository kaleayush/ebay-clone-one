import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useWishlistStore = create(
  persist(
    (set, get) => ({
      items: [],

      addItem: (listing) => {
        const { items } = get()
        if (!items.find((i) => i.id === listing.id)) {
          set({ items: [...items, listing] })
        }
      },

      removeItem: (listingId) => {
        set({ items: get().items.filter((i) => i.id !== listingId) })
      },

      toggleItem: (listing) => {
        const { items } = get()
        const exists = items.find((i) => i.id === listing.id)
        if (exists) {
          set({ items: items.filter((i) => i.id !== listing.id) })
        } else {
          set({ items: [...items, listing] })
        }
      },

      isInWishlist: (listingId) => get().items.some((i) => i.id === listingId),

      clearWishlist: () => set({ items: [] }),
    }),
    { name: 'wishlist-storage' }
  )
)
