const API_URL = import.meta.env.VITE_API_URL

// URL dasar untuk file di storage Laravel (tanpa akhiran /api).
const STORAGE_BASE = (API_URL ?? '').replace(/\/api\/?$/, '')

function resolveImageUrl(image) {
  if (!image) return ''
  if (/^https?:\/\//i.test(image)) return image

  return `${STORAGE_BASE}/storage/${image.replace(/^\/+/, '')}`
}

export async function getProducts() {
  const response = await fetch(`${API_URL}/products`, {
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error('Gagal mengambil data produk dari server.')
  }

  const json = await response.json()
  // Mendukung respons array langsung maupun { data: [...] }.
  const data = Array.isArray(json) ? json : json.data ?? []

  return data.map((product) => ({
    ...product,
    // Format yang digunakan komponen React.
    isNew: Boolean(product.is_new),
    colors: product.colors ?? [],
    sizes: product.sizes ?? [],
    image: resolveImageUrl(product.image),
    alt: product.alt ?? product.name,
    collection: product.collection ?? '',
    motif: product.motif ?? '',
    description: product.description ?? '',
  }))
}

// Login admin menggunakan Laravel Sanctum.
export async function loginAdmin(credentials) {
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(credentials),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || 'Login gagal. Periksa email dan password.')
  }

  return data
}

function getAdminHeaders() {
  const token = sessionStorage.getItem('admin_token')

  if (!token) {
    throw new Error('Sesi admin tidak ditemukan. Silakan login kembali.')
  }

  return {
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

async function adminRequest(path, options = {}) {
  const isFormData = options.body instanceof FormData

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...getAdminHeaders(),
      // Untuk FormData, browser mengatur Content-Type (multipart) sendiri.
      ...(isFormData || !options.body
        ? {}
        : { 'Content-Type': 'application/json' }),
      ...options.headers,
    },
  })

  const data = await response.json().catch(() => ({}))

  if (response.status === 401 || response.status === 403) {
    if (response.status === 401) {
      sessionStorage.removeItem('admin_token')
      window.location.href = '/admin/login'
    }

    throw new Error(
      data.message || 'Kamu tidak memiliki izin untuk melakukan tindakan ini.'
    )
  }

  if (!response.ok) {
    const validationMessage = data.errors
      ? Object.values(data.errors).flat().join(' ')
      : ''

    throw new Error(
      validationMessage || data.message || 'Permintaan gagal diproses.'
    )
  }

  return data
}

// Mengubah object produk biasa menjadi FormData.
// Jika yang diterima sudah FormData, dipakai apa adanya.
function toProductFormData(product) {
  if (product instanceof FormData) return product

  const formData = new FormData()

  Object.entries(product).forEach(([key, value]) => {
    if (key === 'image') {
      if (value instanceof File) {
        formData.append('image', value)
      }
      return
    }

    if (key === 'colors' || key === 'sizes') {
      ;(value ?? []).forEach((item) => formData.append(`${key}[]`, item))
      return
    }

    if (typeof value === 'boolean') {
      formData.append(key, value ? '1' : '0')
      return
    }

    if (value !== null && value !== undefined) {
      formData.append(key, String(value))
    }
  })

  return formData
}

export async function createProduct(product) {
  return adminRequest('/products', {
    method: 'POST',
    body: toProductFormData(product),
  })
}

export async function updateProduct(id, product) {
  const formData = toProductFormData(product)

  // Laravel tidak membaca multipart pada PUT asli,
  // jadi dikirim lewat POST dengan _method=PUT.
  if (!formData.has('_method')) {
    formData.append('_method', 'PUT')
  }

  return adminRequest(`/products/${id}`, {
    method: 'POST',
    body: formData,
  })
}

export async function deleteProduct(id) {
  return adminRequest(`/products/${id}`, {
    method: 'DELETE',
  })
}