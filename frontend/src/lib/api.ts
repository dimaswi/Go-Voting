import axios, { type AxiosError } from 'axios'
import { toast } from 'sonner'

const rawApiBaseUrl = (import.meta.env.VITE_API_URL || '').trim()
const API_BASE_URL = rawApiBaseUrl.replace(/\/$/, '')

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
})

// ============================================================
// Request interceptor — attach JWT token for admin routes
// ============================================================
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('govote_admin_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ============================================================
// Response interceptor — handle 401 and errors globally
// ============================================================
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; success?: boolean }>) => {
    if (error.response?.status === 401) {
      // Clear auth and redirect to login
      localStorage.removeItem('govote_admin_token')
      localStorage.removeItem('govote_admin_info')
      if (window.location.pathname.startsWith('/admin') && !window.location.pathname.includes('/login')) {
        window.location.href = '/admin/login'
      }
    }

    const message = error.response?.data?.message || error.message || 'Something went wrong'

    // Don't show toast for auth errors (handled separately)
    if (error.response?.status !== 401 && error.response?.status !== 403) {
      toast.error(message)
    }

    return Promise.reject(error)
  }
)

// ============================================================
// Auth API
// ============================================================
export const authAPI = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
}

// ============================================================
// Admin Events API
// ============================================================
export const eventsAPI = {
  list: (params?: Record<string, string | number>) =>
    api.get('/admin/events', { params }),
  create: (data: object) => api.post('/admin/events', data),
  getById: (id: string) => api.get(`/admin/events/${id}`),
  update: (id: string, data: object) => api.put(`/admin/events/${id}`, data),
  delete: (id: string) => api.delete(`/admin/events/${id}`),
  updateStatus: (id: string, status: string) =>
    api.patch(`/admin/events/${id}/status`, { status }),
  getResults: (eventId: string) =>
    api.get(`/admin/events/${eventId}/results`),
}

// ============================================================
// Admin Candidates API
// ============================================================
export const candidatesAPI = {
  list: (params?: Record<string, string | number | boolean>) =>
    api.get('/admin/candidates', { params }),
  create: (data: object) => api.post('/admin/candidates', data),
  getById: (id: string) => api.get(`/admin/candidates/${id}`),
  update: (id: string, data: object) => api.put(`/admin/candidates/${id}`, data),
  delete: (id: string) => api.delete(`/admin/candidates/${id}`),
  uploadPhoto: (id: string, file: File) => {
    const formData = new FormData()
    formData.append('photo', file)
    return api.post(`/admin/candidates/${id}/photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  // Event candidates
  listByEvent: (eventId: string) => api.get(`/admin/events/${eventId}/candidates`),
  assignToEvent: (eventId: string, candidates: object[]) =>
    api.post(`/admin/events/${eventId}/candidates/assign`, { candidates }),
  reorderInEvent: (eventId: string, orders: object[]) =>
    api.put(`/admin/events/${eventId}/candidates/reorder`, { orders }),
  removeFromEvent: (eventId: string, candidateId: string) =>
    api.delete(`/admin/events/${eventId}/candidates/${candidateId}`),
}

// ============================================================
// Admin Voters API
// ============================================================
export const votersAPI = {
  list: (params?: Record<string, string | number>) =>
    api.get('/admin/voters', { params }),
  create: (data: object) => api.post('/admin/voters', data),
  getById: (id: string) => api.get(`/admin/voters/${id}`),
  update: (id: string, data: object) => api.put(`/admin/voters/${id}`, data),
  delete: (id: string) => api.delete(`/admin/voters/${id}`),
  generateQR: (id: string) => api.post(`/admin/voters/${id}/generate-qr`),
  printBulk: (voterIds: string[]) => 
    api.post('/admin/voters/print-bulk', { voter_ids: voterIds }, { responseType: 'blob' }),
  // Event voters
  listByEvent: (eventId: string, params?: Record<string, string | number>) =>
    api.get(`/admin/events/${eventId}/voters`, { params }),
  assignToEvent: (eventId: string, voterIds: string[]) =>
    api.post(`/admin/events/${eventId}/voters/assign`, { voter_ids: voterIds }),
  removeFromEvent: (eventId: string, voterId: string) =>
    api.delete(`/admin/events/${eventId}/voters/${voterId}`),
}

// ============================================================
// Dashboard API
// ============================================================
export const dashboardAPI = {
  getStats: () => api.get('/admin/dashboard/stats'),
}

// ============================================================
// Public Voting API
// ============================================================
export const votingAPI = {
  validateCode: (code: string) => api.post('/vote/validate-code', { code }),
  getSession: (token: string) => api.get(`/vote/session/${token}`),
  getCandidates: (eventId: string, token: string) =>
    api.get(`/vote/events/${eventId}/candidates`, {
      headers: { 'X-Voting-Token': token },
      params: { token },
    }),
  submitVote: (eventId: string, token: string, candidateIds: string[]) =>
    api.post(
      `/vote/events/${eventId}/submit`,
      { candidate_ids: candidateIds },
      { headers: { 'X-Voting-Token': token } }
    ),
}
