import { useEffect, useMemo, useState } from 'react'
import { supabase } from './lib/supabase'
import { products as legacyProducts } from './data/products'
import './admin.css'

const emptyForm = { name: '', price: '', description: '', photo: '', category: 'Batik Wanita', stock: 0, is_published: true }

function normalizeProduct(row) {
  return { ...row, id: row.id, image: row.photo, alt: row.description || row.name, colors: row.colors || ['Navy'], sizes: row.sizes || ['S', 'M', 'L', 'XL'], isNew: false, collection: 'Katalog toko', motif: row.motif || 'Batik', material: row.material || 'Kain batik' }
}

export default function AdminDashboard() {
  const [session, setSession] = useState(null)
  const [store, setStore] = useState(null)
  const [items, setItems] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [query, setQuery] = useState('')
  const [authMode, setAuthMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) { setLoading(false); return undefined }
  const sessionRequest = supabase.auth.getSession()
  const timeout = new Promise((resolve) => setTimeout(() => resolve({ data: { session: null } }), 5000))
  Promise.race([sessionRequest, timeout]).then(({ data }) => { setSession(data.session); setLoading(false) })
  const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => { setSession(nextSession); setLoading(false) })
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session || !supabase) return
    let active = true
    async function load() {
      setLoading(true)
      let { data: currentStore } = await supabase.from('stores').select('*').eq('owner_id', session.user.id).maybeSingle()
      if (!currentStore) {
        const result = await supabase.from('stores').insert({ owner_id: session.user.id, name: 'Toko Batik Rina', whatsapp_number: '6285181686626' }).select().single()
        currentStore = result.data
      }
      const result = currentStore ? await supabase.from('products').select('*').eq('store_id', currentStore.id).order('created_at', { ascending: false }) : { data: [], error: null }
      if (active) { setStore(currentStore); setItems((result.data || []).map(normalizeProduct)); setLoading(false) }
    }
    load()
    return () => { active = false }
  }, [session])

  const visibleItems = useMemo(() => items.filter((item) => `${item.name} ${item.category}`.toLowerCase().includes(query.toLowerCase())), [items, query])

  async function authenticate(event) {
    event.preventDefault(); setMessage('')
    if (!supabase) return setMessage('Supabase belum terkonfigurasi pada environment preview.')
    const result = authMode === 'login' ? await supabase.auth.signInWithPassword({ email, password }) : await supabase.auth.signUp({ email, password })
    if (result.error) setMessage(result.error.message)
    else if (authMode === 'signup') setMessage('Akun dibuat. Periksa email jika konfirmasi diperlukan.')
  }

  async function saveStore(event) {
    event.preventDefault(); if (!store || !supabase) return
    const whatsapp_number = event.currentTarget.elements.whatsapp_number.value.replace(/\\D/g, '')
    const result = await supabase.from('stores').update({ whatsapp_number }).eq('id', store.id).select().single()
    if (result.error) setMessage(result.error.message); else { setStore(result.data); setMessage('Nomor WhatsApp toko tersimpan.') }
  }

  async function saveProduct(event) {
    event.preventDefault(); if (!store || !supabase) return
    setMessage('')
    const payload = { ...form, price: Number(form.price) || 0, stock: Number(form.stock) || 0, store_id: store.id }
    const result = editingId ? await supabase.from('products').update(payload).eq('id', editingId).select().single() : await supabase.from('products').insert(payload).select().single()
    if (result.error) return setMessage(result.error.message)
    setItems((current) => editingId ? current.map((item) => item.id === editingId ? normalizeProduct(result.data) : item) : [normalizeProduct(result.data), ...current])
    setForm(emptyForm); setEditingId(null); setMessage('Produk tersimpan.')
  }

  async function removeProduct(id) {
    if (!supabase || !window.confirm('Hapus produk ini?')) return
    const result = await supabase.from('products').delete().eq('id', id)
    if (result.error) setMessage(result.error.message); else setItems((current) => current.filter((item) => item.id !== id))
  }

  async function uploadPhoto(event) {
    const file = event.target.files?.[0]; if (!file || !store || !supabase) return
    const path = `${store.id}/${crypto.randomUUID()}-${file.name.replace(/[^a-z0-9.]/gi, '-')}`
    const uploaded = await supabase.storage.from('product-images').upload(path, file, { upsert: false })
    if (uploaded.error) return setMessage(uploaded.error.message)
    const { data } = supabase.storage.from('product-images').getPublicUrl(path)
    setForm((current) => ({ ...current, photo: data.publicUrl })); setMessage('Foto siap digunakan.')
  }

  if (loading) return <div className="admin-page"><p>Memuat dashboard…</p></div>
  if (!session) return <main className="admin-page admin-auth"><div className="admin-card"><p className="admin-eyebrow">Batik Rina</p><h1>{authMode === 'login' ? 'Masuk ke dashboard' : 'Buat akun pemilik toko'}</h1><p className="admin-muted">Kelola produk toko Anda secara aman.</p><form onSubmit={authenticate}><label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label><label>Password<input type="password" minLength="6" value={password} onChange={(e) => setPassword(e.target.value)} required /></label><button className="admin-button" type="submit">{authMode === 'login' ? 'Masuk' : 'Daftar'}</button></form>{message && <p className="admin-message">{message}</p>}<button className="admin-link" type="button" onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}>{authMode === 'login' ? 'Belum punya akun? Daftar' : 'Sudah punya akun? Masuk'}</button></div></main>

  return <main className="admin-page"><header className="admin-header"><div><p className="admin-eyebrow">Dashboard produk</p><h1>{store?.name || 'Toko Anda'}</h1></div><button className="admin-link" type="button" onClick={() => supabase.auth.signOut()}>Keluar</button></header><section className="admin-layout"><div><form className="admin-card admin-store-form" onSubmit={saveStore}><h2>Pengaturan toko</h2><label>Nomor WhatsApp<input name="whatsapp_number" defaultValue={store?.whatsapp_number || ''} placeholder="628xxxxxxxxxx" inputMode="numeric" required /></label><button className="admin-button" type="submit">Simpan nomor</button></form><form className="admin-card" onSubmit={saveProduct}><h2>{editingId ? 'Edit produk' : 'Tambah produk'}</h2><label>Nama produk<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label><div className="admin-row"><label>Harga<input type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></label><label>Stok<input type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></label></div><label>Kategori<select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}><option>Batik Wanita</option><option>Batik Modern</option><option>Batik Formal</option></select></label><label>Deskripsi<textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label><label>Foto produk<input type="file" accept="image/*" onChange={uploadPhoto} /></label>{form.photo && <img className="admin-preview" src={form.photo} alt="Pratinjau produk" />}<label className="admin-check"><input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} /> Tampilkan di katalog publik</label><div className="admin-actions"><button className="admin-button" type="submit">Simpan produk</button>{editingId && <button className="admin-link" type="button" onClick={() => { setEditingId(null); setForm(emptyForm) }}>Batal</button>}</div>{message && <p className="admin-message">{message}</p>}</form></div><section className="admin-card"><div className="admin-list-heading"><div><h2>Produk toko</h2><p className="admin-muted">{items.length} produk tersimpan</p></div><input className="admin-search" type="search" placeholder="Cari produk" value={query} onChange={(e) => setQuery(e.target.value)} /></div><div className="admin-products">{visibleItems.map((item) => <article className="admin-product" key={item.id}><img src={item.image || legacyProducts[0].image} alt={item.alt} /><div><strong>{item.name}</strong><span>{item.category} · Stok {item.stock}</span><small>{item.is_published ? 'Publik' : 'Draft'}</small></div><div className="admin-product-actions"><button className="admin-link" type="button" onClick={() => { setEditingId(item.id); setForm({ name: item.name, price: item.price, description: item.description, photo: item.image, category: item.category, stock: item.stock, is_published: item.is_published }) }}>Edit</button><button className="admin-link danger" type="button" onClick={() => removeProduct(item.id)}>Hapus</button></div></article>)}</div></section></section></main>
}
