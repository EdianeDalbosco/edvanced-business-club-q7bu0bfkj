import type { RecordModel } from 'pocketbase'

export type UserRole = 'admin' | 'member'

export interface User extends RecordModel {
  email: string
  name: string
  role?: UserRole
  company?: string
  phone?: string
  bio?: string
  avatar?: string
  instagram?: string
}

export interface Meeting extends RecordModel {
  title: string
  event_name?: string
  date: string
  start_date?: string
  end_date?: string
  location: string
  type?: 'presencial' | 'online' | 'hibrido'
  pricing?: 'gratuito' | 'pago'
  speakers?: string
  description?: string
  cover_image?: string
}

export type MaterialType = 'photo' | 'video' | 'document'

export interface Material extends RecordModel {
  title: string
  type: MaterialType
  file?: string
  url?: string
  description?: string
  meeting: string
  expand?: {
    meeting?: Meeting
  }
}

export type DisclosureStatus = 'pending' | 'approved' | 'rejected'

export interface Disclosure extends RecordModel {
  title: string
  content: string
  media?: string
  status: DisclosureStatus
  member: string
  admin_feedback?: string
  event_date?: string
  event_location?: string
  contact_link?: string
  format?: 'presencial' | 'online' | 'hibrido'
  pricing?: 'gratuito' | 'pago'
  expand?: {
    member?: User
  }
}
