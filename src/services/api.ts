import pb from '@/lib/pocketbase/client'
import type {
  Meeting,
  Material,
  Disclosure,
  User,
  EdvancedCastEpisode,
  Testimonial,
  ClubBenefit,
  ClubSpacePhoto,
} from '@/types'

// Helper to get file URL
export function getFileUrl(collectionIdOrName: string, recordId: string, filename: string): string {
  if (!filename) return ''
  return pb.files.getURL({ id: recordId, collectionId: collectionIdOrName } as any, filename)
}

// MEETINGS
export async function getMeetings(): Promise<Meeting[]> {
  return pb.collection('meetings').getFullList<Meeting>({
    sort: '-date',
  })
}

export async function getMeetingById(id: string): Promise<Meeting> {
  return pb.collection('meetings').getOne<Meeting>(id)
}

export async function createMeeting(data: Partial<Meeting> | FormData): Promise<Meeting> {
  return pb.collection('meetings').create<Meeting>(data)
}

export async function updateMeeting(
  id: string,
  data: Partial<Meeting> | FormData,
): Promise<Meeting> {
  return pb.collection('meetings').update<Meeting>(id, data)
}

export async function deleteMeeting(id: string): Promise<boolean> {
  return pb.collection('meetings').delete(id)
}

// MATERIALS
export async function getMaterialsByMeeting(meetingId: string): Promise<Material[]> {
  const records = await pb.collection('materials').getFullList<any>({
    filter: `meeting = "${meetingId}" || meeting_id = "${meetingId}"`,
    sort: '-created',
    expand: 'meeting',
  })
  return records.map((r) => {
    let resolvedUrl = r.url
    if (r.file && (!resolvedUrl || !resolvedUrl.startsWith('http'))) {
      resolvedUrl = getFileUrl('materials', r.id, r.file)
    }
    return {
      id: r.id,
      collectionId: r.collectionId || '',
      collectionName: r.collectionName || 'materials',
      meeting: r.meeting || r.meeting_id || '',
      meeting_id: r.meeting_id || r.meeting,
      title: r.title,
      description: r.description,
      type: r.type,
      url: resolvedUrl || r.url || '',
      created: r.created,
      updated: r.updated,
      expand: r.expand,
    } as unknown as Material
  })
}

export async function getAllMaterials(): Promise<Material[]> {
  const records = await pb.collection('materials').getFullList<any>({
    sort: '-created',
    expand: 'meeting',
  })
  return records.map((r) => {
    let resolvedUrl = r.url
    if (r.file && (!resolvedUrl || !resolvedUrl.startsWith('http'))) {
      resolvedUrl = getFileUrl('materials', r.id, r.file)
    }
    return {
      id: r.id,
      collectionId: r.collectionId || '',
      collectionName: r.collectionName || 'materials',
      meeting: r.meeting || r.meeting_id || '',
      meeting_id: r.meeting_id || r.meeting,
      title: r.title,
      description: r.description,
      type: r.type,
      url: resolvedUrl || r.url || '',
      created: r.created,
      updated: r.updated,
      expand: r.expand,
    } as unknown as Material
  })
}

export async function createMaterial(data: FormData | Partial<Material>): Promise<Material> {
  return pb.collection('materials').create<Material>(data)
}

export async function deleteMaterial(id: string): Promise<boolean> {
  return pb.collection('materials').delete(id)
}

// DISCLOSURES
export async function getApprovedDisclosures(): Promise<Disclosure[]> {
  return pb.collection('disclosures').getFullList<Disclosure>({
    filter: 'status = "approved"',
    sort: '-created',
    expand: 'member',
  })
}

export async function getMemberDisclosures(memberId: string): Promise<Disclosure[]> {
  return pb.collection('disclosures').getFullList<Disclosure>({
    filter: `member = "${memberId}"`,
    sort: '-created',
    expand: 'member',
  })
}

export async function getPendingDisclosures(): Promise<Disclosure[]> {
  return pb.collection('disclosures').getFullList<Disclosure>({
    filter: 'status = "pending"',
    sort: '-created',
    expand: 'member',
  })
}

export async function getAllDisclosuresForAdmin(): Promise<Disclosure[]> {
  return pb.collection('disclosures').getFullList<Disclosure>({
    sort: '-created',
    expand: 'member',
  })
}

export async function createDisclosure(formData: FormData): Promise<Disclosure> {
  return pb.collection('disclosures').create<Disclosure>(formData)
}

export async function updateDisclosureStatus(
  id: string,
  status: 'approved' | 'rejected',
  admin_feedback?: string,
): Promise<Disclosure> {
  return pb.collection('disclosures').update<Disclosure>(id, {
    status,
    admin_feedback: admin_feedback || '',
  })
}

export async function deleteDisclosure(id: string): Promise<boolean> {
  return pb.collection('disclosures').delete(id)
}

// MEMBERS / USERS
export async function getMembers(): Promise<User[]> {
  return pb.collection('users').getFullList<User>({
    sort: 'name',
  })
}

export async function updateProfile(userId: string, data: Partial<User> | FormData): Promise<User> {
  return pb.collection('users').update<User>(userId, data)
}

export async function createMemberByAdmin(data: {
  name: string
  email: string
  password?: string
  role?: 'admin' | 'member'
  status?: 'active' | 'suspended'
  company?: string
  phone?: string
  bio?: string
  instagram?: string
}): Promise<User> {
  const defaultPassword = data.password || 'Skip@Pass'
  return pb.collection('users').create<User>({
    name: data.name,
    email: data.email,
    password: defaultPassword,
    passwordConfirm: defaultPassword,
    role: data.role || 'member',
    status: data.status || 'active',
    company: data.company || '',
    phone: data.phone || '',
    bio: data.bio || '',
    instagram: data.instagram || '',
    verified: true,
  })
}

export async function updateUserByAdmin(
  userId: string,
  data: Partial<User> | FormData,
): Promise<User> {
  return pb.collection('users').update<User>(userId, data)
}

export async function toggleMemberSuspension(
  userId: string,
  currentStatus?: 'active' | 'suspended',
): Promise<User> {
  const nextStatus = currentStatus === 'suspended' ? 'active' : 'suspended'
  return pb.collection('users').update<User>(userId, {
    status: nextStatus,
  })
}

// EDVANCED CAST (PODCAST)
export async function getEdvancedCastEpisodes(): Promise<EdvancedCastEpisode[]> {
  return pb.collection('edvanced_cast').getFullList<EdvancedCastEpisode>({
    sort: '-episode_number,-published_at,-created',
  })
}

export async function getEdvancedCastEpisodeById(id: string): Promise<EdvancedCastEpisode> {
  return pb.collection('edvanced_cast').getOne<EdvancedCastEpisode>(id)
}

export async function createEdvancedCastEpisode(
  data: Partial<EdvancedCastEpisode> | FormData,
): Promise<EdvancedCastEpisode> {
  return pb.collection('edvanced_cast').create<EdvancedCastEpisode>(data)
}

export async function updateEdvancedCastEpisode(
  id: string,
  data: Partial<EdvancedCastEpisode> | FormData,
): Promise<EdvancedCastEpisode> {
  return pb.collection('edvanced_cast').update<EdvancedCastEpisode>(id, data)
}

export async function deleteEdvancedCastEpisode(id: string): Promise<boolean> {
  return pb.collection('edvanced_cast').delete(id)
}

// TESTIMONIALS (DEPOIMENTOS DE MEMBROS)
export async function getTestimonials(): Promise<Testimonial[]> {
  return pb.collection('testimonials').getFullList<Testimonial>({
    sort: '-featured,order,-created',
  })
}

export async function getTestimonialById(id: string): Promise<Testimonial> {
  return pb.collection('testimonials').getOne<Testimonial>(id)
}

export async function createTestimonial(
  data: Partial<Testimonial> | FormData,
): Promise<Testimonial> {
  return pb.collection('testimonials').create<Testimonial>(data)
}

export async function updateTestimonial(
  id: string,
  data: Partial<Testimonial> | FormData,
): Promise<Testimonial> {
  return pb.collection('testimonials').update<Testimonial>(id, data)
}

export async function deleteTestimonial(id: string): Promise<boolean> {
  return pb.collection('testimonials').delete(id)
}

// CLUB BENEFITS (BENEFÍCIOS DO CLUB)
export async function getClubBenefits(): Promise<ClubBenefit[]> {
  return pb.collection('club_benefits').getFullList<ClubBenefit>({
    filter: 'active = true',
    sort: 'order,created',
  })
}

export async function getAllClubBenefitsForAdmin(): Promise<ClubBenefit[]> {
  return pb.collection('club_benefits').getFullList<ClubBenefit>({
    sort: 'order,created',
  })
}

export async function createClubBenefit(data: Partial<ClubBenefit>): Promise<ClubBenefit> {
  return pb.collection('club_benefits').create<ClubBenefit>(data)
}

export async function updateClubBenefit(
  id: string,
  data: Partial<ClubBenefit>,
): Promise<ClubBenefit> {
  return pb.collection('club_benefits').update<ClubBenefit>(id, data)
}

export async function deleteClubBenefit(id: string): Promise<boolean> {
  return pb.collection('club_benefits').delete(id)
}

// CLUB SPACES PHOTOS (FOTOS DO LOCAL E SALAS)
export async function getClubSpacesPhotos(): Promise<ClubSpacePhoto[]> {
  return pb.collection('club_spaces_photos').getFullList<ClubSpacePhoto>({
    filter: 'active = true',
    sort: 'order,created',
  })
}

export async function getAllClubSpacesPhotosForAdmin(): Promise<ClubSpacePhoto[]> {
  return pb.collection('club_spaces_photos').getFullList<ClubSpacePhoto>({
    sort: 'order,created',
  })
}

export async function createClubSpacePhoto(
  data: Partial<ClubSpacePhoto> | FormData,
): Promise<ClubSpacePhoto> {
  return pb.collection('club_spaces_photos').create<ClubSpacePhoto>(data)
}

export async function updateClubSpacePhoto(
  id: string,
  data: Partial<ClubSpacePhoto> | FormData,
): Promise<ClubSpacePhoto> {
  return pb.collection('club_spaces_photos').update<ClubSpacePhoto>(id, data)
}

export async function deleteClubSpacePhoto(id: string): Promise<boolean> {
  return pb.collection('club_spaces_photos').delete(id)
}
