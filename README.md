# SafeCred - Phase 0

## Problem (short)
SafeCred: AI-assisted credit scoring for concessional lending.  
**Phase-0 goal** → collect applicant data + documents and push to backend for processing.

---
## 👨‍💻 Team & Roles
- **Divya Ratna Gautam (Lead, AI/ML)** — Repo setup, README, orchestrator pseudocode, integration testing, final demo.  
- **Sudhanshu Pal (Backend Developer)** — Node.js + Express API, DB schema, document upload endpoints.  
- **Arvind Kumar Singh (Frontend & Backend Developer)** — React + Tailwind applicant form + file upload UI.  
- **Vivek Chaudhary (Frontend Developer)** — Support in React UI, validation, styling improvements.  
- **Ayush Singh (AI/ML Developer)** — AI/ML module (Phase-2), scoring logic, future model integration.  

---
## 🚀 Quick start

### 1. Backend
```bash
cd backend
npm install
npm run dev   # runs Express on :5000
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev   # runs React on :3000
```

## 📡 API Endpoints (Phase 0)

### Create User
**POST** `/api/users`  
Request:
```json
{
  "name": "Vayu",
  "mobile": "9956189165",
  "email": "vayu@example.com"
}
```
Response:
```json
{
  "id": "user_abc123",
  "name": "Vayu",
  "mobile": "9956189165"
}
```

---

### Create Loan Application
**POST** `/api/applications`  
Request:
```json
{
  "userId": "user_abc123",
  "income": 40000,
  "loan_amount": 120000,
  "tenure_months": 12
}
```
Response:
```json
{
  "applicationId": "app_9876",
  "status": "CREATED"
}
```

---

### Upload Document
**POST** `/api/applications/:id/documents`  
Multipart form-data fields:  
- `file` → file binary (CSV, salary slip, electricity bill)  
- `type` → `csv` | `salary` | `bill`  

Response:
```json
{
  "documentId": "doc_555",
  "applicationId": "app_9876",
  "status": "UPLOADED"
}
```

---

## 🎯 Deliverable before 5 Oct
- Frontend form submits to `POST /api/applications`  
- Documents uploaded via `POST /api/applications/:id/documents` and received by backend  
- Application status flows from `CREATED → READY_FOR_SCORING`  

---
## 🔧 Test commands (using curl)

**Create user:**
```bash
curl -X POST http://localhost:5000/api/users \
-H "Content-Type: application/json" \
-d '{"name":"Vayu","mobile":"9999999999"}'
```

**Create application:**
```bash
curl -X POST http://localhost:5000/api/applications \
-H "Content-Type: application/json" \
-d '{"userId":"user_abc123","income":40000,"loan_amount":100000,"tenure_months":12}'
```

**Upload document:**
```bash
curl -X POST http://localhost:5000/api/applications/app_9876/documents \
-F "file=@/path/to/file.pdf" \
-F "type=salary"
```

## Notes
- Keep README updated with API contract changes  
- Lead (Divya) will merge frontend & backend PRs after basic integration test

