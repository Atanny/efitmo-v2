'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Billing, BillingStatus } from '@/types/database'
import { Search, CheckCircle, Clock, AlertCircle, DollarSign } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import clsx from 'clsx'

type BillingWithRelations = Billing & {
  product: { name: string } | null
  user: { name: string; student_number: string | null } | null
  size: { size: string } | null
}

const billingStatusStyle: Record<string, { cls: string; icon: React.ElementType }> = {
  'Paid':     { cls: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle },
  'Not Paid': { cls: 'bg-red-50 text-red-700 border-red-200', icon: AlertCircle },
  'Due date': { cls: 'bg-orange-50 text-orange-700 border-orange-200', icon: Clock },
}

export default function AdminBillingsPage() {
  const [billings, setBillings] = useState<BillingWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<BillingStatus | 'all'>('all')
  const [selected, setSelected] = useState<number[]>([])
  const [remarkModal, setRemarkModal] = useState<{ billing: BillingWithRelations | null; text: string }>({ billing: null, text: '' })

  const fetchBillings = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('billings')
      .select('*, product:products(name), user:profiles(name,student_number), size:sizes(size)')
      .order('created_at', { ascending: false })
    setBillings((data || []) as BillingWithRelations[])
    setLoading(false)
  }

  useEffect(() => { fetchBillings() }, [])

  const markPaid = async (id: number) => {
    const supabase = createClient()
    await supabase.from('billings').update({ status: 'Paid' }).eq('id', id)
    setBillings(billings.map((b) => b.id === id ? { ...b, status: 'Paid' } : b))
    toast.success('Billing marked as Paid')
  }

  const markSelectedPaid = async () => {
    if (selected.length === 0) return
    const supabase = createClient()
    await supabase.from('billings').update({ status: 'Paid' }).in('id', selected)
    setBillings(billings.map((b) => selected.includes(b.id) ? { ...b, status: 'Paid' } : b))
    toast.success(`${selected.length} billings marked as Paid`)
    setSelected([])
  }

  const saveRemark = async () => {
    if (!remarkModal.billing) return
    const supabase = createClient()
    await supabase.from('billings').update({ remark: remarkModal.text }).eq('id', remarkModal.billing.id)
    setBillings(billings.map((b) => b.id === remarkModal.billing!.id ? { ...b, remark: remarkModal.text } : b))
    toast.success('Remark saved')
    setRemarkModal({ billing: null, text: '' })
  }

  const filtered = billings.filter((b) => {
    const matchStatus = filterStatus === 'all' || b.status === filterStatus
    const q = search.toLowerCase()
    const matchSearch = !q ||
      b.product?.name.toLowerCase().includes(q) ||
      b.user?.name.toLowerCase().includes(q) ||
      b.user?.student_number?.toLowerCase().includes(q) ||
      b.reference_key?.toLowerCase().includes(q)
    return matchStatus && matchSearch
  })

  const totalRevenue = billings.filter((b) => b.status === 'Paid').reduce((s, b) => s + (b.amount || 0), 0)
  const totalUnpaid = billings.filter((b) => b.status === 'Not Paid').reduce((s, b) => s + (b.amount || 0), 0)

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <h1 className="font-display text-4xl font-black text-gray-900 uppercase">Billings</h1>

      {/* Summary cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Revenue', value: `₱${totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Unpaid Amount', value: `₱${totalUnpaid.toLocaleString()}`, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Paid Billings', value: billings.filter((b) => b.status === 'Paid').length, icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`${bg} rounded-2xl p-5 border border-gray-100 flex items-center gap-4`}>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bg}`}>
              <Icon className={`w-6 h-6 ${color}`} />
            </div>
            <div>
              <p className="text-sm text-gray-500">{label}</p>
              <p className={`font-display text-2xl font-black ${color}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..."
            className="pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm w-56" />
        </div>
        {(['all', 'Not Paid', 'Paid', 'Due date'] as const).map((s) => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={clsx('px-3 py-2 rounded-xl text-sm font-medium border transition-all',
              filterStatus === s ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400')}>
            {s}
          </button>
        ))}
        {selected.length > 0 && (
          <button onClick={markSelectedPaid}
            className="ml-auto flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700">
            <CheckCircle className="w-4 h-4" />
            Mark {selected.length} as Paid
          </button>
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
                    onChange={() => setSelected(selected.length === filtered.length ? [] : filtered.map((b) => b.id))}
                    className="rounded accent-primary" />
                </th>
                {['Student', 'Product', 'Amount', 'Status', 'Reference', 'Date', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>{[...Array(8)].map((_, j) => <td key={j} className="px-4 py-4"><div className="bg-gray-200 h-4 rounded animate-pulse" /></td>)}</tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-16 text-center text-gray-400">No billings found</td></tr>
              ) : filtered.map((b) => {
                const { cls, icon: Icon } = billingStatusStyle[b.status] || billingStatusStyle['Not Paid']
                return (
                  <tr key={b.id} className={clsx('hover:bg-gray-50 transition-colors', selected.includes(b.id) && 'bg-primary/5')}>
                    <td className="px-4 py-4">
                      <input type="checkbox" checked={selected.includes(b.id)}
                        onChange={() => setSelected((p) => p.includes(b.id) ? p.filter((x) => x !== b.id) : [...p, b.id])}
                        className="rounded accent-primary" />
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-gray-900">{b.user?.name || '—'}</p>
                      <p className="text-xs text-gray-400">{b.user?.student_number || '—'}</p>
                    </td>
                    <td className="px-4 py-4 text-gray-700">{b.product?.name || '—'}</td>
                    <td className="px-4 py-4 font-semibold text-gray-900">₱{(b.amount || 0).toLocaleString()}</td>
                    <td className="px-4 py-4">
                      <span className={`flex items-center gap-1 w-fit text-xs font-semibold px-2.5 py-1 rounded-full border ${cls}`}>
                        <Icon className="w-3 h-3" /> {b.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-gray-400 text-xs font-mono">{b.reference_key || '—'}</td>
                    <td className="px-4 py-4 text-gray-400 text-xs">{format(new Date(b.created_at), 'MMM d, yy')}</td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        {b.status !== 'Paid' && (
                          <button onClick={() => markPaid(b.id)}
                            className="text-xs px-3 py-1.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors">
                            Mark Paid
                          </button>
                        )}
                        <button onClick={() => setRemarkModal({ billing: b, text: b.remark || '' })}
                          className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors">
                          Remark
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Remark modal */}
      {remarkModal.billing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 animate-fade-in">
            <h2 className="font-display text-2xl font-bold mb-4">Add Remark</h2>
            <textarea value={remarkModal.text} onChange={(e) => setRemarkModal({ ...remarkModal, text: e.target.value })}
              rows={4} placeholder="Add a note for the student..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm resize-none" />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setRemarkModal({ billing: null, text: '' })}
                className="flex-1 py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50">Cancel</button>
              <button onClick={saveRemark}
                className="flex-1 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
