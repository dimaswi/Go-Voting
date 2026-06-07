import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { AuthProvider, useAuth } from '@/features/auth/AuthContext'

// Admin pages
import LoginPage from '@/pages/admin/LoginPage'
import DashboardPage from '@/pages/admin/DashboardPage'
import EventsPageIndex from '@/pages/admin/events/index'
import CreateEventPage from '@/pages/admin/events/create'
import EditEventPage from '@/pages/admin/events/edit'
import ShowEventPage from '@/pages/admin/events/show'
import CandidatesPageIndex from '@/pages/admin/candidates/index'
import CreateCandidatePage from '@/pages/admin/candidates/create'
import EditCandidatePage from '@/pages/admin/candidates/edit'
import ShowCandidatePage from '@/pages/admin/candidates/show'
import VotersPageIndex from '@/pages/admin/voters/index'
import CreateVoterPage from '@/pages/admin/voters/create'
import EditVoterPage from '@/pages/admin/voters/edit'
import ShowVoterPage from '@/pages/admin/voters/show'
import ResultsPage from '@/pages/admin/events/results'
import AdminLayout from '@/layouts/AdminLayout'
import { TooltipProvider } from "@/components/ui/tooltip"

// Voting pages
import ScanPage from '@/pages/vote/ScanPage'
import VotingPage from '@/pages/vote/VotingPage'
import ConfirmPage from '@/pages/vote/ConfirmPage'
import SuccessPage from '@/pages/vote/SuccessPage'
import ErrorPage from '@/pages/vote/ErrorPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
})

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return <div className="flex items-center justify-center h-screen">
    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
  </div>
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
        <BrowserRouter>
          <Toaster position="top-right" richColors />
          <Routes>
            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />

            {/* Admin auth */}
            <Route path="/admin/login" element={<LoginPage />} />

            {/* Admin protected routes */}
            <Route path="/admin" element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }>
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="events" element={<EventsPageIndex />} />
              <Route path="events/create" element={<CreateEventPage />} />
              <Route path="events/:id" element={<ShowEventPage />} />
              <Route path="events/:id/edit" element={<EditEventPage />} />
              <Route path="candidates" element={<CandidatesPageIndex />} />
              <Route path="candidates/create" element={<CreateCandidatePage />} />
              <Route path="candidates/:id" element={<ShowCandidatePage />} />
              <Route path="candidates/:id/edit" element={<EditCandidatePage />} />
              <Route path="voters" element={<VotersPageIndex />} />
              <Route path="voters/create" element={<CreateVoterPage />} />
              <Route path="voters/:id" element={<ShowVoterPage />} />
              <Route path="voters/:id/edit" element={<EditVoterPage />} />
              <Route path="events/:id/results" element={<ResultsPage />} />
            </Route>

            {/* Public voting routes */}
            <Route path="/vote" element={<ScanPage />} />
            <Route path="/vote/scan" element={<ScanPage />} />
            <Route path="/vote/event/:eventId" element={<VotingPage />} />
            <Route path="/vote/event/:eventId/confirm" element={<ConfirmPage />} />
            <Route path="/vote/success" element={<SuccessPage />} />
            <Route path="/vote/error" element={<ErrorPage />} />

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  )
}
