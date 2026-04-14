# HMS Project Structure Setup Script
# Run from: c:\Users\Hp\Desktop\hospital\

$root = $PSScriptRoot

function New-Dir($path) {
    $full = Join-Path $root $path
    if (-not (Test-Path $full)) {
        New-Item -ItemType Directory -Path $full -Force | Out-Null
    }
}

function New-File($path, $content = "") {
    $full = Join-Path $root $path
    $dir = Split-Path $full -Parent
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    if (-not (Test-Path $full)) {
        Set-Content -Path $full -Value $content -Encoding UTF8
    }
}

Write-Host "Creating HMS project structure..." -ForegroundColor Cyan

# ─── ROOT FILES ───────────────────────────────────────────────────────────────
New-File "README.md" "# Hospital Management System"
New-File ".env.example" "# Root env template"
New-File "docker-compose.yml" ""

# ─── .github ──────────────────────────────────────────────────────────────────
New-File ".github/workflows/backend-ci.yml" ""
New-File ".github/workflows/frontend-ci.yml" ""
New-File ".github/workflows/deploy.yml" ""

# ─── FRONTEND ─────────────────────────────────────────────────────────────────
$fe = "frontend"

# public/
New-File "$fe/public/favicon.ico" ""
New-File "$fe/public/logo.svg" ""
New-File "$fe/public/robots.txt" "User-agent: *`nAllow: /"

# src/app/
New-File "$fe/src/app/App.tsx" ""
New-File "$fe/src/app/router.tsx" ""
New-File "$fe/src/app/store.ts" ""
New-File "$fe/src/app/queryClient.ts" ""

# src/assets/
New-Dir "$fe/src/assets/images"
New-Dir "$fe/src/assets/icons"
New-Dir "$fe/src/assets/fonts"

# src/components/ui/
New-File "$fe/src/components/ui/Button.tsx" ""
New-File "$fe/src/components/ui/Input.tsx" ""
New-File "$fe/src/components/ui/Modal.tsx" ""
New-File "$fe/src/components/ui/Table.tsx" ""
New-File "$fe/src/components/ui/Badge.tsx" ""
New-File "$fe/src/components/ui/Spinner.tsx" ""
New-File "$fe/src/components/ui/index.ts" ""

# src/components/forms/
New-File "$fe/src/components/forms/FormField.tsx" ""
New-File "$fe/src/components/forms/SelectField.tsx" ""
New-File "$fe/src/components/forms/DatePicker.tsx" ""

# src/components/layout/
New-File "$fe/src/components/layout/PublicLayout.tsx" ""
New-File "$fe/src/components/layout/DashboardLayout.tsx" ""
New-File "$fe/src/components/layout/Sidebar.tsx" ""
New-File "$fe/src/components/layout/Topbar.tsx" ""
New-File "$fe/src/components/layout/Footer.tsx" ""

# src/components/shared/
New-File "$fe/src/components/shared/NotificationBell.tsx" ""
New-File "$fe/src/components/shared/AvatarMenu.tsx" ""
New-File "$fe/src/components/shared/BranchSelector.tsx" ""
New-File "$fe/src/components/shared/RoleGuard.tsx" ""

# features/auth/
New-File "$fe/src/features/auth/components/LoginForm.tsx" ""
New-File "$fe/src/features/auth/components/RoleRedirect.tsx" ""
New-File "$fe/src/features/auth/hooks/useAuth.ts" ""
New-File "$fe/src/features/auth/api/authApi.ts" ""
New-File "$fe/src/features/auth/store/authSlice.ts" ""
New-File "$fe/src/features/auth/types/auth.types.ts" ""
New-File "$fe/src/features/auth/index.ts" ""

# features/public/
New-File "$fe/src/features/public/components/HeroBanner.tsx" ""
New-File "$fe/src/features/public/components/ServiceCard.tsx" ""
New-File "$fe/src/features/public/components/BlogCard.tsx" ""
New-File "$fe/src/features/public/components/WhatsAppEnquiry.tsx" ""
New-File "$fe/src/features/public/pages/HomePage.tsx" ""
New-File "$fe/src/features/public/pages/AboutPage.tsx" ""
New-File "$fe/src/features/public/pages/ServicesPage.tsx" ""
New-File "$fe/src/features/public/pages/BlogPage.tsx" ""
New-File "$fe/src/features/public/pages/ContactPage.tsx" ""
New-File "$fe/src/features/public/pages/ProductListingPage.tsx" ""
New-File "$fe/src/features/public/index.ts" ""

# features/owner/
New-File "$fe/src/features/owner/components/BranchOverview.tsx" ""
New-File "$fe/src/features/owner/components/RevenueChart.tsx" ""
New-File "$fe/src/features/owner/components/StaffSummary.tsx" ""
New-File "$fe/src/features/owner/pages/OwnerDashboard.tsx" ""
New-File "$fe/src/features/owner/pages/BranchManagement.tsx" ""
New-File "$fe/src/features/owner/pages/SystemSettings.tsx" ""
New-Dir "$fe/src/features/owner/hooks"
New-File "$fe/src/features/owner/index.ts" ""

# features/doctor/
New-File "$fe/src/features/doctor/components/PatientCard.tsx" ""
New-File "$fe/src/features/doctor/components/PrescriptionForm.tsx" ""
New-File "$fe/src/features/doctor/components/DiagnosisNotes.tsx" ""
New-File "$fe/src/features/doctor/pages/DoctorDashboard.tsx" ""
New-File "$fe/src/features/doctor/pages/PatientView.tsx" ""
New-File "$fe/src/features/doctor/pages/TreatmentHistory.tsx" ""
New-File "$fe/src/features/doctor/hooks/usePatientData.ts" ""
New-File "$fe/src/features/doctor/api/doctorApi.ts" ""
New-File "$fe/src/features/doctor/index.ts" ""

# features/receptionist/
New-File "$fe/src/features/receptionist/components/AppointmentSlot.tsx" ""
New-File "$fe/src/features/receptionist/components/BillingForm.tsx" ""
New-File "$fe/src/features/receptionist/components/PatientRegistrationForm.tsx" ""
New-File "$fe/src/features/receptionist/pages/ReceptionistDashboard.tsx" ""
New-File "$fe/src/features/receptionist/pages/AppointmentCalendar.tsx" ""
New-File "$fe/src/features/receptionist/pages/BillingPage.tsx" ""
New-File "$fe/src/features/receptionist/pages/EmployeeManagement.tsx" ""
New-File "$fe/src/features/receptionist/index.ts" ""

# features/patient/
New-File "$fe/src/features/patient/components/AppointmentCard.tsx" ""
New-File "$fe/src/features/patient/components/MedicalRecordView.tsx" ""
New-File "$fe/src/features/patient/pages/PatientDashboard.tsx" ""
New-File "$fe/src/features/patient/pages/BookAppointment.tsx" ""
New-File "$fe/src/features/patient/pages/MedicalHistory.tsx" ""
New-File "$fe/src/features/patient/index.ts" ""

# features/employee/
New-File "$fe/src/features/employee/pages/EmployeeDashboard.tsx" ""
New-File "$fe/src/features/employee/pages/AttendancePage.tsx" ""
New-File "$fe/src/features/employee/index.ts" ""

# features/hr/
New-File "$fe/src/features/hr/components/LeaveRequestCard.tsx" ""
New-File "$fe/src/features/hr/components/AttendanceTable.tsx" ""
New-File "$fe/src/features/hr/pages/HRDashboard.tsx" ""
New-File "$fe/src/features/hr/pages/EmployeeRecords.tsx" ""
New-File "$fe/src/features/hr/pages/LeaveManagement.tsx" ""
New-File "$fe/src/features/hr/index.ts" ""

# features/products/
New-File "$fe/src/features/products/components/ProductCard.tsx" ""
New-File "$fe/src/features/products/components/ProductForm.tsx" ""
New-File "$fe/src/features/products/pages/ProductCatalog.tsx" ""
New-File "$fe/src/features/products/pages/ProductAdmin.tsx" ""
New-File "$fe/src/features/products/api/productsApi.ts" ""
New-File "$fe/src/features/products/index.ts" ""

# features/campaigns/
New-Dir "$fe/src/features/campaigns/components"
New-File "$fe/src/features/campaigns/pages/CampaignDashboard.tsx" ""
New-File "$fe/src/features/campaigns/pages/CampaignDetail.tsx" ""
New-File "$fe/src/features/campaigns/index.ts" ""

# features/referrals/
New-File "$fe/src/features/referrals/components/ReferralForm.tsx" ""
New-File "$fe/src/features/referrals/pages/ReferralPage.tsx" ""
New-File "$fe/src/features/referrals/index.ts" ""

# features/notifications/
New-File "$fe/src/features/notifications/components/NotificationList.tsx" ""
New-File "$fe/src/features/notifications/hooks/useNotifications.ts" ""
New-File "$fe/src/features/notifications/index.ts" ""

# src/hooks/
New-File "$fe/src/hooks/useBranch.ts" ""
New-File "$fe/src/hooks/usePermissions.ts" ""
New-File "$fe/src/hooks/usePagination.ts" ""
New-File "$fe/src/hooks/useDebounce.ts" ""

# src/lib/
New-File "$fe/src/lib/api/axiosInstance.ts" ""
New-File "$fe/src/lib/api/endpoints.ts" ""
New-File "$fe/src/lib/api/apiHelpers.ts" ""
New-File "$fe/src/lib/auth/tokenManager.ts" ""
New-File "$fe/src/lib/auth/permissions.ts" ""
New-File "$fe/src/lib/utils/formatDate.ts" ""
New-File "$fe/src/lib/utils/formatCurrency.ts" ""
New-File "$fe/src/lib/utils/generateUHID.ts" ""

# src/config/
New-File "$fe/src/config/roles.ts" ""
New-File "$fe/src/config/routes.ts" ""
New-File "$fe/src/config/env.ts" ""

# src/styles/
New-File "$fe/src/styles/globals.css" ""
New-File "$fe/src/styles/variables.css" ""
New-File "$fe/src/styles/themes/light.css" ""
New-File "$fe/src/styles/themes/dark.css" ""

# src/types/
New-File "$fe/src/types/api.types.ts" ""
New-File "$fe/src/types/user.types.ts" ""
New-File "$fe/src/types/patient.types.ts" ""
New-File "$fe/src/types/common.types.ts" ""

# Root frontend files
New-File "$fe/.env.local" ""
New-File "$fe/.env.example" ""
New-File "$fe/index.html" ""
New-File "$fe/vite.config.ts" ""
New-File "$fe/tsconfig.json" ""
New-File "$fe/tailwind.config.ts" ""
New-File "$fe/package.json" ""

# ─── BACKEND ──────────────────────────────────────────────────────────────────
$be = "backend"

# config/
New-File "$be/config/__init__.py" ""
New-File "$be/config/settings/base.py" ""
New-File "$be/config/settings/development.py" ""
New-File "$be/config/settings/production.py" ""
New-File "$be/config/urls.py" ""
New-File "$be/config/wsgi.py" ""
New-File "$be/config/asgi.py" ""

# apps/core/
New-File "$be/apps/core/__init__.py" ""
New-File "$be/apps/core/models.py" ""
New-File "$be/apps/core/permissions.py" ""
New-File "$be/apps/core/pagination.py" ""
New-File "$be/apps/core/exceptions.py" ""
New-File "$be/apps/core/mixins.py" ""
New-File "$be/apps/core/utils.py" ""

# apps/authentication/
New-File "$be/apps/authentication/__init__.py" ""
New-File "$be/apps/authentication/models.py" ""
New-File "$be/apps/authentication/serializers.py" ""
New-File "$be/apps/authentication/views.py" ""
New-File "$be/apps/authentication/urls.py" ""
New-File "$be/apps/authentication/services.py" ""
New-File "$be/apps/authentication/tokens.py" ""
New-File "$be/apps/authentication/admin.py" ""

# apps/users/
New-File "$be/apps/users/__init__.py" ""
New-File "$be/apps/users/models.py" ""
New-File "$be/apps/users/serializers/__init__.py" ""
New-File "$be/apps/users/serializers/doctor_serializer.py" ""
New-File "$be/apps/users/serializers/patient_serializer.py" ""
New-File "$be/apps/users/views/__init__.py" ""
New-File "$be/apps/users/views/doctor_views.py" ""
New-File "$be/apps/users/views/patient_views.py" ""
New-File "$be/apps/users/services.py" ""
New-File "$be/apps/users/permissions.py" ""
New-File "$be/apps/users/urls.py" ""

# apps/branches/
New-File "$be/apps/branches/__init__.py" ""
New-File "$be/apps/branches/models.py" ""
New-File "$be/apps/branches/serializers.py" ""
New-File "$be/apps/branches/views.py" ""
New-File "$be/apps/branches/services.py" ""
New-File "$be/apps/branches/urls.py" ""

# apps/patients/
New-File "$be/apps/patients/__init__.py" ""
New-File "$be/apps/patients/models.py" ""
New-File "$be/apps/patients/serializers.py" ""
New-File "$be/apps/patients/views.py" ""
New-File "$be/apps/patients/services.py" ""
New-File "$be/apps/patients/signals.py" ""
New-File "$be/apps/patients/urls.py" ""

# apps/appointments/
New-File "$be/apps/appointments/__init__.py" ""
New-File "$be/apps/appointments/models.py" ""
New-File "$be/apps/appointments/serializers.py" ""
New-File "$be/apps/appointments/views.py" ""
New-File "$be/apps/appointments/services.py" ""
New-File "$be/apps/appointments/urls.py" ""

# apps/doctors/
New-File "$be/apps/doctors/__init__.py" ""
New-File "$be/apps/doctors/models.py" ""
New-File "$be/apps/doctors/serializers.py" ""
New-File "$be/apps/doctors/views.py" ""
New-File "$be/apps/doctors/services.py" ""
New-File "$be/apps/doctors/urls.py" ""

# apps/billing/
New-File "$be/apps/billing/__init__.py" ""
New-File "$be/apps/billing/models.py" ""
New-File "$be/apps/billing/serializers.py" ""
New-File "$be/apps/billing/views.py" ""
New-File "$be/apps/billing/services.py" ""
New-File "$be/apps/billing/urls.py" ""

# apps/hr/
New-File "$be/apps/hr/__init__.py" ""
New-File "$be/apps/hr/models.py" ""
New-File "$be/apps/hr/serializers.py" ""
New-File "$be/apps/hr/views.py" ""
New-File "$be/apps/hr/services.py" ""
New-File "$be/apps/hr/urls.py" ""

# apps/products/
New-File "$be/apps/products/__init__.py" ""
New-File "$be/apps/products/models.py" ""
New-File "$be/apps/products/serializers.py" ""
New-File "$be/apps/products/views.py" ""
New-File "$be/apps/products/services.py" ""
New-File "$be/apps/products/urls.py" ""

# apps/campaigns/
New-File "$be/apps/campaigns/__init__.py" ""
New-File "$be/apps/campaigns/models.py" ""
New-File "$be/apps/campaigns/serializers.py" ""
New-File "$be/apps/campaigns/views.py" ""
New-File "$be/apps/campaigns/services.py" ""
New-File "$be/apps/campaigns/urls.py" ""

# apps/referrals/
New-File "$be/apps/referrals/__init__.py" ""
New-File "$be/apps/referrals/models.py" ""
New-File "$be/apps/referrals/serializers.py" ""
New-File "$be/apps/referrals/views.py" ""
New-File "$be/apps/referrals/urls.py" ""

# apps/notifications/
New-File "$be/apps/notifications/__init__.py" ""
New-File "$be/apps/notifications/models.py" ""
New-File "$be/apps/notifications/serializers.py" ""
New-File "$be/apps/notifications/views.py" ""
New-File "$be/apps/notifications/services.py" ""
New-File "$be/apps/notifications/urls.py" ""

# apps/media/
New-File "$be/apps/media/__init__.py" ""
New-File "$be/apps/media/cloudinary_service.py" ""
New-File "$be/apps/media/dropbox_service.py" ""
New-File "$be/apps/media/serializers.py" ""

# apps/public/
New-File "$be/apps/public/__init__.py" ""
New-File "$be/apps/public/models.py" ""
New-File "$be/apps/public/serializers.py" ""
New-File "$be/apps/public/views.py" ""
New-File "$be/apps/public/urls.py" ""

# api/v1/
New-File "$be/api/__init__.py" ""
New-File "$be/api/v1/__init__.py" ""
New-File "$be/api/v1/urls.py" ""

# tests/
New-File "$be/tests/conftest.py" ""
New-File "$be/tests/test_auth.py" ""
New-File "$be/tests/test_patients.py" ""
New-File "$be/tests/test_billing.py" ""
New-File "$be/tests/factories/user_factory.py" ""
New-File "$be/tests/factories/patient_factory.py" ""

# scripts/
New-File "$be/scripts/seed_data.py" ""
New-File "$be/scripts/create_superuser.py" ""

# root backend files
New-File "$be/manage.py" ""
New-File "$be/requirements/base.txt" ""
New-File "$be/requirements/development.txt" ""
New-File "$be/requirements/production.txt" ""
New-File "$be/Procfile" "web: gunicorn config.wsgi:application"
New-File "$be/runtime.txt" "python-3.11.9"
New-File "$be/.env.example" ""
New-File "$be/Dockerfile" ""

# frontend Dockerfile
New-File "$fe/Dockerfile" ""

Write-Host "Scaffold complete! Now writing starter code..." -ForegroundColor Green
