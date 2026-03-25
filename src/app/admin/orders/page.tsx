'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { PreOrder, OrderStatus } from '@/types/database'
import { Search, Filter, ChevronDown, Package } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import clsx from 'clsx'

const ALL_STATUSES: OrderStatus[] = ['pending', 'accepted', 'claiming', 'completed', 'cancelled', 'expired']

const statusStyle: Record<string, string> = {
  pending:   'bg-yellow-50 text-yellow-700 border-yellow-200',
  accepted:  'bg-green-50 text-green-700 border-green-200',
  claiming:  'bg-blue-50 text-blue-700 border-blue-200',
  completed: 'bg-gray-100 text-gray-600 border-gray-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
  expired:   'bg-orange-50 text-orange-700 border-orange-200',
}

type OrderWithRelations = PreOrder & {
  product: { name: string } | null
  size: { size: string; price: number } | null
  user: { name: string; email: string; student_number: string | null } | null
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all')
  const [selected, setSelected] = useState<number[]>([])
  const [updating, setUpdating] = useState<number | null>(null)

  const fetchOrders = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('pre_orders')
      .select('*, product:products(name), size:sizes(size,price), user:profiles(name,email,student_number)')
      .order('created_at', { ascending: false })
    setOrders((data || []) as OrderWithRelations[])
    setLoading(false)
  }

  useEffect(() => { fetchOrders() }, [])

  const updateStatus = async (id: number, status: OrderStatus) => {
    setUpdating(id)
    const supabase = createClient()
    await supabase.from('pre_orders').update({ status }).eq('id', id)
    setOrders(orders.map((o) => o.id === id ? { ...o, status } : o))
    toast.success(`Order ${status}`)
    setUpdating(null)
  }

  const bulkUpdate = async (status: OrderStatus) => {
    if (selected.length === 0) return
    const supabase = createClient()
    await supabase.from('pre_orders').update({ status }).in('id', selected)
    setOrders(orders.map((o) => selected.includes(o.id) ? { ...o, status } : o))
    toast.success(`${selected.length} orders updated to ${status}`)
    setSelected([])
  }

  const filtered = orders.filter((o) => {
    const matchStatus = filterStatus === 'all' || o.status === filterStatus
    const q = search.toLowerCase()
    const matchSearch = !q || 
      o.product?.name.toLowerCase().includes(q) ||
      o.user?.name.toLowerCase().includes(q) ||
      o.user?.student_number?.toLowerCase().includes(q)
    return matchStatus && matchSearch
  })

  const toggleSelect = (id: number) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])

  const toggleAll = () =>
    setSelected(selected.length === filtered.length ? [] : filtered.map((o) => o.id))

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <h1 className="font-display text-4xl font-black text-gray-900 uppercase">Orders</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student or product..."
            className="pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm w-64" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['all', ...ALL_STATUSES] as const).map((s) => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={clsx('px-3 py-2 rounded-xl text-sm font-medium border capitalize transition-all',
                filterStatus === s ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400')}>
              {s}
            </button>
          ))}
        </div>
        {selected.length > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-gray-500">{selected.length} selected</span>
            {['accepted', 'claiming', 'completed', 'cancelled'].map((s) => (
              <button key={s} onClick={() => bulkUpdate(s as OrderStatus)}
                className="px-3 py-2 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary-dark capitalize">
                Mark {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input type="checkbox" checked={selected.length === filtered.length && filtered.length > 0}
                    onChange={toggleAll} className="rounded accent-primary" />
                </th>
                {['Student', 'Product', 'Size', 'Qty', 'Status', 'Date', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(8)].map((_, j) => (
                      <td key={j} className="px-4 py-4"><div className="bg-gray-200 h-4 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <Package className="w-12 h-12 text-gray-200 mx-auto mb-2" />
                    <p className="text-gray-400">No orders found</p>
                  </td>
                </tr>
              ) : filtered.map((order) => (
                <tr key={order.id} className={clsx('hover:bg-gray-50 transition-colors', selected.includes(order.id) && 'bg-primary/5')}>
                  <td className="px-4 py-4">
                    <input type="checkbox" checked={selected.includes(order.id)}
                      onChange={() => toggleSelect(order.id)} className="rounded accent-primary" />
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-medium text-gray-900">{order.user?.name || '—'}</p>
                    <p className="text-xs text-gray-400">{order.user?.student_number || order.user?.email}</p>
                  </td>
                  <td className="px-4 py-4 text-gray-700">{order.product?.name || '—'}</td>
                  <td className="px-4 py-4 text-gray-500">{order.size?.size || '—'}</td>
                  <td className="px-4 py-4 text-gray-600">{order.quantity}</td>
                  <td className="px-4 py-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${statusStyle[order.status] || ''}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-gray-400 text-xs">{format(new Date(order.created_at), 'MMM d, yy')}</td>
                  <td className="px-4 py-4">
                    <div className="relative group">
                      <button className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium text-gray-700 transition-all">
                        Update <ChevronDown className="w-3 h-3" />
                      </button>
                      <div className="absolute right-0 top-full mt-1 bg-white rounded-xl border border-gray-100 shadow-lg z-10 hidden group-hover:block w-36">
                        {ALL_STATUSES.filter((s) => s !== order.status).map((s) => (
                          <button key={s} onClick={() => updateStatus(order.id, s)}
                            disabled={updating === order.id}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 capitalize first:rounded-t-xl last:rounded-b-xl transition-colors">
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
