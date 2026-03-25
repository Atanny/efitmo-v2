'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Profile, PreOrder, Announcement } from '@/types/database'
import { ShoppingBag, ClipboardList, CheckCircle, Clock, Package, AlertCircle, Megaphone, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  pending:   { label: 'Pending',   color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200', icon: Clock },
  accepted:  { label: 'Accepted',  color: 'text-green-700',  bg: 'bg-green-50 border-green-200',   icon: CheckCircle },
  claiming:  { label: 'Claiming',  color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200',     icon: Package },
  completed: { label: 'Completed', color: 'text-gray-600',   bg: 'bg-gray-50 border-gray-200',     icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'text-red-700',    bg: 'bg-red-50 border-red-200',       icon: AlertCircle },
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [orders, setOrders] = useState<PreOrder[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: prof }, { data: ord }, { data: ann }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('pre_orders').select('*, product:products(*), size:sizes(*)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('announcements').select('*').order('created_at', { ascending: false }).limit(3),
      ])

      setProfile(prof)
      setOrders(ord || [])
      setAnnouncements(ann || [])
      setLoading(false)
    }
    load()
  }, [])

  const grouped = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl p-8 text-white" style={{ background: 'linear-gradient(135deg, #8A1A24, #194E90)' }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 30px, rgba(255,255,255,.3) 30px, rgba(255,255,255,.3) 31px)' }} />
        <div className="relative">
          <p className="text-white/70 text-sm font-medium mb-1">Welcome back,</p>
          <h1 className="font-display text-4xl font-black uppercase">{profile?.name || 'Student'}</h1>
          <p className="text-white/60 text-sm mt-1">{profile?.student_number || profile?.email}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders', value: orders.length, icon: ClipboardList, color: 'text-gray-700', bg: 'bg-white' },
          { label: 'Pending', value: grouped.pending || 0, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'Claiming', value: grouped.claiming || 0, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Completed', value: grouped.completed || 0, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`${bg} rounded-2xl p-5 border border-gray-100`}>
            <Icon className={`w-6 h-6 ${color} mb-3`} />
            <div className={`font-display text-3xl font-black ${color}`}>{value}</div>
            <div className="text-sm text-gray-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Recent orders */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
            <h2 className="font-display text-xl font-bold text-gray-900">Recent Orders</h2>
            <Link href="/orders" className="text-sm text-primary font-medium flex items-center gap-1 hover:underline">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <ShoppingBag className="w-12 h-12 text-gray-200 mb-3" />
              <p className="text-gray-500 text-sm">No orders yet</p>
              <Link href="/shop" className="mt-3 text-primary text-sm font-semibold hover:underline">Browse shop →</Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {orders.map((order) => {
                const cfg = statusConfig[order.status] || statusConfig.pending
                const Icon = cfg.icon
                return (
                  <div key={order.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Package className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{(order.product as { name?: string })?.name || 'Product'}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{format(new Date(order.created_at), 'MMM d, yyyy')}</p>
                    </div>
                    <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border ${cfg.bg} ${cfg.color}`}>
                      <Icon className="w-3 h-3" />
                      {cfg.label}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Announcements */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-50">
            <Megaphone className="w-5 h-5 text-primary" />
            <h2 className="font-display text-xl font-bold text-gray-900">Announcements</h2>
          </div>
          {announcements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <Megaphone className="w-12 h-12 text-gray-200 mb-3" />
              <p className="text-gray-500 text-sm">No announcements yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {announcements.map((a) => (
                <div key={a.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <p className="text-sm font-semibold text-gray-900 line-clamp-1">{a.title}</p>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">{a.content}</p>
                  <p className="text-xs text-gray-300 mt-1.5">{format(new Date(a.created_at), 'MMM d')}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Link href="/shop" className="flex items-center gap-4 p-5 bg-primary text-white rounded-2xl hover:bg-primary-dark transition-all group">
          <ShoppingBag className="w-8 h-8" />
          <div>
            <p className="font-display text-lg font-bold">Browse Shop</p>
            <p className="text-white/70 text-sm">Order your fitness gear</p>
          </div>
          <ArrowRight className="w-5 h-5 ml-auto group-hover:translate-x-1 transition-transform" />
        </Link>
        <Link href="/orders" className="flex items-center gap-4 p-5 bg-navy text-white rounded-2xl hover:bg-navy-dark transition-all group">
          <ClipboardList className="w-8 h-8" />
          <div>
            <p className="font-display text-lg font-bold">My Orders</p>
            <p className="text-white/70 text-sm">Track order status</p>
          </div>
          <ArrowRight className="w-5 h-5 ml-auto group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  )
}
