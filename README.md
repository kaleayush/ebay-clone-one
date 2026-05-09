# eBay Clone — Enterprise Marketplace Platform

An enterprise-grade e-commerce marketplace built with React 19, ASP.NET Core 8, and SQL Server. Users can both buy and sell items through a unified account system.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 6, Tailwind CSS 3 |
| Backend | ASP.NET Core 8 Web API |
| Architecture | Onion Architecture |
| ORM | Entity Framework Core 8 |
| Database | SQL Server 2022 |
| Auth | JWT + Refresh Tokens |
| Containers | Docker + Docker Compose |

## Quick Start

### Option 1: Docker (Recommended)

```bash
cp .env.example .env
docker-compose up -d
```

- Frontend: http://localhost:80
- API: http://localhost:5000
- Swagger: http://localhost:5000/swagger

### Option 2: Local Development

**Prerequisites**: Node.js 20+, .NET 8 SDK, SQL Server

```bash
# Frontend
cd Frontend
npm install
cp .env.example .env
npm run dev

# Backend (new terminal)
cd Backend
dotnet restore
dotnet run --project src/EBayClone.API
```

Apply database migrations:
```bash
cd Backend
dotnet ef database update --project src/EBayClone.Infrastructure --startup-project src/EBayClone.API
```

## Project Structure

```
ebay-clone-one/
├── skill.md              # Coding standards and architecture rules
├── CLAUDE.md             # AI assistant context and guidelines
├── docker-compose.yml    # Multi-service Docker setup
├── Frontend/             # React + Vite SPA
│   └── src/
│       ├── features/     # Feature-based modules
│       ├── layouts/      # MarketplaceLayout + AdminLayout
│       └── components/   # Shared UI components
└── Backend/              # ASP.NET Core Web API
    └── src/
        ├── EBayClone.Domain/          # Entities, enums, interfaces
        ├── EBayClone.Application/     # Business logic, DTOs, services
        ├── EBayClone.Infrastructure/  # EF Core, repositories, JWT
        └── EBayClone.API/             # Controllers, middleware, startup
```

## Default Credentials (Dev)

| Role | Email | Password |
|---|---|---|
| Admin | admin@ebay-clone.com | Admin@123 |
| User | user@ebay-clone.com | User@123 |

## API Documentation

Swagger UI available at `/swagger` when running in Development mode.

Key endpoints:
- `POST /api/v1/auth/register` — Create account
- `POST /api/v1/auth/login` — Authenticate
- `POST /api/v1/auth/refresh` — Refresh JWT token
- `GET /api/v1/listings` — Browse listings (paginated)
- `POST /api/v1/listings` — Create listing (auth required)
- `GET /api/v1/orders` — Order history (auth required)
- `POST /api/v1/cart/checkout` — Checkout cart (auth required)