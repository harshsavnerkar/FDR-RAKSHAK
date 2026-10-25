# FDR Rakshak

**Statutory Security Deposit & Fixed Deposit Receipt Governance Bureau**  
*All India Council for Technical Education (AICTE), Ministry of Education, Government of India*  
*Problem Statement ID: 26265 — Smart Automation*

---

## Default Administrator Credentials

When the backend starts up for the first time against your PostgreSQL database, it automatically provisions the initial bureau administrator:

| Field | Default Value | Notes |
| :--- | :--- | :--- |
| **Username** | `aicte_admin` | Case-insensitive; pre-filled in login UI |
| **Alternative Login** | `admin@aicte-india.org` | You can also log in using this registered email |
| **Master Password** | `AICTE@Admin2026!` | Initial development credential |

> **Note**: If you change the password using **Forgot Master Password**, the new password is encrypted with Argon2id and committed to PostgreSQL. If forgotten, you can initiate recovery and retrieve the 15-minute token directly from the backend terminal logs.

---

## Quick Setup Guide for Teammates

### 1. Database Configuration
Ensure PostgreSQL is running, then create `backend/.env` (or copy `backend/.env.example`):
```ini
DATABASE_URL=postgresql+psycopg://<username>:<password>@localhost:5432/<dbname>
CORS_ORIGINS=http://localhost:3001,http://127.0.0.1:3001
HOST=0.0.0.0
PORT=8001
ENVIRONMENT=development
ADMIN_USERNAME=aicte_admin
ADMIN_EMAIL=admin@aicte-india.org
ADMIN_INITIAL_PASSWORD=AICTE@Admin2026!
```

### 2. Start the Backend API (Port 8001)
```powershell
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
```
*On initial startup, tables are automatically verified and initial data + administrator are provisioned.*

### 3. Start the Frontend (Port 3001)
```powershell
# In the root directory:
npm install
npm run dev
```

### 4. Access the Vault
Open your browser at **`http://localhost:3001`** and sign in with:
- **Username:** `aicte_admin`
- **Password:** `AICTE@Admin2026!`
