import pb from '@/lib/pocketbase/client'
import type { Meeting, Material, Disclosure, User } from '@/types'

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

// MATERIALS
export async function getMaterialsByMeeting(meetingId: string): Promise<Material[]> {
  return pb.collection('materials').getFullList<Material>({
    filter: `meeting = "${meetingId}"`,
    sort: '-created',
  })
}

export async function getAllMaterials(): Promise<Material[]> {
  return pb.collection('materials').getFullList<Material>({
    sort: '-created',
    expand: 'meeting',
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
  company?: string
  phone?: string
  bio?: string
}): Promise<User> {
  const defaultPassword = data.password || 'Skip@Pass'
  return pb.collection('users').create<User>({
    name: data.name,
    email: data.email,
    password: defaultPassword,
    passwordConfirm: defaultPassword,
    role: data.role || 'member',
    company: data.company || '',
    phone: data.phone || '',
    bio: data.bio || '',
    verified: true,
  })
}
