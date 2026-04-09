import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import RoleGuard from './RoleGuard';
import PageWrapper from '@/components/layout/PageWrapper';

// Auth
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';

// Dashboard
import DashboardRouter from '@/pages/dashboard/DashboardRouter';

// Members & Flats
import MemberList from '@/pages/members/MemberList';
import MemberDetail from '@/pages/members/MemberDetail';
import FlatList from '@/pages/flats/FlatList';

// Circulars
import CircularList from '@/pages/circulars/CircularList';
import CircularEditor from '@/pages/circulars/CircularEditor';
import CircularDetail from '@/pages/circulars/CircularDetail';

// Complaints
import ComplaintList from '@/pages/complaints/ComplaintList';
import NewComplaint from '@/pages/complaints/NewComplaint';
import ComplaintDetail from '@/pages/complaints/ComplaintDetail';

// Polls
import PollList from '@/pages/polls/PollList';
import PollEditor from '@/pages/polls/PollEditor';
import PollDetail from '@/pages/polls/PollDetail';

// Profile
import MyProfile from '@/pages/members/MyProfile';

// Audit
import AuditLogs from '@/pages/admin/AuditLogs';
import CommunityContactsAdmin from '@/pages/admin/CommunityContactsAdmin';

export default function AppRouter() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected */}
      <Route element={<ProtectedRoute />}>
        <Route element={<PageWrapper><Navigate to="/dashboard" replace /></PageWrapper>} path="/" />

        {/* Dashboard */}
        <Route path="/dashboard" element={<PageWrapper><DashboardRouter /></PageWrapper>} />

        {/* Profile */}
        <Route path="/profile" element={<PageWrapper><MyProfile /></PageWrapper>} />

        {/* Members — Admin & Committee */}
        <Route
          path="/members"
          element={
            <RoleGuard roles={['Admin', 'Committee']}>
              <PageWrapper><MemberList /></PageWrapper>
            </RoleGuard>
          }
        />
        <Route
          path="/members/:id"
          element={
            <RoleGuard roles={['Admin', 'Committee']}>
              <PageWrapper><MemberDetail /></PageWrapper>
            </RoleGuard>
          }
        />

        {/* Flats — Admin & Committee */}
        <Route
          path="/flats"
          element={
            <RoleGuard roles={['Admin', 'Committee']}>
              <PageWrapper><FlatList /></PageWrapper>
            </RoleGuard>
          }
        />

        {/* Circulars — all roles */}
        <Route path="/circulars" element={<PageWrapper><CircularList /></PageWrapper>} />
        <Route
          path="/circulars/new"
          element={
            <RoleGuard roles={['Admin', 'Committee']}>
              <PageWrapper><CircularEditor /></PageWrapper>
            </RoleGuard>
          }
        />
        <Route
          path="/circulars/:id/edit"
          element={
            <RoleGuard roles={['Admin', 'Committee']}>
              <PageWrapper><CircularEditor /></PageWrapper>
            </RoleGuard>
          }
        />
        <Route path="/circulars/:id" element={<PageWrapper><CircularDetail /></PageWrapper>} />

        {/* Complaints — all roles */}
        <Route path="/complaints" element={<PageWrapper><ComplaintList /></PageWrapper>} />
        <Route path="/complaints/new" element={<PageWrapper><NewComplaint /></PageWrapper>} />
        <Route path="/complaints/:id" element={<PageWrapper><ComplaintDetail /></PageWrapper>} />

        {/* Audit logs — Admin only */}
        <Route
          path="/admin/audit-logs"
          element={
            <RoleGuard roles={['Admin']}>
              <PageWrapper><AuditLogs /></PageWrapper>
            </RoleGuard>
          }
        />

        {/* Community Contacts — Admin manages, all view via dashboard */}
        <Route
          path="/admin/community-contacts"
          element={
            <RoleGuard roles={['Admin']}>
              <PageWrapper><CommunityContactsAdmin /></PageWrapper>
            </RoleGuard>
          }
        />

        {/* Polls — all roles see list & detail; Admin/Committee can create/edit */}
        <Route path="/polls" element={<PageWrapper><PollList /></PageWrapper>} />
        <Route
          path="/polls/new"
          element={
            <RoleGuard roles={['Admin', 'Committee']}>
              <PageWrapper><PollEditor /></PageWrapper>
            </RoleGuard>
          }
        />
        <Route path="/polls/:id" element={<PageWrapper><PollDetail /></PageWrapper>} />
        <Route
          path="/polls/:id/edit"
          element={
            <RoleGuard roles={['Admin', 'Committee']}>
              <PageWrapper><PollEditor /></PageWrapper>
            </RoleGuard>
          }
        />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
