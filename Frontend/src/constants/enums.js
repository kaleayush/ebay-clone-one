export const AccountType = {
  PERSONAL: 0,
  BUSINESS: 1,
}

export const AccountTypeLabel = {
  [AccountType.PERSONAL]: 'Personal',
  [AccountType.BUSINESS]: 'Business',
}

export const ListingStatus = {
  DRAFT: 0,
  ACTIVE: 1,
  SOLD: 2,
  ENDED: 3,
  REMOVED: 4,
}

export const ListingStatusLabel = {
  [ListingStatus.DRAFT]: 'Draft',
  [ListingStatus.ACTIVE]: 'Active',
  [ListingStatus.SOLD]: 'Sold',
  [ListingStatus.ENDED]: 'Ended',
  [ListingStatus.REMOVED]: 'Removed',
}

export const ListingType = {
  FIXED_PRICE: 0,
  AUCTION: 1,
}

export const ListingTypeLabel = {
  [ListingType.FIXED_PRICE]: 'Fixed Price',
  [ListingType.AUCTION]: 'Auction',
}

export const AttributeDataType = {
  TEXT: 0,
  NUMBER: 1,
  DECIMAL: 2,
  BOOLEAN: 3,
  DATE: 4,
  DROPDOWN: 5,
  MULTI_SELECT: 6,
}

export const OrderStatus = {
  PENDING: 0,
  CONFIRMED: 1,
  SHIPPED: 2,
  DELIVERED: 3,
  CANCELLED: 4,
  REFUNDED: 5,
}

export const OrderStatusLabel = {
  [OrderStatus.PENDING]: 'Pending',
  [OrderStatus.CONFIRMED]: 'Confirmed',
  [OrderStatus.SHIPPED]: 'Shipped',
  [OrderStatus.DELIVERED]: 'Delivered',
  [OrderStatus.CANCELLED]: 'Cancelled',
  [OrderStatus.REFUNDED]: 'Refunded',
}

export const UserRole = {
  USER: 'User',
  ADMIN: 'Admin',
}

export const VerificationStatus = {
  PENDING: 'Pending',
  UNDER_REVIEW: 'UnderReview',
  VERIFIED: 'Verified',
  REJECTED: 'Rejected',
}

export const VerificationStatusLabel = {
  [VerificationStatus.PENDING]: 'Pending Review',
  [VerificationStatus.UNDER_REVIEW]: 'Under Review',
  [VerificationStatus.VERIFIED]: 'Verified',
  [VerificationStatus.REJECTED]: 'Rejected',
}

export const DocumentType = {
  GST_CERTIFICATE: 0,
  PAN_CARD: 1,
  BUSINESS_REGISTRATION: 2,
  ADDRESS_PROOF: 3,
  OTHER: 4,
}

export const DocumentTypeLabel = {
  [DocumentType.GST_CERTIFICATE]: 'GST Certificate',
  [DocumentType.PAN_CARD]: 'PAN Card',
  [DocumentType.BUSINESS_REGISTRATION]: 'Business Registration',
  [DocumentType.ADDRESS_PROOF]: 'Address Proof',
  [DocumentType.OTHER]: 'Other Document',
}

export const SortDirection = {
  ASC: 'asc',
  DESC: 'desc',
}
