'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Profile } from '@/types/database'
import { Search, Plus, Trash2, Users, Shield, User } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import clsx from 'clsx'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [filterRole, setFilterRole] = useState<'all' | 'student' | 'admin'>('all')
  const [editModal, setEditModal] = useState<{ open: boolean; user?: Profile }>({ open: false })
  const [editForm, setEditForm] = useState({ name: '', student_number: '', role: 'student' })

  const fetchUsers = async () => {
    const supabase = createClient()
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    setUsers(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [])

  const deleteUser = async (id: string) => {
    if (!confirm('Delete this user?')) return
    const supabase = createClient()
    await supabase.from('profiles').delete().eq('id', id)
    setUsers(users.filter((u) => u.id !== id))
    toast.success('User deleted')
  }

  const bulkDelete = async () => {
    if (!confirm(`Delete ${selected.length} users?`)) return
    const supabase = createClient()
    await supabase.from('profiles').delete().in('id', selected)
    setUsers(users.filter((u) => !selected.includes(u.id)))
    setSelected([])
    toast.success(`${selected.length} users deleted`)
  }

  const openEdit = (user: Profile) => {
    setEditForm({ name: user.name, student_number: user.student_number || '', role: user.role })
    setEditModal({ open: true, user })
  }

  const saveEdit = async () => {
    if (!editModal.user) return
    const supabase = createClient()
    await supabase.from('profiles').update({
      name: editForm.name,
      student_number: editForm.student_number || null,
      role: editForm.role as Profile['role'],
    }).eq('id', editModal.user.id)
    setUsers(users.map((u) => u.id === editModal.user!.id ? { ...u, ...editForm } as Profile : u))
    toast.success('User updated')
    setEditModal({ open: false })
  }

  const filtered = users.filter((u) => {
    const matchRole = filterRole === 'all' || u.role === filterRole
    const q = search.toLowerCase()
    const matchSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.student_number || '').toLowerCase().includes(q)
    return matchRole && matchSearch
  })

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl font-black text-gray-900 uppercase">Users</h1>
          <p className="text-gray-500 mt-1">{users.length} total users</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Students', value: users.filter((u) => u.role === 'student').length, icon: User, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Total Admins', value: users.filter((u) => u.role !== 'student').length, icon: Shield, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Total Users', value: users.length, icon: Users, color: 'text-gray-600', bg: 'bg-gray-100' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`${bg} rounded-2xl p-5 border border-gray-100 flex items-center gap-4`}>
            <Icon className={`w-8 h-8 ${color}`} />
            <div>
              <p className="text-sm text-gray-500">{label}</p>
              <p className={`font-display text-3xl font-black ${color}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..."
            className="pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm w-56" />
        </div>
        {(['all', 'student', 'admin'] as const).map((r) => (
          <button key={r} onClick={() => setFilterRole(r)}
            className={clsx('px-3 py-2 rounded-xl text-sm font-medium border capitalize transition-all',
              filterRole === r ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400')}>
            {r}
          </button>
        ))}
        {selected.length > 0 && (
          <button onClick={bulkDelete}
            className="ml-auto flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700">
            <Trash2 className="w-4 h-4" />
            Delete {selected.length}
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
                    onChange={() => setSelected(selected.length === filtered.length ? [] : filtered.map((u) => u.id))}
                    className="rounded accent-primary" />
                </th>
                {['Name', 'Student No.', 'Email', 'Role', 'Joined', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [...Array(5)].map((_, i) => <tr key={i}>{[...Array(7)].map((_, j) => <td key={j} className="px-4 py-4"><div className="bg-gray-200 h-4 rounded animate-pulse" /></td>)}</tr>)
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">No users found</td></tr>
              ) : filtered.map((user) => (
                <tr key={user.id} className={clsx('hover:bg-gray-50 transition-colors', selected.includes(user.id) && 'bg-primary/5')}>
                  <td className="px-4 py-4">
                    <input type="checkbox" checked={selected.includes(user.id)}
                      onChange={() => setSelected((p) => p.includes(user.id) ? p.filter((x) => x !== user.id) : [...p, user.id])}
                      className="rounded accent-primary" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-gray-500 font-mono text-xs">{user.student_number || '—'}</td>
                  <td className="px-4 py-4 text-gray-500">{user.email}</td>
                  <td className="px-4 py-4">
                    <span className={clsx('text-xs font-semibold px-2.5 py-1 rounded-full capitalize',
                      user.role === 'student' ? 'bg-blue-50 text-blue-700' :
                      user.role === 'admin' ? 'bg-purple-50 text-purple-700' : 'bg-red-50 text-red-700')}>
                      {user.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-gray-400 text-xs">{format(new Date(user.created_at), 'MMM d, yyyy')}</td>
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(user)}
                        className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200">Edit</button>
                      <button onClick={() => deleteUser(user.id)}
                        className="text-xs px-2 py-1.5 text-red-400 hover:text-red-600 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit modal */}
      {editModal.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 animate-fade-in">
            <h2 className="font-display text-2xl font-bold mb-5">Edit User</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Student Number</label>
                <input value={editForm.student_number} onChange={(e) => setEditForm({ ...editForm, student_number: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
                <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm">
                  <option value="student">Student</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setEditModal({ open: false })}
                className="flex-1 py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50">Cancel</button>
              <button onClick={saveEdit}
                className="flex-1 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
