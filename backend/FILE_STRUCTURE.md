# HMS Backend — File Structure

```
hospital-management/
│
├── .git/
├── README.md
│
├── env/                                 ← Python virtualenv (DO NOT COMMIT)
│
├── frontend/                            ← Vite React TypeScript
│   ├── .env                             ← VITE_API_BASE_URL, VITE_WHATSAPP_NUMBER
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│
└── backend/                             ← Django project root
    ├── .env                             ← All backend secrets (DO NOT COMMIT)
    ├── .env.example                     ← Committed template with blank values
    ├── db.sqlite3                       ← Auto-created on migrate
    ├── manage.py
    ├── requirements.txt
    │
    ├── backend/                         ← Django config package
    │   ├── __init__.py
    │   ├── settings.py                  ← Reads .env via python-decouple
    │   ├── urls.py                      ← Root URL router (all apps under /api/)
    │   ├── wsgi.py
    │   └── asgi.py
    │
    ├── users/                           ← Custom user model + JWT auth
    │   ├── migrations/
    │   ├── __init__.py
    │   ├── admin.py                     ← CustomUserAdmin
    │   ├── apps.py
    │   ├── models.py                    ← CustomUser (AbstractBaseUser), UserRole choices
    │   ├── permissions.py               ← IsOwner, IsDoctor, IsReceptionist, IsEmployee, IsPatient, ...
    │   ├── serializers.py               ← Login, Profile, StaffCreate, ChangePassword
    │   ├── views.py                     ← Login, Logout, Profile, ChangePassword, Staff CRUD
    │   └── urls.py                      ← /api/auth/...
    │
    ├── branches/                        ← Hospital & branch management (Owner only)
    │   ├── migrations/
    │   ├── admin.py
    │   ├── apps.py
    │   ├── models.py                    ← Hospital, Branch, BranchService
    │   ├── serializers.py
    │   ├── views.py
    │   └── urls.py                      ← /api/branches/...
    │
    ├── patients/                        ← Patient registration, appointments, notes, lab reports
    │   ├── migrations/
    │   ├── admin.py
    │   ├── apps.py
    │   ├── models.py                    ← Patient (UHID auto-gen), Appointment, VisitNote, LabReport
    │   ├── serializers.py               ← Duplicate phone detection
    │   ├── views.py                     ← Branch-scoped + patient self-view
    │   └── urls.py                      ← /api/patients/...
    │
    ├── medicines/                       ← Medicine catalog + prescriptions
    │   ├── migrations/
    │   ├── admin.py
    │   ├── apps.py
    │   ├── models.py                    ← Medicine, Prescription, PrescriptionItem
    │   ├── serializers.py               ← Nested prescription items
    │   ├── views.py
    │   └── urls.py                      ← /api/medicines/...
    │
    ├── billing/                         ← Invoices + payment tracking
    │   ├── migrations/
    │   ├── admin.py
    │   ├── apps.py
    │   ├── models.py                    ← Bill (auto payment status), BillItem
    │   ├── serializers.py               ← Nested items + auto total
    │   ├── views.py
    │   └── urls.py                      ← /api/billing/...
    │
    ├── hr/                              ← Employee HR management
    │   ├── migrations/
    │   ├── admin.py
    │   ├── apps.py
    │   ├── models.py                    ← Employee, Attendance, LeaveApplication
    │   ├── serializers.py
    │   ├── views.py
    │   └── urls.py                      ← /api/hr/...
    │
    ├── campaigns/                       ← Campaign creation + overlay manager role
    │   ├── migrations/
    │   ├── admin.py
    │   ├── apps.py
    │   ├── models.py                    ← Campaign, CampaignManagerAssignment, CampaignPatient, CampaignAttendance, CampaignSale
    │   ├── serializers.py
    │   ├── views.py
    │   └── urls.py                      ← /api/campaigns/...
    │
    ├── products/                        ← Product catalog + enquiries
    │   ├── migrations/
    │   ├── admin.py
    │   ├── apps.py
    │   ├── models.py                    ← Product (WhatsApp link gen), ProductEnquiry
    │   ├── serializers.py               ← Public vs Owner views
    │   ├── views.py
    │   └── urls.py                      ← /api/products/...
    │
    ├── referrals/                       ← Referral form (open to all / public)
    │   ├── migrations/
    │   ├── admin.py
    │   ├── apps.py
    │   ├── models.py                    ← Referral (auth or anonymous)
    │   ├── serializers.py
    │   ├── views.py
    │   └── urls.py                      ← /api/referrals/...
    │
    ├── notifications/                   ← SendGrid email + notification log
    │   ├── migrations/
    │   ├── admin.py
    │   ├── apps.py
    │   ├── models.py                    ← Notification (log of all emails)
    │   ├── email.py                     ← send_email() + template helpers
    │   ├── serializers.py
    │   ├── views.py
    │   └── urls.py                      ← /api/notifications/...
    │
    └── storage/                         ← Storage service stubs (not a Django app)
        ├── __init__.py
        ├── cloudinary_service.py        ← upload_image, delete_image, get_image_url
        └── dropbox_service.py           ← upload_file, download_file, delete_file, get_shared_link
```

---

## API Endpoint Summary

| Method | Endpoint | Description | Roles |
|---|---|---|---|
| POST | `/api/auth/login/` | Login → JWT tokens | All |
| POST | `/api/auth/logout/` | Blacklist refresh token | All |
| GET/PUT | `/api/auth/profile/` | View/edit own profile | All |
| POST | `/api/auth/change-password/` | Change password | All |
| GET/POST | `/api/auth/staff/` | List/create staff | Owner, Receptionist |
| GET/PUT/DELETE | `/api/auth/staff/<id>/` | Staff detail | Owner |
| GET/POST | `/api/branches/hospitals/` | List/create hospitals | Owner |
| GET/POST | `/api/branches/` | List/create branches | Owner |
| GET | `/api/branches/public/` | Public branch list | Public |
| GET/POST | `/api/patients/` | List/register patients | Owner, Doctor, Receptionist |
| GET | `/api/patients/me/` | Patient self-profile | Patient |
| GET/POST | `/api/patients/appointments/` | Appointments | All (scoped) |
| GET/POST | `/api/patients/<id>/visit-notes/` | Visit notes | Doctor |
| GET/POST | `/api/patients/<id>/lab-reports/` | Lab reports | Staff |
| GET/POST | `/api/medicines/` | Medicine catalog | Staff |
| GET/POST | `/api/medicines/prescriptions/` | Prescriptions | Doctor |
| GET/POST | `/api/billing/` | Bills | Owner, Receptionist |
| PATCH | `/api/billing/<id>/pay/` | Update payment | Owner, Receptionist |
| GET | `/api/billing/my-bills/` | Patient own bills | Patient |
| GET/POST | `/api/hr/employees/` | Employee list/create | Owner, Receptionist |
| GET/POST | `/api/hr/attendance/` | Mark attendance | Owner, Receptionist |
| GET | `/api/hr/attendance/me/` | Own attendance | Employee |
| GET/POST | `/api/hr/leaves/` | Leave applications | All |
| PATCH | `/api/hr/leaves/<id>/review/` | Approve/reject leave | Owner, Receptionist |
| GET/POST | `/api/campaigns/` | Campaigns | Owner |
| POST | `/api/campaigns/assign-manager/` | Assign manager | Owner |
| GET | `/api/campaigns/my-campaigns/` | My campaigns | Doctor, Employee |
| GET | `/api/products/public/` | Public product listing | Public |
| POST | `/api/products/enquiry/` | Submit enquiry | Public |
| GET/POST | `/api/products/` | Manage products | Owner |
| GET | `/api/products/enquiries/` | View enquiries | Owner |
| POST | `/api/referrals/` | Submit referral | Public / All |
| GET | `/api/referrals/list/` | View referrals | Staff |
| GET | `/api/notifications/mine/` | My notifications | All |
| POST | `/api/notifications/send/` | Send email | Staff |
| POST | `/api/token/refresh/` | Refresh JWT | All |

---

## .env Variables

### `backend/.env`
| Variable | Purpose |
|---|---|
| `SECRET_KEY` | Django secret key |
| `DEBUG` | True in dev |
| `ALLOWED_HOSTS` | Comma-separated hosts |
| `CORS_ALLOWED_ORIGINS` | Frontend URL |
| `DEFAULT_FROM_EMAIL` | Sender email address |
| `DEFAULT_FROM_NAME` | Sender display name |
| `MAILERCLOUD_API_KEY` | Mailercloud SMTP API key |
| `SENDGRID_API_KEY` | SendGrid SMTP API key |
| `EMAIL_HOST` | Custom SMTP host |
| `EMAIL_PORT` | Custom SMTP port |
| `EMAIL_USE_TLS` | Enable TLS for custom SMTP |
| `EMAIL_HOST_USER` | Custom SMTP username |
| `EMAIL_HOST_PASSWORD` | Custom SMTP password |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name *(add later)* |
| `CLOUDINARY_API_KEY` | Cloudinary API key *(add later)* |
| `CLOUDINARY_API_SECRET` | Cloudinary secret *(add later)* |
| `DROPBOX_APP_KEY` | Dropbox app key *(add later)* |
| `DROPBOX_APP_SECRET` | Dropbox app secret *(add later)* |
| `DROPBOX_REFRESH_TOKEN` | Dropbox refresh token *(add later)* |
| `WHATSAPP_ENQUIRY_NUMBER` | WhatsApp number for product enquiries |

### `frontend/.env`
| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Django API base URL |
| `VITE_WHATSAPP_NUMBER` | WhatsApp number |
| `VITE_APP_NAME` | App display name |

---

## Next Steps — Run These Commands

```bash
# 1. Delete the old conflicting 'auth' app folder
# (the app named 'auth' conflicts with django.contrib.auth)

# 2. Make migrations for all apps
python manage.py makemigrations users branches patients medicines billing hr campaigns products referrals notifications

# 3. Apply migrations
python manage.py migrate

# 4. Create superuser (Owner account)
python manage.py createsuperuser

# 5. Start dev server
python manage.py runserver
```
