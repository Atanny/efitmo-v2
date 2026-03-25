'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Announcement } from '@/types/database'
import { Plus, Pencil, Trash2, Megaphone, X, Image as ImageIcon, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<{ open: boolean; item?: Announcement }>({ open: false })
  const [form, setForm] = useState({ title: '', content: '', link: '', event_time: '' })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  const fetchAnnouncements = async () => {
    const supabase = createClient()
    const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false })
    setAnnouncements(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchAnnouncements() }, [])

  const openCreate = () => {
    setForm({ title: '', content: '', link: '', event_time: '' })
    setImageFile(null)
    setModal({ open: true })
  }

  const openEdit = (item: Announcement) => {
    setForm({ title: item.title, content: item.content, link: item.link || '', event_time: item.event_time ? item.event_time.slice(0, 16) : '' })
    setModal({ open: true, item })
  }

  const handleSave = async () => {
    if (!form.title || !form.content) return toast.error('Title and content are required')
    setSaving(true)
    const supabase = createClient()
    let image_url: string | undefined

    if (imageFile) {
      const filename = `announcements/${Date.now()}.${imageFile.name.split('.').pop()}`
      const { data: upload } = await supabase.storage.from('announcements').upload(filename, imageFile, { upsert: true })
      if (upload) {
        const { data: url } = supabase.storage.from('announcements').getPublicUrl(filename)
        image_url = url.publicUrl
      }
    }

    const payload = {
      title: form.title,
      content: form.content,
      link: form.link || null,
      event_time: form.event_time ? new Date(form.event_time).toISOString() : null,
      ...(image_url ? { image_url } : {}),
    }

    if (modal.item) {
      await supabase.from('announcements').update(payload).eq('id', modal.item.id)
      toast.success('Announcement updated!')
    } else {
      await supabase.from('announcements').insert(payload)
      toast.success('Announcement posted!')
    }

    setSaving(false)
    setModal({ open: false })
    fetchAnnouncements()
  }

  const deleteAnnouncement = async (id: number) => {
    if (!confirm('Delete this announcement?')) return
    const supabase = createClient()
    await supabase.from('announcements').delete().eq('id', id)
    setAnnouncements(announcements.filter((a) => a.id !== id))
    toast.success('Deleted')
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl font-black text-gray-900 uppercase">Announcements</h1>
          <p className="text-gray-500 mt-1">{announcements.length} total</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-all">
          <Plus className="w-4 h-4" /> New Announcement
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
              <div className="bg-gray-200 h-5 rounded w-1/3 mb-3" />
              <div className="bg-gray-200 h-4 rounded w-full mb-2" />
              <div className="bg-gray-200 h-4 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center py-20 text-center">
          <Megaphone className="w-14 h-14 text-gray-200 mb-3" />
          <p className="text-gray-500">No announcements yet</p>
          <button onClick={openCreate} className="mt-4 text-primary font-semibold hover:underline text-sm">Post your first →</button>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((a) => (
            <div key={a.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-sm transition-shadow">
              <div className="flex">
                {a.image_url && (
                  <div className="w-32 flex-shrink-0 hidden sm:block">
                    <img src={a.image_url} alt={a.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display text-xl font-bold text-gray-900">{a.title}</h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{a.content}</p>
                      <div className="flex items-center gap-3 mt-3 flex-wrap">
                        <span className="text-xs text-gray-400">{format(new Date(a.created_at), 'MMM d, yyyy')}</span>
                        {a.event_time && (
                          <span className="text-xs bg-navy/10 text-navy px-2 py-0.5 rounded-full">
                            Event: {format(new Date(a.event_time), 'MMM d, h:mm a')}
                          </span>
                        )}
                        {a.link && (
                          <a href={a.link} target="_blank" rel="noopener noreferrer"
                            className="text-xs flex items-center gap-1 text-primary hover:underline">
                            <ExternalLink className="w-3 h-3" /> Link
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => openEdit(a)} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteAnnouncement(a.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-2xl font-bold">{modal.item ? 'Edit' : 'New'} Announcement</h2>
              <button onClick={() => setModal({ open: false })} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Title *</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Announcement title"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Content *</label>
                <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={4}
                  placeholder="Write the announcement content..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Event Date & Time (optional)</label>
                <input type="datetime-local" value={form.event_time} onChange={(e) => setForm({ ...form, event_time: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Link (optional)</label>
                <input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="https://..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Image (optional)</label>
                <label className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-gray-300 hover:border-primary cursor-pointer transition-colors">
                  <ImageIcon className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-500">{imageFile ? imageFile.name : 'Choose image...'}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
                </label>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModal({ open: false })}
                className="flex-1 py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark disabled:opacity-60">
                {saving ? 'Saving...' : modal.item ? 'Update' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
