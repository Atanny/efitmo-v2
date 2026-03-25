'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Cart } from '@/types/database'
import { ShoppingCart, Trash2, Package, ArrowRight, Minus, Plus } from 'lucide-react'
import toast from 'react-hot-toast'

export default function CartPage() {
  const [items, setItems] = useState<Cart[]>([])
  const [loading, setLoading] = useState(true)
  const [checkingOut, setCheckingOut] = useState(false)

  const fetchCart = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('carts')
      .select('*, product:products(*), size:sizes(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setItems(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchCart() }, [])

  const updateQuantity = async (id: number, qty: number) => {
    if (qty < 1) return
    const supabase = createClient()
    await supabase.from('carts').update({ quantity: qty }).eq('id', id)
    setItems(items.map((i) => (i.id === id ? { ...i, quantity: qty } : i)))
  }

  const removeItem = async (id: number) => {
    const supabase = createClient()
    await supabase.from('carts').delete().eq('id', id)
    setItems(items.filter((i) => i.id !== id))
    toast.success('Item removed from cart')
  }

  const handleCheckout = async () => {
    if (items.length === 0) return
    setCheckingOut(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase.from('profiles').select('student_number').eq('id', user.id).single()

    // Create pre-orders for each cart item
    const preOrders = items.map((item) => ({
      user_id: user.id,
      student_number: profile?.student_number || null,
      product_id: item.product_id,
      size_id: item.size_id || null,
      quantity: item.quantity,
      status: 'pending' as const,
    }))

    const { error } = await supabase.from('pre_orders').insert(preOrders)
    if (error) {
      toast.error('Failed to place order. Try again.')
      setCheckingOut(false)
      return
    }

    // Clear cart
    await supabase.from('carts').delete().eq('user_id', user.id)
    setItems([])
    toast.success('Order placed successfully!')
    setCheckingOut(false)
  }

  const total = items.reduce((sum, item) => {
    const price = (item.size as { price?: number })?.price || 0
    return sum + price * item.quantity
  }, 0)

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-4xl font-black text-gray-900 uppercase">Cart</h1>
        <p className="text-gray-500 mt-1">{items.length} {items.length === 1 ? 'item' : 'items'}</p>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center py-24 text-center">
          <ShoppingCart className="w-16 h-16 text-gray-200 mb-4" />
          <h2 className="font-display text-2xl font-bold text-gray-400">Your cart is empty</h2>
          <p className="text-gray-400 text-sm mt-1 mb-6">Add items from the shop to get started</p>
          <Link href="/shop" className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-all">
            Browse Shop <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Items */}
          <div className="lg:col-span-2 space-y-3">
            {items.map((item) => {
              const product = item.product as { name?: string; image_url?: string }
              const size = item.size as { size?: string; price?: number }
              return (
                <div key={item.id} className="bg-white rounded-2xl border border-gray-100 p-5 flex gap-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Package className="w-8 h-8 text-gray-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">{product?.name}</p>
                    {size?.size && <p className="text-sm text-gray-400 mt-0.5">Size: {size.size}</p>}
                    {size?.price && <p className="text-sm font-semibold text-primary mt-1">₱{size.price.toFixed(2)}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <button onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Summary */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 h-fit sticky top-24">
            <h2 className="font-display text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
            <div className="space-y-3 mb-5">
              {items.map((item) => {
                const product = item.product as { name?: string }
                const size = item.size as { price?: number }
                return (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-500 truncate max-w-[160px]">
                      {product?.name} × {item.quantity}
                    </span>
                    <span className="font-medium text-gray-900">₱{((size?.price || 0) * item.quantity).toFixed(2)}</span>
                  </div>
                )
              })}
            </div>
            <div className="border-t border-gray-100 pt-4 mb-5 flex justify-between">
              <span className="font-bold text-gray-900">Total</span>
              <span className="font-black text-xl text-primary">₱{total.toFixed(2)}</span>
            </div>
            <button
              onClick={handleCheckout}
              disabled={checkingOut}
              className="w-full py-3.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {checkingOut ? 'Placing order...' : <>Place Pre-Order <ArrowRight className="w-4 h-4" /></>}
            </button>
            <p className="text-xs text-gray-400 text-center mt-3">Orders are subject to admin approval</p>
          </div>
        </div>
      )}
    </div>
  )
}
