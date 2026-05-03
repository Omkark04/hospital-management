import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Public pages
import Home from './pages/public/Home';
import About from './pages/public/About';
import Services from './pages/public/Services';
import Products from './pages/public/Products';
import ProductDetail from './pages/public/ProductDetail';
import Blog from './pages/public/Blog';
import Contact from './pages/public/Contact';
import Referral from './pages/public/Referral';
import Gallery from './pages/public/Gallery';
import Testimonials from './pages/public/Testimonials';
import BookAppointment from './pages/public/BookAppointment';

// Common components
import BackToTop from './components/common/BackToTop';
// Auth
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Dashboard layout + hub
import DashboardLayout from './components/layout/DashboardLayout';
import DashboardHub from './pages/dashboard/DashboardHub';

// ── Lazy-loaded dashboard sub-pages ──
import { lazy, Suspense } from 'react';

const PatientList     = lazy(() => import('./pages/dashboard/shared/PatientList'));
const PatientRegister = lazy(() => import('./pages/dashboard/shared/PatientRegister'));
const AppointmentList = lazy(() => import('./pages/dashboard/shared/AppointmentList'));
const PrescriptionList= lazy(() => import('./pages/dashboard/shared/PrescriptionList'));
const BillingList     = lazy(() => import('./pages/dashboard/shared/BillingList'));
const EmployeeList    = lazy(() => import('./pages/dashboard/shared/EmployeeList'));
const AttendanceList  = lazy(() => import('./pages/dashboard/shared/AttendanceList'));
const LeaveList       = lazy(() => import('./pages/dashboard/shared/LeaveList'));
const BranchList      = lazy(() => import('./pages/dashboard/owner/BranchList'));
const HospitalList    = lazy(() => import('./pages/dashboard/owner/HospitalList'));
const StaffList       = lazy(() => import('./pages/dashboard/owner/StaffList'));
const CampaignList    = lazy(() => import('./pages/dashboard/owner/CampaignList'));
const ProductManage   = lazy(() => import('./pages/dashboard/owner/ProductManage'));
const EnquiryList     = lazy(() => import('./pages/dashboard/owner/EnquiryList'));
const ReferralList    = lazy(() => import('./pages/dashboard/shared/ReferralList'));
const ProfilePage     = lazy(() => import('./pages/dashboard/shared/ProfilePage'));
const MyCampaigns     = lazy(() => import('./pages/dashboard/shared/MyCampaigns'));
const ReviewManage    = lazy(() => import('./pages/dashboard/owner/ReviewManage'));
const MyBills         = lazy(() => import('./pages/dashboard/patient/MyBills'));
const MyAttendance    = lazy(() => import('./pages/dashboard/employee/MyAttendance'));
const MyLeaves        = lazy(() => import('./pages/dashboard/employee/MyLeaves'));
const NotFound        = lazy(() => import('./pages/NotFound'));

function PageLoader() {
  return (
    <div className="loading-screen" style={{ minHeight: 'auto', padding: '80px 0' }}>
      <div className="spinner" />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* ── Public ── */}
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/services" element={<Services />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/referral" element={<Referral />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/testimonials" element={<Testimonials />} />
            <Route path="/book" element={<BookAppointment />} />

            {/* ── Auth ── */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* ── Dashboard (protected) ── */}
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardHub />} />

              {/* Shared across roles */}
              <Route path="patients" element={<PatientList />} />
              <Route path="patients/register" element={<PatientRegister />} />
              <Route path="appointments" element={<AppointmentList />} />
              <Route path="prescriptions" element={<PrescriptionList />} />
              <Route path="billing" element={<BillingList />} />
              <Route path="employees" element={<EmployeeList />} />
              <Route path="attendance" element={<AttendanceList />} />
              <Route path="leaves" element={<LeaveList />} />
              <Route path="referrals" element={<ReferralList />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="my-campaigns" element={<MyCampaigns />} />

              {/* Owner */}
              <Route path="hospitals" element={<HospitalList />} />
              <Route path="branches" element={<BranchList />} />
              <Route path="staff" element={<StaffList />} />
              <Route path="campaigns" element={<CampaignList />} />
              <Route path="products" element={<ProductManage />} />
              <Route path="enquiries" element={<EnquiryList />} />
              <Route path="reviews" element={<ReviewManage />} />

              {/* Patient */}
              <Route path="my-appointments" element={<AppointmentList />} />
              <Route path="my-records" element={<PatientList />} />
              <Route path="my-bills" element={<MyBills />} />
              <Route path="referral" element={<Referral />} />

              {/* Employee */}
              <Route path="my-attendance" element={<MyAttendance />} />
              <Route path="my-leaves" element={<MyLeaves />} />
            </Route>

            {/* ── 404 ── */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        <BackToTop />
      </AuthProvider>
    </BrowserRouter>
  );
}
