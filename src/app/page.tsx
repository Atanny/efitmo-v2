import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-display font-bold text-lg">E</span>
          </div>
          <span className="font-display text-2xl font-bold tracking-wide text-gray-900">eFitmo</span>
        </div>
        <div className="flex gap-3">
          <Link href="/auth/login" className="px-5 py-2 text-sm font-medium text-gray-700 hover:text-primary transition-colors">
            Sign In
          </Link>
          <Link href="/auth/register" className="px-5 py-2 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">
            Register
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1">
        <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #8A1A24 0%, #6b141c 50%, #194E90 100%)' }}>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 40px, rgba(255,255,255,.3) 40px, rgba(255,255,255,.3) 41px)' }} />
          <div className="relative max-w-4xl mx-auto px-6 py-24 text-center text-white">
            <h1 className="font-display text-6xl md:text-8xl font-black tracking-tight mb-6 uppercase">
              Get Your<br />
              <span className="text-yellow-300">Fitness Gear</span>
            </h1>
            <p className="text-lg md:text-xl text-white/80 mb-10 max-w-xl mx-auto">
              Pre-order your PE uniforms and fitness equipment online. Fast, easy, and hassle-free.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register"
                className="px-8 py-4 bg-yellow-400 text-gray-900 font-bold rounded-xl text-lg hover:bg-yellow-300 transition-all transform hover:scale-105 shadow-lg">
                Start Ordering
              </Link>
              <Link href="/auth/login"
                className="px-8 py-4 bg-white/10 backdrop-blur border border-white/30 text-white font-semibold rounded-xl text-lg hover:bg-white/20 transition-all">
                Sign In
              </Link>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="max-w-5xl mx-auto px-6 py-20">
          <h2 className="font-display text-4xl font-bold text-center text-gray-900 mb-12 uppercase">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Browse Products', desc: 'Explore our catalog of PE uniforms and fitness gear with size options.' },
              { step: '02', title: 'Pre-Order', desc: 'Add items to cart and place your pre-order. We\'ll notify you when ready.' },
              { step: '03', title: 'Pay & Claim', desc: 'Complete your payment online or via GCash/Maya and claim your order.' },
            ].map((f) => (
              <div key={f.step} className="relative p-8 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="font-display text-6xl font-black text-primary/10 absolute top-4 right-6">{f.step}</div>
                <div className="font-display text-4xl font-black text-primary mb-3">{f.step}</div>
                <h3 className="font-display text-xl font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="bg-gray-900 text-white/50 text-center py-6 text-sm">
        © {new Date().getFullYear()} eFitmo. All rights reserved.
      </footer>
    </div>
  )
}
