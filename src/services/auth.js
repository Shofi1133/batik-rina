const API_URL = import.meta.env.VITE_API_URL

export async function loginAdmin(email, password) {
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ email, password }),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(
      data.message || 'Login gagal. Periksa email dan password.'
    )
  }

  if (!data.token) {
    throw new Error('Token tidak ditemukan pada respons server.')
  }

  // Simpan token untuk sesi tab browser ini.
  sessionStorage.setItem('admin_token', data.token)

  return data
}

export function logoutAdmin() {
  const token = sessionStorage.getItem('admin_token')

  sessionStorage.removeItem('admin_token')

  if (!token) return

  return fetch(`${API_URL}/logout`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })
}

export function getAdminToken() {
  return sessionStorage.getItem('admin_token')
}