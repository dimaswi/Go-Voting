import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDateTime(dateString: string) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export function formatDate(dateString: string) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
  }).format(date)
}

export function getStatusColor(status: string) {
  switch (status?.toLowerCase()) {
    case 'active':
    case 'published':
      return 'bg-green-100 text-green-700 hover:bg-green-100'
    case 'draft':
      return 'bg-gray-100 text-gray-700 hover:bg-gray-100'
    case 'completed':
    case 'finished':
      return 'bg-blue-100 text-blue-700 hover:bg-blue-100'
    case 'blocked':
    case 'archived':
      return 'bg-red-100 text-red-700 hover:bg-red-100'
    default:
      return 'bg-gray-100 text-gray-700 hover:bg-gray-100'
  }
}

export function getStatusLabel(status: string) {
  switch (status?.toLowerCase()) {
    case 'active': return 'Aktif'
    case 'published': return 'Dipublikasi'
    case 'draft': return 'Draft'
    case 'completed':
    case 'finished': return 'Selesai'
    case 'blocked': return 'Diblokir'
    case 'archived': return 'Diarsipkan'
    default: return status || '-'
  }
}

export function getGenderLabel(gender: string) {
  switch (gender?.toLowerCase()) {
    case 'male': return 'Laki-laki'
    case 'female': return 'Perempuan'
    case 'other': return 'Lainnya'
    default: return gender || '-'
  }
}
