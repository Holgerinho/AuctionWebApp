# AuctionWebApp

Fullstack auction application built with:
- ASP.NET Core Web API + EF Core + SQL Server (backend)
- React + TypeScript + Vite (frontend)

## 1. Prerequisites

Install these on a new computer:
- .NET SDK (same major version used by the project)
- Node.js (LTS) + npm
- SQL Server LocalDB or SQL Server instance
- (Optional) Visual Studio / VS Code

## 2. Clone and open

1. Clone the repository.
2. Open the root folder `AuctionWebApp`.

## 3. Backend setup (API)

Open a terminal in `AuctionBackend` and run:

```powershell
dotnet restore
dotnet tool restore
dotnet ef database update
```

This applies all committed EF migrations (including admin/start dates/images support).

### Connection string

Default development connection string is in:
- `AuctionBackend/appsettings.json`

If your SQL instance differs, update:
- `ConnectionStrings:DefaultConnection`

## 4. Frontend setup (React)

Open a second terminal in `AuctionFrontend` and run:

```powershell
npm install
```

Create a `.env` file in `AuctionFrontend` with:

```env
VITE_API_BASE_URL=https://localhost:7162
```

Adjust the URL if your backend runs on another port.

## 5. Run the app

### Terminal 1 (backend)

In `AuctionBackend`:

```powershell
dotnet run
```

### Terminal 2 (frontend)

In `AuctionFrontend`:

```powershell
npm run dev
```

Open the frontend URL shown by Vite (usually `http://localhost:5173`).

## 6. Admin account (seeded)

On backend startup, an admin user is seeded from config values (`AdminSeed`):
- Username: `admin`
- Password: `Admin123!`

If a user with that username already exists, the account is promoted to admin and activated.

Config location:
- `AuctionBackend/appsettings.json`
- `AuctionBackend/appsettings.Development.json`

## 7. Common troubleshooting

### CORS error in browser
- Make sure frontend origin matches backend CORS policy (default `http://localhost:5173`).

### Database missing columns/tables
- Re-run `dotnet ef database update` in `AuctionBackend`.

### Frontend cannot reach API
- Check `.env` value `VITE_API_BASE_URL`.
- Verify backend is running and HTTPS port matches.

### EF command not found
- Run `dotnet tool restore` in `AuctionBackend` first.