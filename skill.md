---
name: ebay-clone-enterprise
description: Project-specific guidance for working on this eBay clone marketplace. Use when editing, reviewing, or explaining code in this repository, especially ASP.NET Core 8 onion architecture, EF Core repositories, React 19/Vite frontend features, admin workflows, listing approval, email templates, auth, API integration, and marketplace business rules.
---

# eBay Clone Enterprise Skill

Use this skill when working in this repository. Prefer the patterns already present in the codebase over introducing new architecture.

## Project Shape

Backend:

- `Backend/src/EBayClone.Domain`: entities, enums, repository contracts, domain-only rules.
- `Backend/src/EBayClone.Application`: DTOs, validators, interfaces, business services.
- `Backend/src/EBayClone.Infrastructure`: EF Core, repositories, configurations, migrations, storage, email, JWT, password hashing.
- `Backend/src/EBayClone.API`: controllers, middleware, DI composition, routing, startup.

Frontend:

- `Frontend/src/app`: router and query client.
- `Frontend/src/constants`: routes, endpoints, enum mirrors.
- `Frontend/src/services/api.js`: centralized Axios instance.
- `Frontend/src/store`: Zustand stores.
- `Frontend/src/features/[feature]`: feature pages, components, hooks, services, schemas, utilities.
- `Frontend/src/components/common`: shared UI primitives.
- `Frontend/src/layouts`: marketplace and admin shells.

## Commands

Frontend:

```powershell
cd Frontend
npm install
npm run dev
npm run build
npm run lint
```

Backend:

```powershell
cd Backend
dotnet restore
dotnet build
dotnet run --project src/EBayClone.API
dotnet ef migrations add <Name> --project src/EBayClone.Infrastructure --startup-project src/EBayClone.API
dotnet ef database update --project src/EBayClone.Infrastructure --startup-project src/EBayClone.API
```

Full stack:

```powershell
docker-compose up -d
```

Default local URLs: frontend dev server `http://localhost:5173`, Docker frontend `http://localhost:80`, API `http://localhost:5000`, Swagger `/swagger`, health check `/health`.

## Architecture Rules

- Keep onion dependencies pointing inward: API -> Infrastructure -> Application -> Domain.
- Keep Domain free of framework and infrastructure dependencies.
- Put business logic in Application services, not controllers or repositories.
- Let Infrastructure implement Application and Domain interfaces.
- Treat API as the composition root. Wire dependencies in `Program.cs` and extension methods.
- Use `IRepository<T>` as the data-access abstraction. There is no Unit of Work.
- Call `repository.SaveChangesAsync(ct)` after mutations.
- Keep controllers thin: validate route/auth context, delegate to services, return `ApiResponse<T>`.
- Keep frontend code feature-based and avoid cross-feature imports. Shared utilities belong in `components/common`, `hooks`, `services`, `constants`, `store`, or `utils`.

## Backend Standards

Naming:

| Artifact | Convention | Example |
|---|---|---|
| Classes | PascalCase | `ListingService` |
| Interfaces | `I` + PascalCase | `IListingService` |
| Methods | PascalCase, async suffix | `GetByIdAsync` |
| Properties | PascalCase | `CreatedAt` |
| Local variables | camelCase | `currentUser` |
| Private fields | `_` + camelCase | `_listingRepository` |
| Request DTOs | `[Action][Entity]Request` | `CreateListingRequest` |
| Response DTOs | `[Entity]Response` | `ListingResponse` |
| Controllers | plural entity name | `ListingsController` |
| EF configurations | `[Entity]Configuration` | `ListingConfiguration` |

Implementation:

- Use async service and repository calls with `CancellationToken`.
- Use FluentValidation validators in `Application/Validators`.
- Use `ILogger<T>` for logging. Do not use `Console.Write*` in application code except console-only stub services.
- Return `ApiResponse<T>` from API endpoints and `PagedResult<T>` for paginated lists.
- Use `IQueryable<T>` from `IRepository<T>.Query()` for filterable/pageable queries, then materialize in services.
- Use `AsNoTracking()` for read-only EF queries.
- Use AutoMapper only where it matches existing mappings. Do not add mapping complexity for simple one-off projections.
- Do not expose Domain entities from services or controllers. Return DTOs.
- Use `User.FindFirstValue("sub")` for the authenticated user id. Do not rely on `ClaimTypes.NameIdentifier`.

## Persistence Rules

- All main entities inherit `BaseEntity`: `Id`, `CreatedAt`, `UpdatedAt`, `IsDeleted`, `DeletedAt`.
- Use soft deletes. Do not physically delete domain records unless an existing pattern explicitly does so for a dependent value object.
- Apply soft-delete filters with EF Core query filters in entity configurations.
- Use `.IgnoreQueryFilters()` only for admin or maintenance workflows that intentionally need deleted records.
- Disable cascade deletes for business aggregates unless the codebase already models the relationship as dependent cleanup.
- Use Code First migrations. Add a new migration instead of editing an existing applied migration.
- Keep migration names descriptive, for example `Phase5_EmailTemplatesAndApprovalWorkflow`.
- Seed stable lookup data with deterministic IDs when re-runs must be idempotent.

## Frontend Standards

Naming:

| Artifact | Convention | Example |
|---|---|---|
| Components | PascalCase | `ListingCard` |
| Pages | `[Name]Page` | `ListingDetailPage` |
| Hooks | `use` + PascalCase | `useListings` |
| Stores | camelCase store name | `authStore` |
| Services | camelCase service name | `listingService` |
| Constants | UPPER_SNAKE_CASE | `API_BASE_URL` |

Implementation:

- Use functional React components only.
- Use React Query for server state. Avoid `useEffect` plus manual fetch for data loading.
- Use Zustand for global client/UI state.
- Use React Hook Form plus Zod for forms.
- Use the centralized Axios instance in `src/services/api.js`. Do not call `fetch()` directly for API work.
- Remember the Axios response interceptor unwraps `.data`; feature services receive the API payload, not the raw Axios response.
- Use `@` imports for `Frontend/src` paths where existing files do.
- Use `assetUrl(url)` for images or uploaded files that may come from relative backend paths.
- Handle loading, error, and empty states in data-fetching UI.
- Keep admin pages under the admin layout and marketplace pages under the marketplace layout.

## API And Auth

- API routes are versioned under `/api/v1`.
- Use `[Authorize]` on protected endpoints and `[Authorize(Roles = "Admin")]` for admin-only endpoints.
- Access tokens expire quickly; refresh tokens support retry flows.
- Refresh and reset tokens must be stored securely and never logged.
- `authStore` currently persists auth state in `localStorage`; do not add additional token storage mechanisms without a deliberate migration.
- CORS uses the `"FrontendPolicy"` policy and origins from configuration.
- Swagger is available in development.

## Marketplace Rules

- Use one `Users` table. Users can both buy and sell.
- `AccountType` describes personal vs business; `UserRole` describes authorization such as user vs admin.
- Public browsing shows only active, approved listings according to the current listing workflow.
- Sellers can modify only their own listings unless the endpoint is admin-only.
- Admin listing actions should be auditable through the approval/versioning workflow where applicable.
- Orders are created from checkout and move through the existing `OrderStatus` enum.
- Payment-like work should be modeled as asynchronous or pending unless the codebase has a concrete payment integration.

## Listing Approval And Email Templates

The repository includes an admin approval workflow:

- Domain entities include `ListingVersion`, `ListingApprovalLog`, and `EmailTemplate`.
- Relevant enums include `ListingVersionStatus`, `ApprovalAction`, and `EmailTemplateType`.
- Application services include `IListingApprovalService` and `IEmailTemplateService`.
- Infrastructure includes EF configurations, migrations, and `EmailTemplateSeeder`.
- API includes admin/listing approval and email-template controllers.

When changing this area:

- Preserve version history instead of overwriting important approval state.
- Send notifications through `IEmailService` abstractions, not direct SMTP calls from Application services.
- Keep email template rendering deterministic and avoid logging rendered PII.
- Make admin UI enum values match backend enum numeric values and names.

## Dynamic Form Rules

- Build listing forms with React Hook Form and Zod.
- Keep schemas in feature-level `schemas` folders when the feature already uses that pattern.
- Use `DynamicAttributeFields` for category-driven listing attributes.
- Evaluate conditional attributes with the existing `isAttributeVisible` helper.
- Display validation errors inline.
- Disable submit buttons during submission.
- Use `react-hot-toast` or existing feedback components for success and error messages.
- Use `FormData` and upload endpoints for files.

## UI Rules

- Use Tailwind utilities. Avoid custom CSS files and inline styles unless an existing component requires it.
- Follow existing component conventions: white cards, light borders, small radius, restrained shadows.
- Use the eBay-inspired color tokens already configured in Tailwind.
- Use shared UI primitives from `components/common` before creating new primitives.
- Keep admin UI dense, scannable, and task-focused.
- Ensure responsive layouts work from mobile through desktop.

## Security Rules

- Never log passwords, tokens, secrets, or sensitive personal data.
- Validate inputs at the Application layer before persistence.
- Rely on EF Core parameterization for database access; do not build raw SQL strings from user input.
- Do not use `dangerouslySetInnerHTML` unless sanitization is explicit and justified.
- Keep secrets out of committed `.env` files and config examples.
- Use role checks in both backend authorization and frontend route guards for admin screens.

## Review Checklist

Before finishing a code change:

- Build or lint the touched side when feasible.
- Check API endpoint paths against `Frontend/src/constants/api.js`.
- Check enum mirrors in frontend constants after backend enum changes.
- Check route additions in `Router.jsx`, `routes.js`, and any layout navigation.
- Check DI registration after adding services.
- Check EF configurations and migrations after adding entities.
- Check loading, error, empty, and unauthorized states for user-facing UI.
- Mention any tests or builds that could not be run.
