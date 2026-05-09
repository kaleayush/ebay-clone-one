# Skill.md — eBay Clone Enterprise Coding Standards

## 1. Architecture Rules

### Onion Architecture (Backend)
- Dependencies point **inward only**: API → Infrastructure → Application → Domain
- Domain layer has **zero external dependencies** (no NuGet packages except core .NET)
- Application layer depends only on Domain interfaces, never on Infrastructure
- Infrastructure implements Domain/Application interfaces
- API layer is the composition root — wires everything together in `Program.cs`

### Feature-Based Architecture (Frontend)
- Code is organized by **business domain**, not technical type
- Each feature is self-contained: `components/`, `hooks/`, `pages/`, `services/`
- Shared code lives in `src/components/common/`, `src/hooks/`, `src/services/`
- No cross-feature imports — features communicate via shared state (Zustand) or props

---

## 2. Naming Conventions

### Backend (C#)
| Artifact | Convention | Example |
|---|---|---|
| Classes | PascalCase | `UserService` |
| Interfaces | `I` + PascalCase | `IUserService` |
| Methods | PascalCase | `GetByIdAsync` |
| Properties | PascalCase | `FirstName` |
| Local vars | camelCase | `currentUser` |
| Private fields | `_` + camelCase | `_userRepository` |
| Constants | PascalCase | `MaxPageSize` |
| DTOs (Request) | `[Action][Entity]Request` | `CreateListingRequest` |
| DTOs (Response) | `[Entity]Response` | `ListingResponse` |
| Controllers | `[Entity]sController` | `ListingsController` |
| Services | `[Entity]Service` | `ListingService` |
| Repositories | `[Entity]Repository` | `ListingRepository` |
| Configurations | `[Entity]Configuration` | `ListingConfiguration` |

### Frontend (JavaScript/JSX)
| Artifact | Convention | Example |
|---|---|---|
| Components | PascalCase | `ListingCard` |
| Pages | `[Name]Page` | `ListingDetailPage` |
| Hooks | `use` + PascalCase | `useListings` |
| Stores | `[name]Store` | `authStore` |
| Services | `[name]Service` | `listingService` |
| Utils | camelCase | `formatCurrency` |
| Constants | UPPER_SNAKE_CASE | `API_BASE_URL` |
| CSS classes | Tailwind utilities only | No custom CSS classes |

### Database
| Artifact | Convention | Example |
|---|---|---|
| Tables | PascalCase plural | `Listings`, `Users` |
| Columns | PascalCase | `FirstName`, `CreatedAt` |
| Primary Keys | `Id` (Guid) | `Id` |
| Foreign Keys | `[Entity]Id` | `SellerId`, `CategoryId` |
| Indexes | `IX_[Table]_[Column]` | `IX_Listings_SellerId` |
| Unique constraints | `UQ_[Table]_[Column]` | `UQ_Users_Email` |

---

## 3. Coding Standards

### Backend
- All service methods must be `async/await` returning `Task<T>`
- Use `CancellationToken` in all async methods
- Never throw exceptions for expected business scenarios — use `Result<T>` pattern or `ApiResponse<T>`
- Always use `ILogger<T>` for logging — never `Console.Write`
- Validate all inputs at the Application layer using FluentValidation
- Use AutoMapper for Domain-to-DTO mapping only (never map DTOs to Domain in repositories)
- Repository methods: `GetByIdAsync`, `GetAllAsync`, `AddAsync`, `UpdateAsync`, `DeleteAsync`
- Use `IQueryable<T>` for filterable queries; materialize with `ToListAsync()` at the service layer
- Global exception middleware handles all unhandled exceptions — controllers return success responses only

### Frontend
- Functional components only — no class components
- Props destructured in function signature
- Use React Hook Form for all forms — no uncontrolled inputs
- Use Zod for schema validation; pair with `@hookform/resolvers/zod`
- API calls via centralized Axios instance — never `fetch()` directly
- Loading, error, and empty states must be handled in every data-fetching component
- Use `@tanstack/react-query` for server state; Zustand for client/UI state
- Never store sensitive data (tokens) in `localStorage` — use `httpOnly` cookies or secure memory store

---

## 4. Frontend Rules

### Component Rules
- One component per file
- File name = component name (`ListingCard.jsx` exports `ListingCard`)
- Props types documented via JSDoc or PropTypes for shared components
- No inline styles — Tailwind only
- Responsive-first: mobile → tablet → desktop (`sm:`, `md:`, `lg:`, `xl:`)

### State Management
- Server state: React Query (`useQuery`, `useMutation`)
- Global client state: Zustand stores
- Form state: React Hook Form
- Component-local state: `useState`

### Routing
- All routes defined in `src/app/Router.jsx`
- Protected routes via `PrivateRoute` wrapper component
- Admin routes via `AdminRoute` wrapper (checks `role === 'Admin'`)
- Lazy load all page components with `React.lazy()`

### API Integration
- Base Axios instance in `src/services/api.js` with interceptors
- Request interceptor: attach Bearer token
- Response interceptor: handle 401 (refresh token), 403, 500
- Feature-level services wrap API calls and return typed data

---

## 5. Backend Rules

### Controller Rules
- Controllers are thin — delegate all logic to services immediately
- Return `IActionResult` or `ActionResult<T>`
- Use `[ApiController]`, `[Route("api/[controller]")]` attributes
- HTTP verbs: GET (read), POST (create), PUT (full update), PATCH (partial update), DELETE (soft delete)
- Endpoints return `ApiResponse<T>` wrapper for consistency

### Service Rules
- Business logic lives exclusively in Application services
- Services receive DTOs, return DTOs — never expose Domain entities
- Call `repository.SaveChangesAsync(ct)` after mutations — there is no Unit of Work
- Validate with FluentValidation before any DB operation

### Repository Rules
- Generic repository for CRUD: `IRepository<T>`
- Soft-delete filter applied globally via EF Core query filters
- Use `IRepository<T>.Query()` to get `IQueryable<T>` for filterable queries; materialize with `ToListAsync()` at the service layer
- All read-only queries use `AsNoTracking()`

---

## 6. Database Conventions

### Soft Delete Rules
- All entities inherit `BaseEntity` which includes `IsDeleted`, `DeletedAt`
- **Never** use physical DELETE — always set `IsDeleted = true`, `DeletedAt = DateTime.UtcNow`
- EF Core global query filter: `.HasQueryFilter(e => !e.IsDeleted)` on all entities
- Admin endpoints can query deleted records by calling `.IgnoreQueryFilters()`
- Cascade deletes are disabled — use soft-delete cascade manually in services

### BaseEntity
```csharp
public abstract class BaseEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }
}
```

### Migrations
- Use EF Core Code-First migrations
- Migration names: `[YYYYMMDD]_[Description]` (e.g., `20240101_InitialCreate`)
- Never edit existing migrations — create new ones
- Seed data via `ModelBuilder.HasData()` in configurations

---

## 7. Marketplace Rules

### User Account System
- Single `Users` table — no separate `Buyers` or `Sellers` tables
- `AccountType` enum: `Personal` = 0, `Business` = 1
- Every authenticated user can both list items (sell) and purchase items (buy)
- User's sell history: `Listings` where `SellerId = userId`
- User's purchase history: `Orders` where `BuyerId = userId`

### Listing Rules
- Listings have statuses: `Draft`, `Active`, `Sold`, `Ended`, `Removed`
- Only `Active` listings appear in public search/browse
- `Sold` status set automatically when order is completed for all quantity
- Sellers can only edit their own listings
- Admin can set any listing to `Removed` (soft discipline)

### Order Rules
- Orders created from cart checkout
- Order statuses: `Pending` → `Confirmed` → `Shipped` → `Delivered` | `Cancelled` | `Refunded`
- Once `Confirmed`, seller cannot cancel without admin intervention
- Payment processing is async — order starts as `Pending`

---

## 8. Dynamic Form Rules

- Forms built with React Hook Form + Zod schema validation
- Form schemas defined in `[feature]/schemas/[formName].schema.js`
- Validation errors displayed inline below each field
- Submit button disabled while `isSubmitting === true`
- Success/error feedback via `react-hot-toast`
- File uploads use `FormData` and dedicated upload endpoint
- Date pickers use browser-native `<input type="date">`

---

## 9. Security Rules

- Never log passwords, tokens, or PII
- All endpoints (except auth) require `[Authorize]` attribute
- Role-based access: `[Authorize(Roles = "Admin")]` for admin endpoints
- JWT tokens expire in 15 minutes; refresh tokens expire in 7 days
- Refresh tokens are stored hashed in the database
- CORS configured to allow only the frontend origin
- SQL injection impossible via EF Core parameterized queries
- XSS prevented by React's built-in escaping — never use `dangerouslySetInnerHTML`
- Input sanitization at Application layer before persistence

---

## 10. Error Handling

### Backend
- Global exception middleware returns consistent `ApiResponse<null>` with error details
- HTTP 400: Validation errors (FluentValidation failures)
- HTTP 401: Unauthenticated
- HTTP 403: Unauthorized (wrong role)
- HTTP 404: Resource not found
- HTTP 409: Conflict (duplicate email, etc.)
- HTTP 500: Unhandled server error (logged, generic message returned)

### Frontend
- React Query error states render `<ErrorAlert>` component
- Network errors trigger toast notification
- 401 responses trigger automatic token refresh then retry
- 403 responses redirect to `/forbidden` page
- 404 responses render `<NotFoundPage>`