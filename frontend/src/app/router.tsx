import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { ROUTES } from '@/config/routes'
import RoleGuard from '@/components/shared/RoleGuard'
import { Spinner } from '@/components/ui'

// ─── Public pages ─────────────────────────────────────────────────────────────
const PublicLayout = lazy(() => import('@/components/layout/PublicLayout'))
const HomePage = lazy(() => import('@/features/public/pages/HomePage'))
const AboutPage = lazy(() => import('@/features/public/pages/AboutPage'))
const ServicesPage = lazy(() => import('@/features/public/pages/ServicesPage'))
const BlogPage = lazy(() => import('@/features/public/pages/BlogPage'))
const ContactPage = lazy(() => import('@/features/public/pages/ContactPage'))
const ProductListingPage = lazy(() => import('@/features/public/pages/ProductListingPage'))
const ReferralPage = lazy(() => import('@/features/referrals/pages/ReferralPage'))

// ─── Auth ─────────────────────────────────────────────────────────────────────
const LoginForm = lazy(() => import('@/features/auth/components/LoginForm'))
const RoleRedirect = lazy(() => import('@/features/auth/components/RoleRedirect'))

// ─── Dashboards ───────────────────────────────────────────────────────────────
const OwnerDashboard = lazy(() => import('@/features/owner/pages/OwnerDashboard'))
const DoctorDashboard = lazy(() => import('@/features/doctor/pages/DoctorDashboard'))
const ReceptionistDashboard = lazy(() => import('@/features/receptionist/pages/ReceptionistDashboard'))
const PatientDashboard = lazy(() => import('@/features/patient/pages/PatientDashboard'))
const HRDashboard = lazy(() => import('@/features/hr/pages/HRDashboard'))
const EmployeeDashboard = lazy(() => import('@/features/employee/pages/EmployeeDashboard'))

const Loading = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <Spinner size="lg" />
  </div>
)

export default function AppRouter() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        {/* Public routes */}
        <Route element={<PublicLayout />}>
          <Route path={ROUTES.HOME} element={<HomePage />} />
          <Route path={ROUTES.ABOUT} element={<AboutPage />} />
          <Route path={ROUTES.SERVICES} element={<ServicesPage />} />
          <Route path={ROUTES.BLOG} element={<BlogPage />} />
          <Route path={ROUTES.CONTACT} element={<ContactPage />} />
          <Route path={ROUTES.PRODUCTS} element={<ProductListingPage />} />
          <Route path={ROUTES.REFERRAL} element={<ReferralPage />} />
        </Route>

        {/* Auth */}
        <Route path={ROUTES.LOGIN} element={<LoginForm />} />

        {/* Protected dashboards */}
        <Route path={ROUTES.OWNER} element={<RoleGuard roles={['owner']}><OwnerDashboard /></RoleGuard>} />
        <Route path={ROUTES.DOCTOR} element={<RoleGuard roles={['doctor']}><DoctorDashboard /></RoleGuard>} />
        <Route path={ROUTES.RECEPTIONIST} element={<RoleGuard roles={['receptionist']}><ReceptionistDashboard /></RoleGuard>} />
        <Route path={ROUTES.PATIENT} element={<RoleGuard roles={['patient']}><PatientDashboard /></RoleGuard>} />
        <Route path={ROUTES.HR} element={<RoleGuard roles={['hr']}><HRDashboard /></RoleGuard>} />
        <Route path={ROUTES.EMPLOYEE} element={<RoleGuard roles={['employee']}><EmployeeDashboard /></RoleGuard>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
      </Routes>
    </Suspense>
  )
}
