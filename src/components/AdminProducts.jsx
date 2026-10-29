import { useEffect, useState } from 'react'
import { ArrowLeft, Plus, Pencil, Trash2, X, RefreshCw } from 'lucide-react'
import { getProducts, createProduct, updateProduct, deleteProduct } from '../services/api'

const MAX_IMAGE_SIZE = 5 * 1024 * 1024

const emptyForm = {
  name: '',
  category: '',
  collection: '',
  alt: '',
  motif: '',
  colors: '',
  sizes: '',
  description: '',
  price: '',
  is_new: false,
}

function toForm(product) {
  return {
    name: product.name ?? '',
    category: product.category ?? '',
    collection: product.collection ?? '',
    alt: product.alt ?? '',
    motif: product.motif ?? '',
    colors: (product.colors ?? []).join(', '),
    sizes: (product.sizes ?? []).join(', '),
    description: product.description ?? '',
    price: product.price ?? '',
    is_new: Boolean(product.isNew ?? product.is_new),
  }
}

function splitList(value) {
  return value.split(',').map((v) => v.trim()).filter(Boolean)
}

// Dikirim sebagai FormData karena ada upload file.
function toFormData(form, imageFile, isEdit) {
  const data = new FormData()

  data.append('name', form.name.trim())
  data.append('category', form.category.trim())

  const optional = {
    collection: form.collection.trim(),
    alt: form.alt.trim(),
    motif: form.motif.trim(),
    description: form.description.trim(),
  }
  Object.entries(optional).forEach(([key, value]) => {
    if (value) data.append(key, value)
  })

  if (form.price !== '') data.append('price', String(form.price))

  splitList(form.colors).forEach((color) => data.append('colors[]', color))
  splitList(form.sizes).forEach((size) => data.append('sizes[]', size))

  data.append('is_new', form.is_new ? '1' : '0')

  if (imageFile) data.append('image', imageFile)

  // Laravel tidak membaca multipart pada request PUT,
  // jadi dikirim lewat POST dengan _method=PUT.
  if (isEdit) data.append('_method', 'PUT')

  return data
}

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  // State untuk upload gambar
  const [selectedImage, setSelectedImage] = useState(null)
  const [existingImage, setExistingImage] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [fileInputKey, setFileInputKey] = useState(0)

  async function loadProducts() {
    setLoading(true)
    setError('')

    try {
      setProducts(await getProducts())
    } catch (err) {
      setError(err.message || 'Gagal memuat produk.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  // Buat dan lepas URL preview dengan benar
  useEffect(() => {
    if (!selectedImage) {
      setPreviewUrl('')
      return undefined
    }

    const url = URL.createObjectURL(selectedImage)
    setPreviewUrl(url)

    return () => URL.revokeObjectURL(url)
  }, [selectedImage])

  function resetImage() {
    setSelectedImage(null)
    setExistingImage('')
    setFileInputKey((key) => key + 1)
  }

  function openCreateForm() {
    setEditingId(null)
    setForm(emptyForm)
    resetImage()
    setFormOpen(true)
    setError('')
    setNotice('')
  }

  function openEditForm(product) {
    setEditingId(product.id)
    setForm(toForm(product))
    setSelectedImage(null)
    setExistingImage(product.image ?? '')
    setFileInputKey((key) => key + 1)
    setFormOpen(true)
    setError('')
    setNotice('')
  }

  function closeForm() {
    setFormOpen(false)
    setEditingId(null)
    setForm(emptyForm)
    resetImage()
  }

  function changeField(event) {
    const { name, value, checked, type } = event.target
    setForm((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  function handleImageChange(event) {
    const file = event.target.files?.[0] || null

    if (file && file.size > MAX_IMAGE_SIZE) {
      setError('Ukuran gambar maksimal 5 MB.')
      setSelectedImage(null)
      setFileInputKey((key) => key + 1)
      return
    }

    setError('')
    setSelectedImage(file)
  }

  function cancelSelectedImage() {
    setSelectedImage(null)
    setFileInputKey((key) => key + 1)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')

    try {
      const isEdit = editingId !== null
      const payload = toFormData(form, selectedImage, isEdit)

      if (isEdit) {
        await updateProduct(editingId, payload)
        setNotice('Produk berhasil diperbarui.')
      } else {
        await createProduct(payload)
        setNotice('Produk berhasil ditambahkan.')
      }

      closeForm()
      await loadProducts()
    } catch (err) {
      setError(err.message || 'Gagal menyimpan produk.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(product) {
    const confirmed = window.confirm(
      `Hapus produk "${product.name}"? Tindakan ini tidak dapat dibatalkan.`
    )

    if (!confirmed) return

    setError('')
    setNotice('')

    try {
      await deleteProduct(product.id)
      setProducts((previous) =>
        previous.filter((item) => item.id !== product.id)
      )
      setNotice('Produk berhasil dihapus.')
    } catch (err) {
      setError(err.message || 'Gagal menghapus produk.')
    }
  }

  const imagePreview = previewUrl || existingImage

  return (
    <main className="product-admin-page">
      <header className="product-admin-header">
        <div>
          <a href="/admin" className="product-admin-back">
            <ArrowLeft size={16} /> Kembali ke Dashboard
          </a>
          <h1>Manajemen Produk</h1>
          <p>Kelola koleksi batik yang tampil di katalog Batik Rina.</p>
        </div>

        <button type="button" className="product-primary-button" onClick={openCreateForm}>
          <Plus size={17} /> Tambah Produk
        </button>
      </header>

      {notice && <p className="product-notice">{notice}</p>}
      {error && <p className="product-error" role="alert">{error}</p>}

      {formOpen && (
        <section className="product-form-card">
          <div className="product-form-heading">
            <h2>{editingId !== null ? 'Edit Produk' : 'Tambah Produk Baru'}</h2>
            <button
              type="button"
              className="product-icon-button"
              onClick={closeForm}
              aria-label="Tutup formulir"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="product-form">
            <label>
              Nama produk *
              <input name="name" value={form.name} onChange={changeField} required maxLength={255} />
            </label>

            <div className="product-form-grid">
              <label>
                Kategori *
                <input name="category" value={form.category} onChange={changeField} required maxLength={255} placeholder="Contoh: Pria" />
              </label>
              <label>
                Koleksi
                <input name="collection" value={form.collection} onChange={changeField} maxLength={255} placeholder="Contoh: Koleksi Klasik" />
              </label>
              <label>
                Harga (Rp)
                <input name="price" type="number" min="0" step="0.01" value={form.price} onChange={changeField} />
              </label>
              <label>
                Motif
                <input name="motif" value={form.motif} onChange={changeField} maxLength={255} placeholder="Contoh: Parang" />
              </label>
            </div>

            <label>
              Upload gambar produk
              <input
                key={fileInputKey}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
              />
              <small>
                Pilih gambar JPG, PNG, atau WEBP. Maksimal 5 MB.
                {editingId !== null && ' Kosongkan jika ingin mempertahankan gambar lama.'}
              </small>
            </label>

            {imagePreview && (
              <div className="product-image-preview">
                <img
                  src={imagePreview}
                  alt={form.alt || form.name || 'Pratinjau produk'}
                  onError={(event) => { event.currentTarget.style.display = 'none' }}
                  onLoad={(event) => { event.currentTarget.style.display = 'block' }}
                />
                {selectedImage && (
                  <button
                    type="button"
                    className="product-secondary-button"
                    onClick={cancelSelectedImage}
                  >
                    Batalkan gambar baru
                  </button>
                )}
              </div>
            )}

            <label>
              Teks alternatif gambar
              <input name="alt" value={form.alt} onChange={changeField} maxLength={255} placeholder="Deskripsi singkat gambar" />
            </label>

            <div className="product-form-grid">
              <label>
                Warna
                <input name="colors" value={form.colors} onChange={changeField} placeholder="Cokelat, Hitam" />
                <small>Pisahkan setiap warna dengan koma.</small>
              </label>
              <label>
                Ukuran
                <input name="sizes" value={form.sizes} onChange={changeField} placeholder="M, L, XL" />
                <small>Pisahkan setiap ukuran dengan koma.</small>
              </label>
            </div>

            <label>
              Deskripsi
              <textarea name="description" rows="4" value={form.description} onChange={changeField} />
            </label>

            <label className="product-checkbox">
              <input name="is_new" type="checkbox" checked={form.is_new} onChange={changeField} />
              Tandai sebagai produk terbaru
            </label>

            <div className="product-form-actions">
              <button type="button" className="product-secondary-button" onClick={closeForm}>
                Batal
              </button>
              <button type="submit" className="product-primary-button" disabled={saving}>
                {saving ? 'Menyimpan...' : editingId !== null ? 'Simpan Perubahan' : 'Simpan Produk'}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="product-list-card">
        <div className="product-list-heading">
          <div>
            <h2>Daftar Produk</h2>
            <p>{products.length} produk dalam katalog</p>
          </div>
          <button
            type="button"
            className="product-secondary-button"
            onClick={loadProducts}
            disabled={loading}
          >
            <RefreshCw size={15} /> Muat Ulang
          </button>
        </div>

        {loading ? (
          <p className="product-empty-state">Memuat produk...</p>
        ) : products.length === 0 ? (
          <p className="product-empty-state">Belum ada produk. Klik Tambah Produk untuk memulai.</p>
        ) : (
          <div className="product-list-grid">
            {products.map((product) => (
              <article className="product-admin-card" key={product.id}>
                {product.image ? (
                  <img
                    className="product-admin-card__image"
                    src={product.image}
                    alt={product.alt || product.name}
                    onError={(event) => { event.currentTarget.style.visibility = 'hidden' }}
                  />
                ) : (
                  <div className="product-admin-card__placeholder">BR</div>
                )}

                <div className="product-admin-card__body">
                  <small>{product.category || 'Tanpa kategori'}</small>
                  <h3>{product.name}</h3>
                  <p>{product.collection || 'Koleksi belum diisi'}</p>
                  <strong>
                    {product.price != null
                      ? new Intl.NumberFormat('id-ID', {
                          style: 'currency',
                          currency: 'IDR',
                          maximumFractionDigits: 0,
                        }).format(product.price)
                      : 'Harga belum diisi'}
                  </strong>

                  <div className="product-admin-card__actions">
                    <button type="button" onClick={() => openEditForm(product)} className="product-secondary-button">
                      <Pencil size={15} /> Edit
                    </button>
                    <button type="button" onClick={() => handleDelete(product)} className="product-delete-button">
                      <Trash2 size={15} /> Hapus
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
