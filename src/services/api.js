import { supabase } from '../lib/supabase'

function normalizeProduct(product) {
  return {
    ...product,
    name: product.nama,
    description: product.deskripsi ?? '',
    price: product.harga ?? 0,
    stock: product.stok ?? 0,
    category: product.kategori ?? 'Lainnya',
    image: product.gambar_url ?? '',
    alt: product.deskripsi || product.nama,
    isNew: Boolean(product.created_at && Date.now() - new Date(product.created_at).getTime() < 30 * 24 * 60 * 60 * 1000),
    colors: [], sizes: [], collection: '', motif: '', slug: product.slug,
  }
}

export async function getProducts() {
  if (!supabase) throw new Error('Supabase belum terkonfigurasi.')
  const { data, error } = await supabase.from('products').select('id,nama,slug,deskripsi,harga,stok,kategori,gambar_url,aktif,created_at').eq('aktif', true).order('created_at', { ascending: false }).limit(100)
  // Supabase client requests are intentionally uncached; every catalog visit reads current products.
  if (error) { console.error('[v0] Gagal memuat produk publik:', error); throw new Error('Katalog produk belum dapat dimuat. Silakan coba lagi.') }
  return (data || []).map(normalizeProduct)
}

export async function loginAdmin() { throw new Error('Login admin menggunakan Supabase Auth di halaman /admin.') }
export async function createProduct() { throw new Error('Gunakan dashboard Supabase admin.') }
export async function updateProduct() { throw new Error('Gunakan dashboard Supabase admin.') }
export async function deleteProduct() { throw new Error('Gunakan dashboard Supabase admin.') }
