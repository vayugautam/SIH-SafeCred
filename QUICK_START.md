# 🚀 SafeCred - Quick Reference Card

## ⚡ ONE COMMAND START
```powershell
.\RUN.ps1
```

## 🌐 URLs
| Service | URL |
|---------|-----|
| Frontend | http://localhost:3002 |
| Backend | http://localhost:3001 |
| ML API | http://localhost:8002 |
| ML Docs | http://localhost:8002/docs |

## 📂 Important Files
- `HOW_TO_RUN.md` - Complete setup & run guide
- `RUN.ps1` - Automated startup
- `START.ps1` - Simplified startup
- `README.md` - Project overview

## 🛑 Emergency Stop
```powershell
# Kill all Node.js
taskkill /F /IM node.exe

# Kill Python (check port first)
netstat -ano | findstr ":8002"
taskkill /PID <PID> /F
```

## 🔐 Default Credentials
**Admin:** admin@safecred.com / admin123
**User:** user@safecred.com / password123

## 📝 Quick Commands

### Frontend (app/)
```powershell
cd app
npm run dev          # Start dev server
npm run build        # Build production
npx prisma studio    # Open DB GUI
```

### Backend (backend/)
```powershell
cd backend
npm run dev          # Start dev server
npx prisma studio    # Open DB GUI
```

### ML Service (ml/)
```powershell
cd ml
.\.venv\Scripts\Activate
python application_api.py    # Start ML API
```

## 🆘 Troubleshooting

### Port in use?
```powershell
netstat -ano | findstr ":<PORT>"
taskkill /PID <PID> /F
```

### Database issues?
```powershell
cd app  # or backend
npx prisma generate
npx prisma db push
```

### Dependencies?
```powershell
# Frontend/Backend
npm install

# ML
pip install -r requirements_ml.txt
```

## 📖 Full Documentation
See **[HOW_TO_RUN.md](HOW_TO_RUN.md)** for complete instructions!

---
**Last Updated:** November 3, 2025
