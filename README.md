<<<<<<< HEAD
# 🏥 Hospital Management System

> **Stack:** React + TypeScript | Django REST Framework | PostgreSQL | JWT Auth | Cloudinary + Dropbox | Vercel + Railway

## Project Structure

```
hospital/
├── frontend/   # React + TypeScript (Vite)
├── backend/    # Django REST Framework
├── .github/    # CI/CD workflows
└── docker-compose.yml
```

## Quick Start

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements/development.txt
cp .env.example .env         # Fill in values
python manage.py migrate
python manage.py runserver
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local   # Fill in values
npm run dev
```

## Environment Variables

See `.env.example` at project root and in each sub-folder.

## Roles
| Role | Access |
|------|--------|
| Owner | All branches, revenue, settings |
| Doctor | Patient records, prescriptions |
| Receptionist | Appointments, billing, registration |
| Patient | Own records, booking |
| HR | Employee & attendance management |
| Employee | Own dashboard, attendance |
| Campaign Manager | Campaigns, referrals |
=======
# hospital-management
>>>>>>> b02875eb8ceda528332b8a32ff0170eba7ad5b8b
