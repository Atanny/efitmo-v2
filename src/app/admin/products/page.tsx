'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Product } from '@/types/database'
import { Plus, Pencil, Archive, RotateCcw, Trash2, Package, X, Image as ImageIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showArchived, setShowArchived] = useState(false)
  const [modal, setModal] = useState<{ open: boolean; product?: Product }>({ open: false })
  const [form, setForm] = useState({ name: '', type: '', quantity: 0 })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  const fetchProducts = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('products')
      .select('*, sizes(*)')
      .eq('is_archived', showArchived)
      .order('created_at', { ascending: false })
    setProducts(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchProducts() }, [showArchived])

  const openCreate = () => {
    setForm({ name: '', type: '', quantity: 0 })
    setImageFile(null)
    setModal({ open: true })
  }

  const openEdit = (p: Product) => {
    setForm({ name: p.name, type: p.type || '', quantity: p.quantity })
    setModal({ open: true, product: p })
  }

  const handleSave = async () => {
    if (!form.name) return toast.error('Name is required')
    setSaving(true)
    const supabase = createClient()
    let image_url: string | undefined

    if (imageFile) {
      const ext = imageFile.name.split('.').pop()
      const filename = `${Date.now()}.${ext}`
      const { data: upload } = await supabase.storage.from('products').upload(filename, imageFile)
      if (upload) {
        const { data: url } = supabase.storage.from('products').getPublicUrl(filename)
        image_url = url.publicUrl
      }
    }

    if (modal.product) {
      await supabase.from('products').update({
        name: form.name,
        type: form.type || null,
        quantity: form.quantity,
        ...(image_url ? { image_url } : {}),
      }).eq('id', modal.product.id)
      toast.success('Product updated!')
    } else {
      await supabase.from('products').insert({
        name: form.name,
        type: form.type || null,
        quantity: form.quantity,
        image_url: image_url || null,
      })
      toast.success('Product created!')
    }

    setSaving(false)
    setModal({ open: false })
    fetchProducts()
  }

  const toggleArchive = async (p: Product) => {
    const supabase = createClient()
    await supabase.from('products').update({
      is_archived: !p.is_archived,
      archived_at: !p.is_archived ? new Date().toISOString() : null,
    }).eq('id', p.id)
    toast.success(p.is_archived ? 'Product restored!' : 'Product archived!')
    fetchProducts()
  }

  const deleteProduct = async (id: number) => {
    if (!confirm('Permanently delete this product?')) return
    const supabase = createClient()
    await supabase.from('products').delete().eq('id', id)
    toast.success('Product deleted')
    fetchProducts()
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl font-black text-gray-900 uppercase">Products</h1>
          <p className="text-gray-500 mt-1">{products.length} {showArchived ? 'archived' : 'active'} products</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowArchived(!showArchived)}
            className={clsx('px-4 py-2 rounded-xl border text-sm font-medium transition-all',
              showArchived ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400')}>
            {showArchived ? 'View Active' : 'View Archived'}
          </button>
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-all">
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
              <div className="bg-gray-200 h-36 rounded-xl mb-4" />
              <div className="bg-gray-200 h-4 rounded mb-2" />
              <div className="bg-gray-200 h-4 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center py-20 text-center">
          <Package className="w-14 h-14 text-gray-200 mb-3" />
          <p className="text-gray-500">No {showArchived ? 'archived' : 'active'} products</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p) => (
            <div key={p.id} className={clsx('bg-white rounded-2xl border overflow-hidden hover:shadow-sm transition-shadow',
              p.is_archived ? 'border-gray-100 opacity-70' : 'border-gray-100')}>
              <div className="h-40 bg-gray-50 flex items-center justify-center relative">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-14 h-14 text-gray-200" />
                )}
              </div>
              <div className="p-4">
                {p.type && <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{p.type}</span>}
                <h3 className="font-display text-lg font-bold text-gray-900 mt-2">{p.name}</h3>
                <p className="text-sm text-gray-400">Stock: {p.quantity}</p>
                {p.sizes && p.sizes.length > 0 && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {p.sizes.map((s) => (
                      <span key={s.id} className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">{s.size}</span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 mt-4">
                  <button onClick={() => openEdit(p)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all">
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button onClick={() => toggleArchive(p)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all">
                    {p.is_archived ? <RotateCcw className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
                  </button>
                  {p.is_archived && (
                    <button onClick={() => deleteProduct(p.id)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-2xl font-bold">{modal.product ? 'Edit Product' : 'Add Product'}</h2>
              <button onClick={() => setModal({ open: false })} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Product Name *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="PE Uniform Set"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
                <input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                  placeholder="Uniform, Top, Bottom..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Stock Quantity</label>
                <input type="number" min={0} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Product Image</label>
                <label className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-gray-300 hover:border-primary cursor-pointer transition-colors">
                  <ImageIcon className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-500">{imageFile ? imageFile.name : 'Choose image...'}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setModal({ open: false })}
                className="flex-1 py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark disabled:opacity-60">
                {saving ? 'Saving...' : 'Save Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
