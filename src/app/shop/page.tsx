'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Product, Size } from '@/types/database'
import { ShoppingCart, Package, Search, SlidersHorizontal } from 'lucide-react'
import toast from 'react-hot-toast'
import Image from 'next/image'

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedSize, setSelectedSize] = useState<Size | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [addingToCart, setAddingToCart] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('products')
      .select('*, sizes(*)')
      .eq('is_archived', false)
      .gt('quantity', 0)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setProducts(data || [])
        setLoading(false)
      })
  }, [])

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.type || '').toLowerCase().includes(search.toLowerCase())
  )

  const handleAddToCart = async () => {
    if (!selectedProduct) return
    if (selectedProduct.sizes && selectedProduct.sizes.length > 0 && !selectedSize) {
      toast.error('Please select a size')
      return
    }
    setAddingToCart(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Check if already in cart
    const { data: existing } = await supabase
      .from('carts')
      .select('*')
      .eq('user_id', user.id)
      .eq('product_id', selectedProduct.id)
      .eq('size_id', selectedSize?.id || null)
      .single()

    if (existing) {
      await supabase.from('carts').update({ quantity: existing.quantity + quantity }).eq('id', existing.id)
    } else {
      await supabase.from('carts').insert({
        user_id: user.id,
        product_id: selectedProduct.id,
        size_id: selectedSize?.id || null,
        quantity,
      })
    }

    toast.success(`${selectedProduct.name} added to cart!`)
    setSelectedProduct(null)
    setSelectedSize(null)
    setQuantity(1)
    setAddingToCart(false)
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-4xl font-black text-gray-900 uppercase">Shop</h1>
        <p className="text-gray-500 mt-1">Browse available fitness gear and uniforms</p>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
          />
        </div>
        <button className="px-4 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
          <SlidersHorizontal className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Products grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
              <div className="bg-gray-200 h-40 rounded-xl mb-4" />
              <div className="bg-gray-200 h-4 rounded mb-2 w-3/4" />
              <div className="bg-gray-200 h-4 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Package className="w-16 h-16 text-gray-200 mb-4" />
          <p className="text-gray-500">No products found</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((product) => {
            const sizes = product.sizes || []
            const minPrice = sizes.length > 0 ? Math.min(...sizes.map((s) => s.price)) : null
            return (
              <div key={product.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
                {/* Image */}
                <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
                  {product.image_url ? (
                    <Image src={product.image_url} alt={product.name} fill className="object-cover" />
                  ) : (
                    <Package className="w-16 h-16 text-gray-300" />
                  )}
                  {product.quantity <= 10 && (
                    <span className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      Low Stock
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="p-5">
                  {product.type && (
                    <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{product.type}</span>
                  )}
                  <h3 className="font-display text-lg font-bold text-gray-900 mt-2">{product.name}</h3>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm text-gray-400">
                      {minPrice ? `Starting at ₱${minPrice.toFixed(2)}` : `${product.quantity} in stock`}
                    </p>
                    <span className="text-xs text-gray-400">{sizes.length} sizes</span>
                  </div>
                  <button
                    onClick={() => { setSelectedProduct(product); setSelectedSize(null); setQuantity(1) }}
                    className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-all"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Add to Cart
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 animate-fade-in">
            <h2 className="font-display text-2xl font-bold text-gray-900 mb-1">{selectedProduct.name}</h2>
            {selectedProduct.type && <p className="text-sm text-gray-400 mb-4">{selectedProduct.type}</p>}

            {/* Sizes */}
            {selectedProduct.sizes && selectedProduct.sizes.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">Select Size</p>
                <div className="flex flex-wrap gap-2">
                  {selectedProduct.sizes.map((size) => (
                    <button key={size.id}
                      onClick={() => setSelectedSize(size)}
                      disabled={size.quantity === 0}
                      className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                        selectedSize?.id === size.id
                          ? 'bg-primary text-white border-primary'
                          : size.quantity === 0
                          ? 'bg-gray-100 text-gray-300 border-gray-100 cursor-not-allowed'
                          : 'border-gray-200 text-gray-700 hover:border-primary hover:text-primary'
                      }`}>
                      {size.size}
                      {size.price > 0 && <span className="ml-1 text-xs opacity-70">₱{size.price}</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-6">
              <p className="text-sm font-semibold text-gray-700 mb-2">Quantity</p>
              <div className="flex items-center gap-3">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-100 font-bold text-lg">−</button>
                <span className="text-lg font-bold w-8 text-center">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)}
                  className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-100 font-bold text-lg">+</button>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setSelectedProduct(null)}
                className="flex-1 py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all">
                Cancel
              </button>
              <button onClick={handleAddToCart} disabled={addingToCart}
                className="flex-1 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-all disabled:opacity-60">
                {addingToCart ? 'Adding...' : 'Add to Cart'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
