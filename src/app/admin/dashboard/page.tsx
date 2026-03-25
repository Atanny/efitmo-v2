'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Users, Package, ClipboardList, CreditCard, TrendingUp, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { format } from 'date-fns'

interface Stats {
  totalUsers: number
  totalProducts: number
  totalOrders: number
  pendingOrders: number
  totalRevenue: number
  paidBillings: number
  unpaidBillings: number
  recentOrders: {
    name: string
    status: string
    created_at: string
    product: string
  }[]
  ordersByStatus: { name: string; value: number; color: string }[]
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const today = new Date()

  useEffect(() => {
    const supabase = createClient()
    async function load() {
      const [
        { count: users },
        { count: products },
        { data: orders },
        { data: billings },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_archived', false),
        supabase.from('pre_orders').select('id, status, created_at, product:products(name), user:profiles(name)').order('created_at', { ascending: false }).limit(20),
        supabase.from('billings').select('status, amount'),
      ])

      const statusCounts: Record<string, number> = {}
      const COLORS: Record<string, string> = {
        pending: '#f59e0b', accepted: '#10b981', claiming: '#3b82f6',
        completed: '#6b7280', cancelled: '#ef4444', expired: '#f97316',
      }
      ;(orders || []).forEach((o) => {
        statusCounts[o.status] = (statusCounts[o.status] || 0) + 1
      })

      const paidBillings = (billings || []).filter((b) => b.status === 'Paid')
      const totalRevenue = paidBillings.reduce((sum, b) => sum + (b.amount || 0), 0)

      setStats({
        totalUsers: users || 0,
        totalProducts: products || 0,
        totalOrders: orders?.length || 0,
        pendingOrders: statusCounts.pending || 0,
        totalRevenue,
        paidBillings: paidBillings.length,
        unpaidBillings: (billings || []).filter((b) => b.status === 'Not Paid').length,
        recentOrders: (orders || []).slice(0, 8).map((o) => ({
          name: (o.user as { name?: string })?.name || 'Student',
          status: o.status,
          created_at: o.created_at,
          product: (o.product as { name?: string })?.name || 'Product',
        })),
        ordersByStatus: Object.entries(statusCounts).map(([name, value]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value,
          color: COLORS[name] || '#6b7280',
        })),
      })
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const s = stats!

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Date banner */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-2xl p-6 text-white" style={{ background: 'linear-gradient(135deg, #8A1A24, #b02030)' }}>
          <p className="text-white/70 text-sm font-medium">Today</p>
          <p className="font-display text-3xl font-black mt-1">{format(today, 'MMMM d, yyyy')}</p>
          <p className="text-white/60 text-sm mt-0.5">{format(today, 'EEEE')}</p>
        </div>
        <div className="rounded-2xl p-6 text-white" style={{ background: 'linear-gradient(135deg, #194E90, #2261b0)' }}>
          <p className="text-white/70 text-sm font-medium">Total Revenue</p>
          <p className="font-display text-3xl font-black mt-1">₱{s.totalRevenue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
          <p className="text-white/60 text-sm mt-0.5">{s.paidBillings} paid billings</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Students', value: s.totalUsers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Products', value: s.totalProducts, icon: Package, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Pending Orders', value: s.pendingOrders, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'Unpaid Bills', value: s.unpaidBillings, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`${bg} rounded-2xl p-5 border border-gray-100`}>
            <Icon className={`w-6 h-6 ${color} mb-3`} />
            <div className={`font-display text-3xl font-black ${color}`}>{value}</div>
            <div className="text-sm text-gray-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Orders chart */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-display text-xl font-bold text-gray-900 mb-4">Orders by Status</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={s.ordersByStatus} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {s.ordersByStatus.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-display text-xl font-bold text-gray-900 mb-4">Distribution</h2>
          {s.ordersByStatus.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={s.ordersByStatus} dataKey="value" cx="50%" cy="50%" outerRadius={70} stroke="none">
                    {s.ordersByStatus.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-1.5">
                {s.ordersByStatus.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                      <span className="text-gray-600">{item.name}</span>
                    </div>
                    <span className="font-semibold text-gray-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-40 text-gray-300">No data</div>
          )}
        </div>
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50">
          <h2 className="font-display text-xl font-bold text-gray-900">Recent Orders</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Student', 'Product', 'Status', 'Date'].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {s.recentOrders.map((order, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{order.name}</td>
                  <td className="px-6 py-4 text-gray-500">{order.product}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize
                      ${order.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                        order.status === 'accepted' ? 'bg-green-50 text-green-700 border-green-200' :
                        order.status === 'completed' ? 'bg-gray-100 text-gray-600 border-gray-200' :
                        order.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                        'bg-blue-50 text-blue-700 border-blue-200'}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-xs">{format(new Date(order.created_at), 'MMM d, h:mm a')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
