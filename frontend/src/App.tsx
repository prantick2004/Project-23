import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { PublicLayout } from '@/layouts/PublicLayout'
import { AppLayout } from '@/layouts/AppLayout'
import { RedirectIfAuthed, RequireRole } from '@/routes/guards'
import { LoadingState } from '@/components/ui/States'

const Home = lazy(() => import('@/pages/public/Home'))
const About = lazy(() => import('@/pages/public/About'))
const Features = lazy(() => import('@/pages/public/Features'))
const Contact = lazy(() => import('@/pages/public/Contact'))
const NotFound = lazy(() => import('@/pages/public/NotFound'))
const AuthPage = lazy(() => import('@/pages/auth/AuthPage'))

const AdminDashboard = lazy(() => import('@/pages/admin/Dashboard'))
const AdminCameras = lazy(() => import('@/pages/admin/Cameras'))
const AdminEmployees = lazy(() => import('@/pages/admin/Employees'))
const AdminAttendance = lazy(() => import('@/pages/admin/Attendance'))
const AdminIncidents = lazy(() => import('@/pages/admin/Incidents'))
const AdminReports = lazy(() => import('@/pages/admin/Reports'))
const AdminSettings = lazy(() => import('@/pages/admin/Settings'))

const EmployeeDashboard = lazy(() => import('@/pages/employee/Dashboard'))
const EmployeeAttendance = lazy(() => import('@/pages/employee/Attendance'))
const EmployeeHistory = lazy(() => import('@/pages/employee/History'))
const EmployeeProfile = lazy(() => import('@/pages/employee/Profile'))

export default function App() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-5xl p-8 pt-28"><LoadingState rows={2} /></div>}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="features" element={<Features />} />
          <Route path="contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route element={<RedirectIfAuthed />}>
          <Route path="login" element={<AuthPage view="employee-signin" />} />
          <Route path="login/admin" element={<AuthPage view="admin-signin" />} />
          <Route path="signup" element={<AuthPage view="employee-signup" />} />
        </Route>

        <Route path="admin" element={<RequireRole role="admin" />}>
          <Route element={<AppLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="cameras" element={<AdminCameras />} />
            <Route path="employees" element={<AdminEmployees />} />
            <Route path="attendance" element={<AdminAttendance />} />
            <Route path="incidents" element={<AdminIncidents />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
        </Route>

        <Route path="employee" element={<RequireRole role="employee" />}>
          <Route element={<AppLayout />}>
            <Route index element={<EmployeeDashboard />} />
            <Route path="attendance" element={<EmployeeAttendance />} />
            <Route path="history" element={<EmployeeHistory />} />
            <Route path="profile" element={<EmployeeProfile />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  )
}
