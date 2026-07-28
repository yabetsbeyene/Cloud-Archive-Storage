import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthLayout } from '@/layouts/AuthLayout'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { ProtectedRoute } from '@/routes/ProtectedRoute'

import { LoginPage } from '@/pages/Login/LoginPage'
import { DashboardPage } from '@/pages/Dashboard/DashboardPage'
import { DocumentsPage } from '@/pages/Documents/DocumentsPage'
import { DocumentDetailPage } from '@/pages/Documents/DocumentDetailPage'
import { UploadPage } from '@/pages/Documents/UploadPage'
import { CategoriesPage } from '@/pages/Categories/CategoriesPage.tsx'
import { DepartmentsPage } from '@/pages/Departments/DepartmentsPage'
import { UsersPage } from '@/pages/Users/UsersPage'
import { AuditLogsPage } from '@/pages/AuditLogs/AuditLogsPage'
import { SettingsPage } from '@/pages/Settings/SettingsPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />

          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/documents/new" element={<UploadPage />} />
          <Route path="/documents/:id" element={<DocumentDetailPage />} />
          <Route path="/documents/:id/edit" element={<DocumentDetailPage />} />
          <Route path="/documents/:id/history" element={<DocumentDetailPage />} />
          <Route path="/documents/:id/versions" element={<DocumentDetailPage />} />

          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/departments" element={<DepartmentsPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/audit-logs" element={<AuditLogsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
