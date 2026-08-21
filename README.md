# Dwarka Dental Clinic - Management System (MERN Stack)

A comprehensive dental clinic management system built on the **MERN** stack (MongoDB, Express, React, Node.js).

---

## 🏛️ System Architecture

### Backend (`/Backend`)

Restructured into a clean **Controller-Service-Model** pattern with strict separation of concerns:
- **Routes (`src/routes/`)**: Map HTTP verbs & paths to controller functions. Route-level validation via `validateRequest`.
- **Controllers (`src/controllers/`)**: Thin orchestration layer that parses HTTP requests and returns standardized `ApiResponse` shapes.
- **Services (`src/services/`)**: Independent business logic and database queries via Mongoose. Fully decoupled from Express `req`/`res`.
- **Models (`src/models/`)**: Mongoose schemas enforcing constraints, indexes, and BSON types.
- **Middlewares (`src/middleware/`)**: Centralized error handling (`errorHandler`), async wrapper (`asyncHandler`), route validator (`validateRequest`), and 404 catcher (`notFound`).
- **Config (`src/config/`)**: Environment validation (`env.js`) and database lifecycle management with automatic fallback seeding (`db.js`).

```
Backend/
├── src/
│   ├── config/
│   │   ├── db.js                 # MongoDB connection + automatic seeding
│   │   └── env.js                # Environment variable loader and validator
│   ├── models/
│   │   ├── patient.model.js
│   │   ├── appointment.model.js
│   │   ├── clinical-record.model.js
│   │   ├── payment.model.js
│   │   ├── ai-report.model.js
│   │   ├── user.model.js
│   │   └── ...
│   ├── controllers/
│   │   ├── patient.controller.js
│   │   ├── appointment.controller.js
│   │   ├── payment.controller.js
│   │   ├── clinical.controller.js
│   │   ├── ai.controller.js
│   │   └── auth.controller.js
│   ├── services/
│   │   ├── patient.service.js
│   │   ├── appointment.service.js
│   │   ├── payment.service.js
│   │   ├── clinical.service.js
│   │   ├── ai.service.js
│   │   └── auth.service.js
│   ├── routes/
│   │   ├── index.js               # Mounts all domain sub-routers onto /api
│   │   ├── patient.routes.js
│   │   ├── appointment.routes.js
│   │   ├── payment.routes.js
│   │   ├── clinical.routes.js
│   │   ├── ai.routes.js
│   │   └── auth.routes.js
│   ├── middleware/
│   │   ├── errorHandler.js        # Centralized error handler
│   │   ├── notFound.js            # 404 handler
│   │   ├── validateRequest.js     # Request validator middleware
│   │   └── asyncHandler.js        # Auto-catch async route errors
│   ├── utils/
│   │   ├── ApiError.js            # Custom error class
│   │   ├── ApiResponse.js         # Standard response shape
│   │   ├── scheduler.js           # Smart appointment interval calculation
│   │   └── whatsapp.js            # Twilio WhatsApp notification integration
│   └── app.js                     # Express app setup (no app.listen)
├── index.js                       # Server entry point
├── .env.example
└── package.json
```

### Frontend (`/Frontend`)

Built with React 19, Vite 8, Redux Toolkit, and RTK Query:
- **Feature Folders (`src/features/`)**: Domain logic co-located by feature (`patients`, `appointments`), combining RTK Query API endpoints (`patientsApi.js`) and UI slices (`patientsSlice.js`).
- **Services (`src/services/apiSlice.js`)**: Root RTK Query API slice with unified caching, tag invalidation, and automatic `x-user-role` header injection.
- **Routes (`src/routes/AppRoutes.jsx`)**: Centralized React Router configuration using constants from `src/constants/routes.js`.

```
Frontend/
├── src/
│   ├── app/
│   │   ├── store.js               # Redux store config (combines feature slices & RTK Query)
│   │   ├── hooks.js               # Typed useAppDispatch and useAppSelector hooks
│   │   └── router.jsx
│   ├── services/
│   │   └── apiSlice.js            # RTK Query root API slice
│   ├── features/
│   │   ├── patients/
│   │   │   ├── patientsSlice.js   # UI filter/search state
│   │   │   └── patientsApi.js     # RTK Query endpoints for patients
│   │   └── appointments/
│   │       ├── appointmentsSlice.js
│   │       └── appointmentsApi.js
│   ├── routes/
│   │   └── AppRoutes.jsx          # Route definitions
│   ├── constants/
│   │   ├── routes.js              # Centralized path strings
│   │   └── apiEndpoints.js        # API path constants
│   ├── components/                # Reusable UI widgets & layout elements
│   ├── pages/                     # Role-specific dashboard views (admin, doctor, receptionist)
│   └── utils/
│       ├── api.js                 # Fetch client
│       └── formatters.js
├── index.html
├── vite.config.js
├── .env.example
└── package.json
```

---

## 🚀 Running Locally

### 1. Prerequisites
- Node.js (v18+)
- MongoDB Atlas URI (or local MongoDB server)

### 2. Backend Setup
```bash
cd Backend

# Install dependencies
npm install

# Copy environment variables template
cp .env.example .env

# Edit .env and configure MONGODB_URI & PORT
# Start development server with nodemon
npm run dev
```

The backend server starts on `http://localhost:5000`. On first boot, it automatically seeds a default Clinic and default staff accounts if empty.

#### Demo Credentials:
- **Admin**: `admin@dwarkadental.com` / `admin123`
- **Doctor**: `doctor@dwarkadental.com` / `doctor123`
- **Receptionist**: `receptionist@dwarkadental.com` / `recep123`

### 3. Frontend Setup
```bash
cd Frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```

Open your browser at `http://localhost:5173`. Vite automatically proxies requests from `/api` to `http://localhost:5000`.

---

## 🔒 Authentication Note

Authentication logic is intentionally un-enforced for testing. Placeholder slots (`// TODO: add authMiddleware here`) have been left in `Backend/src/routes/index.js` and individual domain route files so JWT auth can be mounted cleanly without refactoring business logic.
