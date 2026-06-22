# Fiber Management System (FMS)

Enterprise-grade Fiber Management System for Telecom Network Operations (BSNL-style).

## Features

- **Dashboard** - KPI cards, charts, recent activities, quick actions
- **Port Management** - Full CRUD for equipment ports with fiber tagging
- **DDF Management** - Digital Distribution Frame connection tracking
- **OFC Route Management** - Optical Fiber Cable route planning
- **Global Search** - Cross-module search (ports, DDF, OFC routes)
- **Authentication** - JWT-based with Admin/User roles
- **Export** - Excel export for all modules
- **Audit Logs** - Track all CRUD operations
- **Dark/Light Theme** - Toggle between themes
- **Responsive Design** - Mobile-friendly layout

## Tech Stack

| Layer    | Technology                   |
|----------|------------------------------|
| Frontend | React + TypeScript + Vite    |
| Styling  | Tailwind CSS                 |
| Backend  | FastAPI (Python)             |
| Database | PostgreSQL                   |
| Auth     | JWT + bcrypt                 |
| ORM      | SQLAlchemy                   |
| Charts   | Recharts                     |

## Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL 14+

## Installation

### 1. Database Setup

```bash
# Create the PostgreSQL database
psql -U postgres
CREATE DATABASE fiber_management;
\q

# Or run the full schema
psql -U postgres -f database/schema.sql
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Linux/Mac)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure database connection
# Edit .env file with your PostgreSQL credentials

# Run seed data (creates tables + sample data)
python seed_data.py

# Start the server
uvicorn main:app --reload --port 8000
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

### 4. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs (Swagger)**: http://localhost:8000/docs

## Demo Credentials

| Role    | Username  | Password    |
|---------|-----------|-------------|
| Admin   | admin     | admin123    |
| User    | operator  | operator123 |

**Admin** can: Add, Edit, Delete, Export, Manage Users  
**User** can: View, Search, Generate Reports

## API Endpoints

### Authentication
- `POST /api/login` - Login
- `POST /api/register` - Register new user
- `GET /api/me` - Get current user

### Ports
- `GET /api/ports` - List all ports (with search/filter)
- `GET /api/ports/{id}` - Get port by ID
- `POST /api/ports` - Create port (Admin)
- `PUT /api/ports/{id}` - Update port (Admin)
- `DELETE /api/ports/{id}` - Delete port (Admin)
- `GET /api/ports/export` - Export to Excel

### DDF
- `GET /api/ddf` - List all DDF records
- `GET /api/ddf/{id}` - Get DDF record by ID
- `POST /api/ddf` - Create DDF record (Admin)
- `PUT /api/ddf/{id}` - Update DDF record (Admin)
- `DELETE /api/ddf/{id}` - Delete DDF record (Admin)
- `GET /api/ddf/export` - Export to Excel

### OFC Routes
- `GET /api/ofc` - List all OFC routes
- `GET /api/ofc/{id}` - Get OFC route by ID
- `POST /api/ofc` - Create OFC route (Admin)
- `PUT /api/ofc/{id}` - Update OFC route (Admin)
- `DELETE /api/ofc/{id}` - Delete OFC route (Admin)
- `GET /api/ofc/export` - Export to Excel

### Dashboard & Search
- `GET /api/dashboard` - Dashboard KPIs and stats
- `GET /api/search?q=term` - Global search

## Project Structure

```
fiber-management-system/
├── backend/
│   ├── app/
│   │   ├── models/
│   │   │   └── models.py          # SQLAlchemy models
│   │   ├── routers/
│   │   │   ├── auth_router.py     # Authentication endpoints
│   │   │   ├── ports_router.py    # Port CRUD + export
│   │   │   ├── ddf_router.py      # DDF CRUD + export
│   │   │   ├── ofc_router.py      # OFC CRUD + export
│   │   │   ├── dashboard_router.py# Dashboard KPIs
│   │   │   └── search_router.py   # Global search
│   │   ├── schemas/
│   │   │   └── schemas.py         # Pydantic models
│   │   ├── auth.py                # JWT auth utilities
│   │   ├── config.py              # Settings management
│   │   └── database.py            # DB connection
│   ├── main.py                    # FastAPI app entry
│   ├── seed_data.py               # Sample data seeder
│   ├── requirements.txt           # Python dependencies
│   └── .env                       # Environment variables
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.tsx         # Sidebar + topbar layout
│   │   │   ├── Modal.tsx          # Reusable modal
│   │   │   └── StatusBadge.tsx    # Status indicator
│   │   ├── pages/
│   │   │   ├── DashboardPage.tsx  # KPIs + charts
│   │   │   ├── PortsPage.tsx      # Port management
│   │   │   ├── DDFPage.tsx        # DDF management
│   │   │   ├── OFCPage.tsx        # OFC route management
│   │   │   ├── SearchPage.tsx     # Global search
│   │   │   └── LoginPage.tsx      # Authentication
│   │   ├── services/
│   │   │   └── api.ts             # Axios API service
│   │   ├── hooks/
│   │   │   └── useAuth.ts         # Auth hook
│   │   ├── types/
│   │   │   └── index.ts           # TypeScript interfaces
│   │   ├── App.tsx                # Root component
│   │   ├── main.tsx               # Entry point
│   │   └── index.css              # Tailwind imports
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
├── database/
│   └── schema.sql                 # Full PostgreSQL schema
└── README.md
```

## Production Deployment

### Backend
```bash
# Use gunicorn with uvicorn workers
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Frontend
```bash
# Build for production
npm run build

# Serve with nginx or any static file server
# Output in dist/ folder
```

### Environment Variables (Production)
```env
DATABASE_URL=postgresql://user:password@db-host:5432/fiber_management
SECRET_KEY=<generate-a-strong-random-key-minimum-32-chars>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480
```

## License

Internal use - Telecom Network Operations
