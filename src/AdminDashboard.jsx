import { useEffect, useMemo, useState } from 'react'
import { supabase } from './lib/supabase'
import './admin.css'

const emptyForm = { name: '', description: '', photo: '', category: 'Batik Wanita', is_published: true }

function normalizeProduct(row) {
  return { ...row, image: row.photo, alt: row.description || row.name, colors: row.colors || ['Navy'], sizes: row.sizes || ['S', 'M', 'L', 'XL'], isNew: false, collection: 'Katalog toko', motif: row.motif || 'Batik', material: row.material || 'Kain batik' }
}

function friendlyError(error) {
  if (!error) return 'Terjadi kesalahan yang tidak diketahui.'
  if (error.code === '42501') return 'Anda tidak memiliki izin untuk menyimpan produk toko ini.'
  if (error.code === '23503') return 'Toko pengguna belum tersedia. Silakan keluar lalu masuk kembali.'
  return error.message || 'Produk belum dapat disimpan. Coba lagi.'
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
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!supabase) { setLoading(false); return undefined }
    let active = true
    supabase.auth.getSession().then(({ data }) => { if (active) { setSession(data.session); setLoading(false) } })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => { setSession(nextSession); setLoading(false) })
    return () => { active = false; listener.subscription.unsubscribe() }
  }, [])

  useEffect(() => {
    if (!session || !supabase) return undefined
    let active = true
    async function load() {
      setLoading(true); setMessage('')
      const storeResult = await supabase.from('stores').select('*').eq('owner_id', session.user.id).maybeSingle()
      let currentStore = storeResult.data
      if (storeResult.error) { if (active) { setMessage(friendlyError(storeResult.error)); setLoading(false) }; return }
      if (!currentStore) {
        const created = await supabase.from('stores').insert({ owner_id: session.user.id, name: 'Toko Batik Rina', whatsapp_number: '6285181686626' }).select().single()
        if (created.error) { if (active) { setMessage(friendlyError(created.error)); setLoading(false) }; return }
        currentStore = created.data
      }
      const products = await supabase.from('products').select('*').eq('store_id', currentStore.id).order('created_at', { ascending: false })
      if (active) { setStore(currentStore); setItems((products.data || []).map(normalizeProduct)); setMessage(products.error ? friendlyError(products.error) : ''); setLoading(false) }
    }
    load()
    return () => { active = false }
  }, [session])

  const visibleItems = useMemo(() => items.filter((item) => `${item.name} ${item.category}`.toLowerCase().includes(query.toLowerCase())), [items, query])

  async function authenticate(event) {
    event.preventDefault(); setMessage('')
    if (!supabase) return setMessage('Supabase belum terkonfigurasi.')
    const result = authMode === 'login' ? await supabase.auth.signInWithPassword({ email, password }) : await supabase.auth.signUp({ email, password })
    if (result.error) setMessage(friendlyError(result.error))
    else if (authMode === 'signup') setMessage('Akun dibuat. Periksa email jika konfirmasi diperlukan.')
  }

  async function saveStore(event) {
    event.preventDefault(); if (!store || !supabase) return
    const whatsapp_number = event.currentTarget.elements.whatsapp_number.value.replace(/\D/g, '')
    const result = await supabase.from('stores').update({ whatsapp_number }).eq('id', store.id).select().single()
    setMessage(result.error ? friendlyError(result.error) : 'Nomor WhatsApp toko tersimpan.')
    if (!result.error) setStore(result.data)
  }

  async function saveProduct(event) {
    event.preventDefault()
    setMessage('')
    if (!supabase) return setMessage('Supabase belum terkonfigurasi pada environment ini.')
    if (!session?.user?.id || !store?.id) return setMessage('Sesi toko belum siap. Muat ulang halaman lalu coba lagi.')
    if (!form.name.trim()) return setMessage('Nama produk wajib diisi.')
    setSaving(true)
    const payload = { name: form.name.trim(), description: form.description.trim(), photo: form.photo, category: form.category, is_published: form.is_published, store_id: store.id, price: 0, stock: 0 }
    const result = editingId
      ? await supabase.from('products').update(payload).eq('id', editingId).eq('store_id', store.id).select().single()
      : await supabase.from('products').insert(payload).select().single()
    setSaving(false)
    if (result.error) return setMessage(`Produk gagal disimpan: ${friendlyError(result.error)}`)
    const saved = normalizeProduct(result.data)
    setItems((current) => editingId ? current.map((item) => item.id === editingId ? saved : item) : [saved, ...current])
    setForm(emptyForm); setEditingId(null); setMessage('Produk berhasil disimpan dan tampil di daftar.')
  }

  async function removeProduct(id) {
    if (!supabase || !window.confirm('Hapus produk ini?')) return
    const result = await supabase.from('products').delete().eq('id', id).eq('store_id', store.id)
    if (result.error) setMessage(friendlyError(result.error)); else { setItems((current) => current.filter((item) => item.id !== id)); setMessage('Produk dihapus.') }
  }

  async function uploadPhoto(event) {
    const file = event.target.files?.[0]
    if (!file || !store || !supabase) return
    setMessage('Mengunggah foto…')
    const path = `${store.id}/${crypto.randomUUID()}-${file.name.replace(/[^a-z0-9.]/gi, '-')}`
    const uploaded = await supabase.storage.from('product-images').upload(path, file, { upsert: false })
    if (uploaded.error) return setMessage(`Foto gagal diunggah: ${friendlyError(uploaded.error)}`)
    const { data } = supabase.storage.from('product-images').getPublicUrl(path)
    setForm((current) => ({ ...current, photo: data.publicUrl })); setMessage('Foto siap digunakan.')
  }

  if (loading) return <div className="admin-page"><p>Memuat dashboard…</p></div>
  if (!session) return <main className="admin-page admin-auth"><div className="admin-card"><p className="admin-eyebrow">Batik Rina</p><h1>{authMode === 'login' ? 'Masuk ke dashboard' : 'Buat akun pemilik toko'}</h1><p className="admin-muted">Kelola produk toko Anda secara aman.</p><form onSubmit={authenticate}><label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label><label>Password<input type="password" minLength="6" value={password} onChange={(e) => setPassword(e.target.value)} required /></label><button className="admin-button" type="submit">{authMode === 'login' ? 'Masuk' : 'Daftar'}</button></form>{message && <p className="admin-message">{message}</p>}<button className="admin-link" type="button" onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}>{authMode === 'login' ? 'Belum punya akun? Daftar' : 'Sudah punya akun? Masuk'}</button></div></main>

  return <main className="admin-page"><header className="admin-header"><div><p className="admin-eyebrow">Dashboard produk</p><h1>{store?.name || 'Toko Anda'}</h1></div><button className="admin-link" type="button" onClick={() => supabase.auth.signOut()}>Keluar</button></header><section className="admin-layout"><div><form className="admin-card admin-store-form" onSubmit={saveStore}><h2>Pengaturan toko</h2><label>Nomor WhatsApp<input name="whatsapp_number" defaultValue={store?.whatsapp_number || ''} placeholder="628xxxxxxxxxx" inputMode="numeric" required /></label><button className="admin-button" type="submit">Simpan nomor</button></form><form className="admin-card" onSubmit={saveProduct}><h2>{editingId ? 'Edit produk' : 'Tambah produk'}</h2><label>Nama produk<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label><label>Kategori<select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}><option>Batik Wanita</option><option>Batik Modern</option><option>Batik Formal</option></select></label><label>Deskripsi<textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label><label>Foto produk<input type="file" accept="image/*" onChange={uploadPhoto} /></label>{form.photo && <img className="admin-preview" src={form.photo} alt="Pratinjau produk" />}<label className="admin-check"><input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} /> Tampilkan di katalog publik</label><div className="admin-actions"><button className="admin-button" type="submit" disabled={saving}>{saving ? 'Menyimpan…' : editingId ? 'Simpan perubahan' : 'Simpan produk'}</button>{editingId && <button className="admin-link" type="button" onClick={() => { setEditingId(null); setForm(emptyForm); setMessage('') }}>Batal</button>}</div></form>{message && <p className="admin-message">{message}</p>}</div><section className="admin-card"><div className="admin-list-heading"><div><p className="admin-eyebrow">Katalog</p><h2>Produk toko</h2></div><input placeholder="Cari produk" value={query} onChange={(e) => setQuery(e.target.value)} /></div>{visibleItems.length === 0 ? <p className="admin-muted">Belum ada produk tersimpan.</p> : <div className="admin-products">{visibleItems.map((item) => <article className="admin-product" key={item.id}>{item.photo ? <img src={item.photo} alt={item.name} /> : <div className="admin-product-placeholder">BR</div>}<div><h3>{item.name}</h3><p>{item.category}</p><span>{item.is_published ? 'Tampil publik' : 'Draft'}</span></div><div className="admin-product-actions"><button className="admin-link" type="button" onClick={() => { setEditingId(item.id); setForm({ name: item.name || '', description: item.description || '', photo: item.photo || '', category: item.category || 'Batik Wanita', is_published: item.is_published }) }}>Edit</button><button className="admin-link danger" type="button" onClick={() => removeProduct(item.id)}>Hapus</button></div></article>)}</div>}</section></section></main>
}
