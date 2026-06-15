import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/ui/page-header'
import ProfileForm from './ProfileForm'
import PasswordForm from './PasswordForm'
import { CopyButton } from '@/components/ui/copy-button'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const profile = await prisma.profile.findUnique({ where: { id: user.id } })
  if (!profile) redirect('/auth/login')

  return (
    <div>
      <PageHeader title="Profile" subtitle="Manage your account settings" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-bold text-gray-900 mb-5">Profile Information</h2>
          <ProfileForm name={profile.name} email={profile.email} />
          <div className="mt-5 pt-5 border-t border-gray-100 space-y-4">
            <div>
              <p className="text-xs text-gray-400 mb-1">Username</p>
              <p className="font-mono text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2">{profile.username ?? 'Not set'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Your Referral Code</p>
              <div className="flex items-center gap-2">
                <p className="font-mono text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2 flex-1">{profile.referralCode}</p>
                <CopyButton text={profile.referralCode} />
              </div>
            </div>
          </div>
        </div>

        {/* Password Change */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-bold text-gray-900 mb-5">Change Password</h2>
          <PasswordForm />
        </div>
      </div>
    </div>
  )
}
