import { NextResponse } from 'next/server'
import { getServerSession, unauthorized, badRequest, serverError } from '@/lib/api-helpers'
import { notify } from '@/lib/notify'

// POST /api/photographer/profile/resubmit
// A rejected photographer resubmits their updated profile for review:
// profile_status flips rejected -> pending, and they reappear in the admin
// approval queue. Only valid from the 'rejected' state.
export async function POST() {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()
  const db = adminDb as any

  const { data: profile } = await db
    .from('photographer_profiles')
    .select('id, profile_status')
    .eq('user_id', user.id)
    .single()

  if (!profile) return serverError('Photographer profile not found')
  if (profile.profile_status !== 'rejected') {
    return badRequest('Only a rejected profile can be resubmitted for review')
  }

  const { error } = await db
    .from('photographer_profiles')
    .update({
      profile_status: 'pending',
      status_note: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', profile.id)

  if (error) return serverError('Failed to resubmit profile')

  // Confirm to the photographer in-app.
  try {
    await notify({
      db,
      userId: user.id,
      type: 'profile_approved',
      title: 'Profile resubmitted for review',
      body: "Thanks — your profile is back in our review queue. We'll email you once it's been reviewed.",
      expiresInDays: 14,
    })
  } catch { /* best-effort */ }

  return NextResponse.json({ success: true, profile_status: 'pending' })
}
