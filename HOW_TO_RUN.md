# 🚀 SafeCred - Complete Setup & Run Guide

## 📋 Table of Contents
1. [Quick Start](#quick-start)
2. [Prerequisites](#prerequisites)
3. [Environment Setup](#environment-setup)
4. [Running the Project](#running-the-project)
5. [Stopping the Project](#stopping-the-project)
6. [Troubleshooting](#troubleshooting)
7. [Project Structure](#project-structure)
8. [Important URLs](#important-urls)

---

## ⚡ Quick Start

**Run all services at once:**
```powershell
.\RUN.ps1
```

**Or use the simplified START script:**
```powershell
.\START.ps1
```

---

## 📦 Prerequisites

Make sure you have the following installed:

- **Node.js**: v18+ ([Download](https://nodejs.org/))
- **Python**: v3.9+ ([Download](https://www.python.org/))
- **PostgreSQL**: Or access to Neon Database
- **Git**: For version control

---

## 🔧 Environment Setup

### 1. Frontend Setup (`/app`)

```powershell
cd app
npm install
```

**Create `.env` file in `/app`:**
```env
# Database
DATABASE_URL="your_neon_database_url"

# NextAuth
NEXTAUTH_URL="http://localhost:3002"
NEXTAUTH_SECRET="your_secret_key"

# API URLs
ML_API_URL="http://localhost:8002"
BACKEND_URL="http://localhost:3001"

# Email (Optional)
EMAIL_SERVER="smtp://user:pass@smtp.example.com:587"
EMAIL_FROM="noreply@safecred.com"
```

**Run Prisma migrations:**
```powershell
npx prisma generate
npx prisma db push
```

**Seed the database (optional):**
```powershell
npx tsx prisma/seed.ts
```

---

### 2. Backend Setup (`/backend`)

```powershell
cd backend
npm install
```

**Create `.env` file in `/backend`:**
```env
# Server
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL="your_neon_database_url"

# API URLs
ML_API_URL=http://127.0.0.1:8002
FRONTEND_URL=http://localhost:3002

# JWT
JWT_SECRET="your_jwt_secret"
```

**Run Prisma setup:**
```powershell
npx prisma generate
```

---

### 3. ML Service Setup (`/ml`)

```powershell
cd ml
```

**Create virtual environment:**
```powershell
python -m venv .venv
.\.venv\Scripts\Activate
```

**Install dependencies:**
```powershell
pip install -r requirements_ml.txt
```

**Verify `config.json` exists:**
```json
{
  "income_barrier": 15000,
  "model_version": "v2",
  "last_trained": "2024-01-01"
}
```

---

## ▶️ Running the Project

### Option 1: Use the Automated Script (Recommended)
```powershell
.\RUN.ps1
```
This will start all three services in separate PowerShell windows.

### Option 2: Start Services Manually

**Terminal 1 - ML Service (Port 8002):**
```powershell
cd ml
.\.venv\Scripts\Activate
python application_api.py
```

**Terminal 2 - Backend (Port 3001):**
```powershell
cd backend
npm run dev
```

**Terminal 3 - Frontend (Port 3002):**
```powershell
cd app
npm run dev
```

---

## 🛑 Stopping the Project

### Kill all Node.js processes:
```powershell
taskkill /F /IM node.exe
```

### Kill Python processes:
```powershell
# Find Python process on port 8002
netstat -ano | findstr ":8002"
# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Kill specific ports:
```powershell
# Frontend (3002)
netstat -ano | findstr ":3002"
taskkill /PID <PID> /F

# Backend (3001)
netstat -ano | findstr ":3001"
taskkill /PID <PID> /F

# ML API (8002)
netstat -ano | findstr ":8002"
taskkill /PID <PID> /F
```

---

## 🔍 Troubleshooting

### Port Already in Use
```powershell
# Check what's using the port
netstat -ano | findstr ":<PORT>"

# Kill the process
taskkill /PID <PID> /F
```

### Database Connection Issues
- Verify your `DATABASE_URL` is correct in `.env` files
- Check Neon database is accessible
- Run `npx prisma db push` to sync schema

### ML Service Not Starting
```powershell
# Activate virtual environment
cd ml
.\.venv\Scripts\Activate

# Reinstall dependencies
pip install -r requirements_ml.txt

# Check Python version (should be 3.9+)
python --version
```

### Frontend Build Errors
```powershell
cd app
# Delete node_modules and reinstall
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm install

# Clear Next.js cache
Remove-Item -Recurse -Force .next
npm run dev
```

### Backend Build Errors
```powershell
cd backend
# Regenerate Prisma client
npx prisma generate

# Clear dist folder
Remove-Item -Recurse -Force dist
npm run dev
```

---

## 📁 Project Structure

```
SIH-SafeCred/
├── app/                    # Next.js Frontend (Port 3002)
│   ├── src/
│   │   ├── app/           # App Router pages
│   │   │   ├── page.tsx   # Landing page
│   │   │   ├── login/     # Login page
│   │   │   ├── register/  # Registration page
│   │   │   ├── dashboard/ # User dashboard
│   │   │   ├── apply/     # Loan application
│   │   │   └── admin/     # Admin dashboard
│   │   ├── components/    # Reusable components
│   │   └── lib/          # Utilities
│   ├── prisma/
│   │   └── schema.prisma # Database schema
│   └── .env              # Frontend environment variables
│
├── backend/               # Node.js Backend (Port 3001)
│   ├── src/
│   │   ├── server.ts     # Main server file
│   │   ├── routes/       # API routes
│   │   ├── controllers/  # Business logic
│   │   └── middleware/   # Auth & validation
│   ├── prisma/
│   │   └── schema.prisma # Database schema
│   └── .env              # Backend environment variables
│
├── ml/                    # Python ML Service (Port 8002)
│   ├── application_api.py # FastAPI server
│   ├── features_direct.py # Feature engineering
│   ├── models_enhanced.py # ML models
│   ├── scoring.py        # Scoring logic
│   ├── train_v2.py       # Model training
│   ├── config.json       # ML configuration
│   ├── data/             # Training data
│   ├── models/           # Trained models
│   └── .venv/            # Python virtual environment
│
├── docs/                  # Documentation
├── RUN.ps1               # Main run script
├── START.ps1             # Simplified start script
└── HOW_TO_RUN.md         # This file
```

---

## 🌐 Important URLs

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3002 | Main application UI |
| **Backend API** | http://localhost:3001 | REST API endpoints |
| **ML API** | http://localhost:8002 | Machine Learning API |
| **ML API Docs** | http://localhost:8002/docs | FastAPI Swagger docs |

### Frontend Routes:
- `/` - Landing page
- `/login` - User login
- `/register` - User registration
- `/dashboard` - User dashboard
- `/apply` - Loan application form
- `/admin` - Admin dashboard (admin only)

### Backend API Endpoints:
- `GET /api/health` - Health check
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/applications` - Get user applications
- `POST /api/applications` - Submit loan application
- `GET /api/admin/*` - Admin endpoints

### ML API Endpoints:
- `GET /health` - Health check
- `POST /score` - Score loan application
- `GET /metadata` - Get ML metadata

---

## 🎨 UI Features

The project includes modern UI enhancements:

### Landing Page
- ✨ Animated gradient backgrounds
- 🔮 Glassmorphism effects
- 💫 Shimmer underline on "Underserved"
- 🎭 Hover animations on cards
- 🌈 Gradient buttons with icons

### Forms (Login, Register, Apply)
- 📧 Icon-enhanced input fields
- 🎨 Gradient backgrounds
- ✅ Loading states with animations
- 🎯 Success/Error animations
- 📱 Fully responsive design

### Dashboards
- 📊 Animated stat cards with gradients
- 🔍 Glassmorphism card effects
- 📈 Gradient text for metrics
- 🎭 Hover lift and glow effects
- ⚡ Smooth transitions

---

## 🔐 Default Credentials

**Admin User:**
- Email: `admin@safecred.com`
- Password: `admin123`

**Test User:**
- Email: `user@safecred.com`
- Password: `password123`

*(Change these in production!)*

---

## 🛠️ Development Commands

### Frontend (app/)
```powershell
npm run dev        # Start development server
npm run build      # Build for production
npm start          # Start production server
npm run lint       # Run ESLint
npx prisma studio  # Open Prisma Studio (DB GUI)
```

### Backend (backend/)
```powershell
npm run dev        # Start development server with nodemon
npm run build      # Compile TypeScript to JavaScript
npm start          # Start production server
npx prisma studio  # Open Prisma Studio
```

### ML Service (ml/)
```powershell
python application_api.py     # Start ML API server
python train_v2.py            # Train ML models
```

---

## 📝 Notes

1. **Port Configuration:**
   - Frontend: 3002 (changed from default 3000)
   - Backend: 3001
   - ML API: 8002 (changed from 8001)

2. **Database:**
   - Using Neon PostgreSQL (serverless)
   - Connection pooling enabled
   - Prisma ORM for schema management

3. **Authentication:**
   - NextAuth.js for session management
   - JWT tokens for API authentication
   - Role-based access control (USER, ADMIN, LOAN_OFFICER)

4. **ML Model:**
   - Fairness-aware credit scoring
   - Proxy data support (electricity, recharge, education)
   - Income barrier: ₹15,000
   - Automated feature engineering

---

## 🆘 Support

If you encounter issues:

1. Check this guide's [Troubleshooting](#troubleshooting) section
2. Verify all environment variables are set correctly
3. Ensure all dependencies are installed
4. Check that ports 3001, 3002, and 8002 are available
5. Review the console logs for error messages

---

## 📄 License

This project was built for Smart India Hackathon 2024-25.

---

**Happy Coding! 🎉**
