# Database

Engine: SQL Server 2022  
ORM: Entity Framework Core 8 (code-first)  
Auto-migrate on startup: `db.Database.MigrateAsync()` in `Program.cs`

## BaseEntity (all entities extend this)
| Field | Type | Notes |
|-------|------|-------|
| Id | Guid | PK, default new Guid |
| CreatedAt | DateTime | UTC |
| UpdatedAt | DateTime | UTC |
| IsDeleted | bool | soft-delete flag |
| DeletedAt | DateTime? | set on soft delete |

EF query filters exclude `IsDeleted=true` globally via `IEntityTypeConfiguration`.

---

## Entities

### User
| Field | Type | Nullable |
|-------|------|----------|
| FirstName | string | ✗ |
| LastName | string | ✗ |
| Email | string | ✗ unique |
| PasswordHash | string | ✗ |
| AccountType | AccountType | ✗ default=Personal |
| Role | UserRole | ✗ default=User |
| IsEmailVerified | bool | ✗ |
| PhoneNumber | string | ✓ |
| AvatarUrl | string | ✓ |
| IsSuspended | bool | ✗ |
| EmailVerificationToken | string | ✓ |
| EmailVerificationTokenExpiry | DateTime | ✓ |
| PasswordResetToken | string | ✓ |
| PasswordResetTokenExpiry | DateTime | ✓ |
| **Nav** | Listings, ListingViews, BuyerOrders, RefreshTokens, Cart?, BusinessProfile? | |

### Listing
| Field | Type | Nullable |
|-------|------|----------|
| Title | string | ✗ |
| Description | string | ✗ |
| ListingType | ListingType | ✗ default=FixedPrice |
| Price | decimal | ✗ |
| DiscountAmount | decimal | ✗ default=0 |
| StartingBid | decimal | ✓ (Auction) |
| ReservePrice | decimal | ✓ (Auction) |
| BuyItNowPrice | decimal | ✓ (Auction) |
| AuctionStartAt | DateTime | ✓ |
| AuctionEndAt | DateTime | ✓ |
| Quantity | int | ✗ |
| FreeShipping | bool | ✗ |
| Status | ListingStatus | ✗ default=Draft |
| PrimaryImageUrl | string | ✓ |
| SellerId | Guid | ✗ FK→User |
| CategoryId | Guid | ✓ FK→Category |
| HasPendingVersion | bool | ✗ |
| **Nav** | Seller, Category?, Images, AttributeValues, OrderItems, CartItems, Views, Versions, ApprovalLogs | |

### ListingImage
| Field | Type | Nullable |
|-------|------|----------|
| ListingId | Guid | ✗ FK→Listing |
| Url | string | ✗ |
| AltText | string | ✓ |
| SortOrder | int | ✗ |

### ListingView
| Field | Type | Nullable |
|-------|------|----------|
| ListingId | Guid | ✗ FK→Listing |
| UserId | Guid | ✗ FK→User |
| ViewedAt | DateTime | ✗ |

### ListingVersion
| Field | Type | Nullable |
|-------|------|----------|
| ListingId | Guid | ✗ FK→Listing |
| VersionNumber | int | ✗ |
| IsPendingUpdate | bool | ✗ |
| Status | ListingVersionStatus | ✗ |
| RejectionReason | string | ✓ |
| ReviewedByAdminId | Guid | ✓ FK→User |
| ReviewedAt | DateTime | ✓ |
| SubmittedAt | DateTime | ✗ |
| Snapshot | string | ✓ (JSON) |

### ListingApprovalLog
| Field | Type | Nullable |
|-------|------|----------|
| ListingId | Guid | ✗ FK→Listing |
| AdminId | Guid | ✗ FK→User |
| Action | ApprovalAction | ✗ |
| Notes | string | ✓ |
| ActionAt | DateTime | ✗ |

### Category
| Field | Type | Nullable |
|-------|------|----------|
| Name | string | ✗ |
| Description | string | ✓ |
| ImageUrl | string | ✓ |
| SortOrder | int | ✗ |
| ParentCategoryId | Guid | ✓ FK→Category (self-ref) |
| **Nav** | ParentCategory?, SubCategories, Attributes, Listings | |

### CategoryAttribute
| Field | Type | Nullable |
|-------|------|----------|
| CategoryId | Guid | ✗ FK→Category |
| Name | string | ✗ |
| DisplayName | string | ✗ |
| Description | string | ✓ |
| DataType | AttributeDataType | ✗ |
| IsRequired | bool | ✗ |
| IsFilterable | bool | ✗ |
| SortOrder | int | ✗ |
| Placeholder | string | ✓ |
| Unit | string | ✓ |
| MinLength | int | ✓ |
| MaxLength | int | ✓ |
| MinValue | decimal | ✓ |
| MaxValue | decimal | ✓ |
| RegexPattern | string | ✓ |
| ConditionAttributeId | Guid | ✓ FK→CategoryAttribute (self-ref) |
| ConditionOperator | ConditionalOperator | ✓ |
| ConditionValue | string | ✓ |
| **Nav** | Category, ConditionAttribute?, Options, ListingValues | |

### AttributeOption
| Field | Type | Nullable |
|-------|------|----------|
| CategoryAttributeId | Guid | ✗ FK→CategoryAttribute |
| Value | string | ✗ |
| DisplayValue | string | ✗ |
| SortOrder | int | ✗ |

### ListingAttributeValue
| Field | Type | Nullable |
|-------|------|----------|
| ListingId | Guid | ✗ FK→Listing |
| CategoryAttributeId | Guid | ✗ FK→CategoryAttribute |
| Value | string | ✓ |

### Order
| Field | Type | Nullable |
|-------|------|----------|
| OrderNumber | string | ✗ unique |
| TotalAmount | decimal | ✗ |
| Status | OrderStatus | ✗ default=Pending |
| ShippingAddress | string | ✓ |
| Notes | string | ✓ |
| BuyerId | Guid | ✗ FK→User |
| **Nav** | Buyer, Items | |

### OrderItem
| Field | Type | Nullable |
|-------|------|----------|
| OrderId | Guid | ✗ FK→Order |
| ListingId | Guid | ✗ FK→Listing |
| Quantity | int | ✗ |
| UnitPrice | decimal | ✗ |

### Cart
| Field | Type | Nullable |
|-------|------|----------|
| UserId | Guid | ✗ FK→User unique |
| **Nav** | User, Items | |

### CartItem
| Field | Type | Nullable |
|-------|------|----------|
| CartId | Guid | ✗ FK→Cart |
| ListingId | Guid | ✗ FK→Listing |
| Quantity | int | ✗ |

### BusinessProfile
| Field | Type | Nullable |
|-------|------|----------|
| CompanyName | string | ✗ |
| GstNumber | string | ✗ |
| PanNumber | string | ✗ |
| BusinessAddress | string | ✓ |
| BusinessPhone | string | ✓ |
| BusinessEmail | string | ✓ |
| BusinessWebsite | string | ✓ |
| VerificationStatus | VerificationStatus | ✗ default=Pending |
| RejectionReason | string | ✓ |
| VerifiedAt | DateTime | ✓ |
| VerifiedByAdminId | Guid | ✓ FK→User |
| UserId | Guid | ✗ FK→User unique |
| **Nav** | User, Documents | |

### UserDocument
| Field | Type | Nullable |
|-------|------|----------|
| BusinessProfileId | Guid | ✗ FK→BusinessProfile |
| FileName | string | ✗ |
| FileUrl | string | ✗ |
| DocumentType | DocumentType | ✗ |
| FileSizeBytes | long | ✗ |
| ContentType | string | ✗ |

### RefreshToken
| Field | Type | Nullable |
|-------|------|----------|
| Token | string | ✗ |
| UserId | Guid | ✗ FK→User |
| ExpiresAt | DateTime | ✗ |
| IsRevoked | bool | ✗ |

### EmailTemplate
| Field | Type | Nullable |
|-------|------|----------|
| Name | string | ✗ |
| Subject | string | ✗ |
| HtmlBody | string | ✗ |
| TemplateType | EmailTemplateType | ✗ |
| IsActive | bool | ✗ |
| Version | int | ✗ |

---

## Enums

| Enum | Values (int) |
|------|-------------|
| AccountType | Personal=0, Business=1 |
| UserRole | User=0, Admin=1 |
| ListingStatus | Draft=0, Active=1, Sold=2, Ended=3, Removed=4, PendingApproval=5, Rejected=6 |
| ListingType | FixedPrice=0, Auction=1 |
| OrderStatus | Pending=0, Confirmed=1, Shipped=2, Delivered=3, Cancelled=4, Refunded=5 |
| AttributeDataType | Text=0, Number=1, Decimal=2, Boolean=3, Date=4, Dropdown=5, MultiSelect=6 |
| ConditionalOperator | Equals=0, NotEquals=1, Contains=2, GreaterThan=3, LessThan=4 |
| VerificationStatus | Pending=0, UnderReview=1, Verified=2, Rejected=3 |
| DocumentType | GstCertificate=0, PanCard=1, BusinessRegistration=2, AddressProof=3, Other=4 |
| EmailTemplateType | EmailVerification=0, ForgotPassword=1, PasswordChanged=2, ListingPendingApproval=3, ListingApproved=4, ListingRejected=5 |
| ListingVersionStatus | PendingApproval=0, Approved=1, Rejected=2 |
| ApprovalAction | Submitted=0, Approved=1, Rejected=2 |

---

## EF Configuration Notes
- All entity configs in `EBayClone.Infrastructure/Data/Configurations/`
- Each implements `IEntityTypeConfiguration<T>`
- Must include: soft-delete query filter, required fields, FK constraints, index on email/unique fields
- Seeder IDs: deterministic MD5 GUIDs via `CreateGuid(string key)` — category/attribute seeds never duplicate

## Migrations
Location: `EBayClone.Infrastructure/Migrations/`

```bash
# Add migration
dotnet ef migrations add <Name> \
  --project src/EBayClone.Infrastructure \
  --startup-project src/EBayClone.API

# Apply manually (CI / fresh env)
dotnet ef database update \
  --project src/EBayClone.Infrastructure \
  --startup-project src/EBayClone.API
```

Auto-applied on startup — manual only needed for CI or fresh environments.
