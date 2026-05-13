# Architecture

## Layer Structure (Onion)
```
EBayClone.API           → controllers, middleware, DI composition, Program.cs, API-layer models
EBayClone.Application   → services, DTOs, validators, interfaces (no infra deps)
EBayClone.Infrastructure → EF Core, GenericRepository, JwtService, BcryptPasswordHasher
EBayClone.Domain        → entities, enums, IRepository<T> (no deps)
```

### Correct dependency flow
```
HTTP Request
    ↓
Controller (API)
    ↓
Application Service Interface (Application)
    ↓
Application Service Implementation (Application)
    ↓
IRepository<T> Interface (Domain)
    ↓
GenericRepository<T> Implementation (Infrastructure)
    ↓
DbContext (Infrastructure)
```

Dependency direction: API → Application → Domain ← Infrastructure → Domain.  
Application never references Infrastructure directly.

### Architecture rules (enforced)
- **Controllers must not inject or call `IRepository<T>` directly.** All data access must go through an Application service.
- **Controllers must not contain DTO/request/response record or class definitions.** All DTOs live in `Application/DTOs/` or, for HTTP-specific types like `IFormFile` wrappers, in `API/Models/`.
- **Business logic must not be written inside controllers.** Controllers are HTTP adapters only: route attribute, constructor injection, one-line action that calls a service, return result.
- **DbContext must only be used inside Infrastructure repositories.** Application services never reference `DbContext` or EF Core namespaces directly.

## Backend Patterns

### Repository
- `IRepository<T>` (Domain) ← `GenericRepository<T>` (Infrastructure)
- Exposes: `GetByIdAsync`, `GetAllAsync`, `Query()` (IQueryable), `AddAsync`, `UpdateAsync`, `SoftDelete`, `SaveChangesAsync`
- No Unit of Work. Services call `repository.SaveChangesAsync(ct)` after mutations.
- `IQueryable<T>` via `Query()` for composable filters; materialize with `ToListAsync()` in service layer.

### Services
- Registered via `AddApplication()` in `ApplicationExtensions.cs`
- One interface per service in Application layer
- Services never reference EF Core directly — only `IRepository<T>`
- Admin-specific query logic lives in `IAdminService` / `AdminService`

### DI Registration
| Extension | Registers |
|-----------|-----------|
| `AddInfrastructure` | DbContext, `IRepository<>` → `GenericRepository<>`, `IJwtService`, `IPasswordHasher`, `IEmailService`, `IFileStorageService` |
| `AddApplication` | All service interfaces + `AddValidatorsFromAssembly` |
| `AddJwtAuthentication` | JWT bearer + token validation params |
| `AddCorsPolicy` | `"FrontendPolicy"` from `CorsSettings:AllowedOrigins` |
| `AddSwaggerWithJwt` | Swagger + JWT auth button |

### Soft Deletes
- All entities extend `BaseEntity` (Id, CreatedAt, UpdatedAt, IsDeleted, DeletedAt)
- `repository.SoftDelete(entity)` sets `IsDeleted=true`, `DeletedAt=DateTime.UtcNow`
- EF query filters in `IEntityTypeConfiguration` classes exclude `IsDeleted=true` globally
- Admin queries can bypass filter for `IncludeDeleted` scenarios

### Response Envelope
```csharp
ApiResponse<T>.Success(data)          // 200
ApiResponse<T>.Failure("message")     // 4xx
ApiResponse<PagedResult<T>>.Success(pagedResult)  // paginated
```
`PagedResult<T>` fields: `Items`, `TotalCount`, `Page`, `PageSize`.

### Validation
- FluentValidation validators in `Application/Validators/`
- Auto-registered via `AddValidatorsFromAssembly`
- Controller action filter runs before service call

### JWT / Auth
- Access token 15 min, refresh token 7 days
- Claims: `sub` = userId, role = MS role claim URI
- `MapInboundClaims = false`, `NameClaimType = "sub"` — always use `User.FindFirstValue("sub")`
- Refresh token stored in `RefreshToken` table (soft-deletable)

### Logging
- Serilog configured from `appsettings.*.json`
- Console + rolling file (`logs/log-.txt`)
- Dev: Debug level + EF SQL at Information
- Prod: Warning level
- Inject `ILogger<T>`; never `Console.Write*`

### Startup Sequence (Program.cs)
1. Serilog bootstrap
2. Service registration (controllers, swagger, health, infra, app, JWT, CORS)
3. Build app
4. Create `wwwroot/uploads/documents` dir
5. `MigrateAsync()` → `CategoryFormSeeder` → `ListingAndUserSeeder` → `EmailTemplateSeeder`
6. Middleware pipeline: ExceptionMiddleware → Swagger → StaticFiles → SerilogRequestLogging → CORS → Auth → Authorization → Controllers → HealthChecks

### Seeder Pattern
- All seeders idempotent (safe to re-run)
- `CategoryFormSeeder` uses MD5-deterministic GUIDs: `CreateGuid($"category:{key}")`, `CreateGuid($"attribute:{key}:{name}")`
- Default admin: `00000000-0000-0000-0000-000000000001`

### Infrastructure Services
| Interface | Implementation | Note |
|-----------|---------------|-------|
| `IEmailService` | `SmtpEmailService` (always) | Console-fallback when `Host` is empty |
| `IFileStorageService` | `LocalFileStorageService` | Saves to `wwwroot/uploads` |

### SMTP Email Service (`SmtpEmailService`)
- Registered as `IEmailService` in `AddInfrastructure` for all environments
- **Never throws to caller** — all SMTP exceptions caught + logged; API never fails due to email
- `SmtpSettings:Host` empty → logs `[EMAIL-CONSOLE]` to Serilog and returns (dev fallback)
- `SmtpSettings:Host` set → connects via MailKit, `StartTls` if `EnableSsl=true`
- Template rendering via `IEmailTemplateService.GetActiveTemplateAsync()` — no active template → logs warning, skips send
- Placeholder syntax: `{{Key}}` replaced from `Dictionary<string,string>` context

Config per environment:
| Setting | Base (`appsettings.json`) | Development | Production |
|---------|--------------------------|-------------|------------|
| Host | `""` (console fallback) | `sandbox.smtp.mailtrap.io` | set via env var |
| Port | `587` | `587` | `587` |
| Username | `""` | Mailtrap key | set via env var |
| Password | `""` | Mailtrap key | set via env var |
| FromEmail | `noreply@ebay-clone.com` | `ayushkale85.33@gmail.com` | set via env var |
| FromName | `"eBay Clone"` | `"eBay Clone (Dev)"` | `"eBay Clone"` |
| EnableSsl | `true` | `true` | `true` |

Production env vars (Docker / hosting):
```
SmtpSettings__Host=smtp.sendgrid.net
SmtpSettings__Username=apikey
SmtpSettings__Password=<api-key>
SmtpSettings__FromEmail=noreply@yourdomain.com
SmtpSettings__FromName=eBay Clone
```

> `FromName` must not be empty string — use `IsNullOrWhiteSpace` guard (already applied in service).  
> Empty string bypasses `?? fallback`; only null triggers it.

---

## Frontend Architecture (Feature-Based)

```
src/
  app/Router.jsx          → all routes, lazy-loaded with Suspense
  constants/api.js        → API_ENDPOINTS + API_BASE_URL (VITE_API_BASE_URL)
  constants/routes.js     → ROUTES path constants
  constants/enums.js      → frontend enum mirrors (must match backend int values)
  services/api.js         → Axios instance (see below)
  store/authStore.js      → Zustand + localStorage persist
  store/cartStore.js      → Zustand cart state
  store/wishlistStore.js  → Zustand + localStorage persist (client-only)
  utils/assets.js         → assetUrl(url): relative backend path → full URL
  utils/formatters.js     → currency, date formatters
  features/[feature]/     → components, hooks, pages, services
  layouts/                → MarketplaceLayout, AdminLayout
  components/common/      → Button, Input, Select, Modal, Badge, Pagination, Spinner, PrivateRoute, AdminRoute
```

### Axios Instance (`services/api.js`)
- Attaches `Authorization: Bearer <token>` from `authStore`
- **Response interceptor unwraps `.data`** — callers get payload, not raw Axios response
- 401 → queued token-refresh flow → retry original request

### State Management
| Store | Persistence | Purpose |
|-------|-------------|---------|
| `authStore` | localStorage (`auth-storage`) | user, accessToken, refreshToken, isAuthenticated |
| `cartStore` | Memory | cart items, totals |
| `wishlistStore` | localStorage | wishlist (client-only, not synced) |

### Data Fetching
- React Query (`useQuery` / `useMutation`) for all server state
- No `useEffect + fetch` pattern

### Forms
- React Hook Form (`useForm`) + Zod (`zodResolver`)
- `DynamicAttributeFields` component for category attributes
- `isAttributeVisible(attribute, values)` in `features/listings/utils/attributeVisibility.js`

### Route Guards
- `PrivateRoute` → redirects unauthenticated to `/login`
- `AdminRoute` → redirects non-admin to `/forbidden`
- Admin routes (`/admin/*`) use `AdminLayout`
- Authenticated routes use `MarketplaceLayout`

### Vite Dev Proxy
`/api/*` → `VITE_API_BASE_URL` (default `http://localhost:5000`) — no CORS issues in dev.

### `@` Alias
Resolves to `./src` via `vite.config.js`.
