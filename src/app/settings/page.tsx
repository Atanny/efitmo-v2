'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Profile } from '@/types/database'
import { User, Mail, Hash, Camera, Save, Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import StudentLayout from '../layout-student'

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [form, setForm] = useState({ name: '', student_number: '' })
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(data)
      setForm({ name: data?.name || '', student_number: data?.student_number || '' })
    })
  }, [])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setImagePreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    if (!form.name) return toast.error('Name is required')
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let profile_picture = profile?.profile_picture

    if (imageFile) {
      const ext = imageFile.name.split('.').pop()
      const filename = `profiles/${user.id}.${ext}`
      await supabase.storage.from('profiles').upload(filename, imageFile, { upsert: true })
      const { data: url } = supabase.storage.from('profiles').getPublicUrl(filename)
      profile_picture = url.publicUrl
    }

    const { error } = await supabase.from('profiles').update({
      name: form.name,
      student_number: form.student_number || null,
      profile_picture: profile_picture || null,
    }).eq('id', user.id)

    if (error) {
      toast.error('Failed to save changes')
    } else {
      toast.success('Profile updated!')
      setProfile((p) => p ? { ...p, name: form.name, student_number: form.student_number, profile_picture: profile_picture || null } : p)
    }
    setSaving(false)
  }

  const handleChangePassword = async () => {
    if (!passwords.new) return toast.error('Enter a new password')
    if (passwords.new !== passwords.confirm) return toast.error('Passwords do not match')
    if (passwords.new.length < 6) return toast.error('Password must be at least 6 characters')
    setChangingPassword(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: passwords.new })
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Password changed successfully!')
      setPasswords({ current: '', new: '', confirm: '' })
    }
    setChangingPassword(false)
  }

  const avatarSrc = imagePreview || profile?.profile_picture

  return (
    <StudentLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="font-display text-4xl font-black text-gray-900 uppercase">Settings</h1>
          <p className="text-gray-500 mt-1">Manage your profile and account</p>
        </div>

        {/* Profile card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-display text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
            <User className="w-5 h-5 text-primary" /> Profile Information
          </h2>

          {/* Avatar */}
          <div className="flex items-center gap-5 mb-6">
            <div className="relative">
              {avatarSrc ? (
                <img src={avatarSrc} alt="Avatar" className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-white font-bold text-2xl shadow-md border-4 border-white">
                  {profile?.name.charAt(0).toUpperCase()}
                </div>
              )}
              <label className="absolute -bottom-1 -right-1 w-7 h-7 bg-gray-900 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-700 transition-colors">
                <Camera className="w-3.5 h-3.5 text-white" />
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
            </div>
            <div>
              <p className="font-semibold text-gray-900">{profile?.name}</p>
              <p className="text-sm text-gray-400">{profile?.email}</p>
              <p className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full mt-1 inline-block capitalize">
                {profile?.role}
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <User className="w-3.5 h-3.5 inline mr-1" /> Full Name
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Hash className="w-3.5 h-3.5 inline mr-1" /> Student Number
              </label>
              <input
                value={form.student_number}
                onChange={(e) => setForm({ ...form, student_number: e.target.value })}
                placeholder="e.g. 2024-12345"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Mail className="w-3.5 h-3.5 inline mr-1" /> Email Address
              </label>
              <input
                value={profile?.email || ''}
                disabled
                className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 text-gray-400 text-sm cursor-not-allowed"
              />
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
            </div>
          </div>

          <button onClick={handleSave} disabled={saving}
            className="mt-5 flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-all disabled:opacity-60">
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Password */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-display text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" /> Change Password
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
              <input
                type="password"
                value={passwords.new}
                onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password</label>
              <input
                type="password"
                value={passwords.confirm}
                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
              />
            </div>
          </div>
          <button onClick={handleChangePassword} disabled={changingPassword}
            className="mt-5 flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-700 transition-all disabled:opacity-60">
            <Lock className="w-4 h-4" />
            {changingPassword ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </div>
    </StudentLayout>
  )
}
