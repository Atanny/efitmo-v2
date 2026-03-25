'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { PreOrder, OrderStatus } from '@/types/database'
import { Package, Clock, CheckCircle, AlertCircle, Filter, Star } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const statuses: { value: OrderStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'claiming', label: 'Claiming' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

const statusStyle: Record<string, string> = {
  pending:   'bg-yellow-50 text-yellow-700 border-yellow-200',
  accepted:  'bg-green-50 text-green-700 border-green-200',
  claiming:  'bg-blue-50 text-blue-700 border-blue-200',
  completed: 'bg-gray-100 text-gray-600 border-gray-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
  expired:   'bg-orange-50 text-orange-700 border-orange-200',
  archived:  'bg-gray-50 text-gray-500 border-gray-200',
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<PreOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all')
  const [cancellingId, setCancellingId] = useState<number | null>(null)
  const [feedbackOrder, setFeedbackOrder] = useState<PreOrder | null>(null)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')

  const fetchOrders = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const query = supabase
      .from('pre_orders')
      .select('*, product:products(*), size:sizes(*), billing:billings(status, amount)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    const { data } = await query
    setOrders(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchOrders() }, [])

  const cancelOrder = async (id: number) => {
    setCancellingId(id)
    const supabase = createClient()
    await supabase.from('pre_orders').update({ status: 'cancelled' }).eq('id', id)
    toast.success('Order cancelled')
    setOrders(orders.map((o) => o.id === id ? { ...o, status: 'cancelled' } : o))
    setCancellingId(null)
  }

  const submitFeedback = async () => {
    if (!feedbackOrder) return
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: profile } = await supabase.from('profiles').select('student_number').eq('id', user.id).single()

    await supabase.from('feedback').insert({
      pre_order_id: feedbackOrder.id,
      user_id: user.id,
      student_number: profile?.student_number || null,
      rating,
      comment: comment || null,
    })
    toast.success('Feedback submitted!')
    setFeedbackOrder(null)
    setRating(5)
    setComment('')
  }

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-4xl font-black text-gray-900 uppercase">My Orders</h1>
        <p className="text-gray-500 mt-1">Track all your pre-orders</p>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
        {statuses.map(({ value, label }) => (
          <button key={value} onClick={() => setFilter(value)}
            className={clsx(
              'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border',
              filter === value
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary'
            )}>
            {label}
            {value !== 'all' && orders.filter((o) => o.status === value).length > 0 && (
              <span className={clsx('ml-1.5 text-xs px-1.5 py-0.5 rounded-full', filter === value ? 'bg-white/30' : 'bg-gray-100')}>
                {orders.filter((o) => o.status === value).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center py-20 text-center">
          <Package className="w-14 h-14 text-gray-200 mb-3" />
          <p className="text-gray-500">No {filter !== 'all' ? filter : ''} orders found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const product = order.product as { name?: string }
            const size = order.size as { size?: string; price?: number }
            const billing = order.billing as { status?: string; amount?: number } | undefined
            return (
              <div key={order.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Package className="w-6 h-6 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-900">{product?.name || 'Product'}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {size?.size && <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">Size {size.size}</span>}
                          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">Qty: {order.quantity}</span>
                          {billing?.amount && <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">₱{billing.amount}</span>}
                        </div>
                      </div>
                      <span className={`flex-shrink-0 text-xs font-semibold px-3 py-1 rounded-full border capitalize ${statusStyle[order.status] || ''}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(order.created_at), 'MMM d, yyyy h:mm a')}
                      </p>
                      <div className="flex gap-2">
                        {order.status === 'pending' && (
                          <button onClick={() => cancelOrder(order.id)}
                            disabled={cancellingId === order.id}
                            className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors disabled:opacity-50">
                            Cancel
                          </button>
                        )}
                        {order.status === 'completed' && (
                          <button onClick={() => setFeedbackOrder(order)}
                            className="text-xs flex items-center gap-1 text-primary font-medium hover:underline">
                            <Star className="w-3 h-3" /> Leave Feedback
                          </button>
                        )}
                      </div>
                    </div>
                    {order.remark && (
                      <div className="mt-2 text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg">
                        Admin note: {order.remark}
                      </div>
                    )}
                    {billing?.status && (
                      <div className={clsx('mt-2 text-xs px-3 py-1.5 rounded-lg font-medium',
                        billing.status === 'Paid' ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700')}>
                        Payment: {billing.status}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Feedback modal */}
      {feedbackOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 animate-fade-in">
            <h2 className="font-display text-2xl font-bold mb-1">Leave Feedback</h2>
            <p className="text-gray-400 text-sm mb-5">How was your experience?</p>
            <div className="flex gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((r) => (
                <button key={r} onClick={() => setRating(r)}>
                  <Star className={clsx('w-8 h-8 transition-colors', r <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200')} />
                </button>
              ))}
            </div>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us about your experience (optional)"
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm resize-none mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setFeedbackOrder(null)}
                className="flex-1 py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50">Cancel</button>
              <button onClick={submitFeedback}
                className="flex-1 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark">Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
