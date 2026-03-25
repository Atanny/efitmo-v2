'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Star, Trash2, MessageSquare } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

interface FeedbackRow {
  id: number
  rating: number
  comment: string | null
  created_at: string
  user: { name: string; student_number: string | null } | null
  pre_order: { product: { name: string } | null } | null
}

export default function AdminFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<FeedbackRow[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<number[]>([])

  const fetchFeedbacks = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('feedback')
      .select('*, user:profiles(name,student_number), pre_order:pre_orders(product:products(name))')
      .order('created_at', { ascending: false })
    setFeedbacks((data || []) as FeedbackRow[])
    setLoading(false)
  }

  useEffect(() => { fetchFeedbacks() }, [])

  const deleteFeedback = async (id: number) => {
    const supabase = createClient()
    await supabase.from('feedback').delete().eq('id', id)
    setFeedbacks(feedbacks.filter((f) => f.id !== id))
    toast.success('Deleted')
  }

  const deleteSelected = async () => {
    if (!confirm(`Delete ${selected.length} entries?`)) return
    const supabase = createClient()
    await supabase.from('feedback').delete().in('id', selected)
    setFeedbacks(feedbacks.filter((f) => !selected.includes(f.id)))
    setSelected([])
    toast.success('Deleted selected')
  }

  const avg = feedbacks.length > 0
    ? (feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length).toFixed(1)
    : '0'

  const dist = [5, 4, 3, 2, 1].map((r) => ({
    rating: r,
    count: feedbacks.filter((f) => f.rating === r).length,
    pct: feedbacks.length > 0 ? Math.round((feedbacks.filter((f) => f.rating === r).length / feedbacks.length) * 100) : 0,
  }))

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl font-black text-gray-900 uppercase">Feedback</h1>
          <p className="text-gray-500 mt-1">{feedbacks.length} reviews</p>
        </div>
        {selected.length > 0 && (
          <button onClick={deleteSelected}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700">
            <Trash2 className="w-4 h-4" /> Delete {selected.length}
          </button>
        )}
      </div>

      {feedbacks.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center gap-6">
            <div className="text-center">
              <p className="font-display text-6xl font-black text-primary">{avg}</p>
              <div className="flex gap-0.5 mt-1 justify-center">
                {[1,2,3,4,5].map((s) => (
                  <Star key={s} className={`w-4 h-4 ${parseFloat(avg) >= s ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1">{feedbacks.length} reviews</p>
            </div>
            <div className="flex-1 space-y-1.5">
              {dist.map(({ rating, count, pct }) => (
                <div key={rating} className="flex items-center gap-2 text-xs">
                  <span className="text-gray-500 w-3">{rating}</span>
                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                  <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                    <div className="bg-yellow-400 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-gray-400 w-6 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 text-navy/30 mx-auto mb-2" />
              <p className="font-display text-3xl font-black text-navy">{feedbacks.filter((f) => f.comment).length}</p>
              <p className="text-sm text-gray-500">With comments</p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 h-24 animate-pulse" />)}</div>
      ) : feedbacks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center py-20 text-center">
          <Star className="w-14 h-14 text-gray-200 mb-3" />
          <p className="text-gray-500">No feedback yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {feedbacks.map((f) => (
            <div key={f.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start gap-4">
                <input type="checkbox" checked={selected.includes(f.id)}
                  onChange={() => setSelected((p) => p.includes(f.id) ? p.filter((x) => x !== f.id) : [...p, f.id])}
                  className="mt-1 rounded accent-primary" />
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {f.user?.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">{f.user?.name || 'Anonymous'}</p>
                      <p className="text-xs text-gray-400">{f.user?.student_number || ''}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map((s) => (
                          <Star key={s} className={`w-3.5 h-3.5 ${f.rating >= s ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
                        ))}
                      </div>
                      <button onClick={() => deleteFeedback(f.id)} className="text-gray-300 hover:text-red-500 transition-colors ml-2">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {f.pre_order?.product && (
                    <p className="text-xs text-primary bg-primary/5 px-2 py-0.5 rounded-full inline-block mt-1">{f.pre_order.product.name}</p>
                  )}
                  {f.comment && <p className="text-sm text-gray-600 mt-2 leading-relaxed">{f.comment}</p>}
                  <p className="text-xs text-gray-400 mt-2">{format(new Date(f.created_at), 'MMM d, yyyy')}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
