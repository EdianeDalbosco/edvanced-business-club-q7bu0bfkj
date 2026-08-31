import type { RecordModel } from 'pocketbase'

export type UserRole = 'admin' | 'member'
export type UserStatus = 'active' | 'suspended'

export interface User extends RecordModel {
  email: string
  name: string
  role?: UserRole
  status?: UserStatus
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
  registration_url?: string
}

export interface EdvancedCastEpisode extends RecordModel {
  title: string
  description?: string
  video_url?: string
  video_file?: string
  thumbnail_url?: string
  cover_image?: string
  episode_number?: number
  duration?: string
  published_at?: string
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

export interface Testimonial extends RecordModel {
  author_name: string
  author_role?: string
  company?: string
  content: string
  avatar?: string
  avatar_url?: string
  rating?: number
  order?: number
  featured?: boolean
}

export interface ClubBenefit extends RecordModel {
  title: string
  description: string
  icon_name?: string
  category?: string
  order?: number
  active?: boolean
}

export interface ClubSpacePhoto extends RecordModel {
  title: string
  caption?: string
  photo?: string
  photo_url?: string
  space_type?: string
  order?: number
  active?: boolean
}
