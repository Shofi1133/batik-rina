import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  LogOut,
  ExternalLink,
  RefreshCw,
} from 'lucide-react'
import { getProducts } from '../services/api'

export default function AdminDashboard({ onLogout }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadProducts() {
    setLoading(true)
    setError('')

    try {
      const data = await getProducts()
      setProducts(data)
    } catch (err) {
      setError(err.message || 'Gagal mengambil data produk.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  return (
    <div className="admin-dashboard">
      <aside className="admin-sidebar">
        <a href="/" className="admin-sidebar__brand">
          <span className="admin-sidebar__logo">BR</span>
          <span>
            <strong>Batik Rina</strong>
            <small>Admin Panel</small>
          </span>
        </a>

        <p className="admin-sidebar__label">MENU UTAMA</p>

        <a href="/admin" className="admin-sidebar__link active">
          <LayoutDashboard size={19} />
          Dashboard
        </a>

        <a href="/admin/products" className="admin-sidebar__link">
          <Package size={19} />
          Produk
        </a>

        <a href="/" className="admin-sidebar__link">
          <ExternalLink size={19} />
          Lihat Katalog
        </a>

        <button
          type="button"
          className="admin-sidebar__logout"
          onClick={onLogout}
        >
          <LogOut size={19} />
          Keluar
        </button>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <p className="admin-breadcrumb">Admin / Dashboard</p>
            <h1>Dashboard</h1>
          </div>

          <div className="admin-profile">
            <span className="admin-profile__avatar">A</span>
            <span>
              <strong>Administrator</strong>
              <small>Pengelola Toko</small>
            </span>
          </div>
        </header>

        <section className="admin-welcome">
          <div>
            <p className="admin-welcome__eyebrow">
              BATIK RINA COLLECTION
            </p>
            <h2>Selamat datang di ruang pengelolaan.</h2>
            <p>
              Kelola koleksi dan informasi produk Batik Rina
              melalui satu dashboard.
            </p>
          </div>
          <div className="admin-welcome__mark">BR</div>
        </section>

        <section className="admin-stats">
          <article className="admin-stat-card">
            <span className="admin-stat-card__icon">
              <Package size={22} />
            </span>
            <p>Total Produk</p>
            <h3>{loading ? '...' : products.length}</h3>
            <small>Produk dari database</small>
          </article>

          <article className="admin-stat-card">
            <span className="admin-stat-card__icon">
              <ShoppingBag size={22} />
            </span>
            <p>Koleksi Terbaru</p>
            <h3>
              {loading
                ? '...'
                : products.filter((product) => product.isNew).length}
            </h3>
            <small>Produk bertanda terbaru</small>
          </article>

          <article className="admin-stat-card">
            <span className="admin-stat-card__icon">
              <LayoutDashboard size={22} />
            </span>
            <p>Status Sistem</p>
            <h3>{loading ? '...' : error ? 'Periksa' : 'Aktif'}</h3>
            <small>Koneksi data produk</small>
          </article>
        </section>

        <section className="admin-content-card">
          <div className="admin-content-card__header">
            <div>
              <h2>Produk Batik</h2>
              <p>Daftar produk yang tersedia di katalog.</p>
            </div>

            <button
              type="button"
              className="admin-refresh-button"
              onClick={loadProducts}
              disabled={loading}
            >
              <RefreshCw size={16} />
              Muat Ulang
            </button>
          </div>

          {loading ? (
            <p className="admin-state-message">Memuat data produk...</p>
          ) : error ? (
            <p className="admin-state-message admin-state-message--error">
              {error}
            </p>
          ) : products.length === 0 ? (
            <p className="admin-state-message">
              Belum ada produk yang tersedia.
            </p>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Nama Produk</th>
                    <th>Koleksi</th>
                    <th>Harga</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {products.slice(0, 8).map((product) => (
                    <tr key={product.id}>
                      <td>
                        <strong>{product.name}</strong>
                      </td>
                      <td>{product.collection || '-'}</td>
                      <td>
                        {product.price != null
                          ? new Intl.NumberFormat('id-ID', {
                              style: 'currency',
                              currency: 'IDR',
                              maximumFractionDigits: 0,
                            }).format(product.price)
                          : '-'}
                      </td>
                      <td>
                        <span className="admin-status">
                          {product.isNew ? 'Terbaru' : 'Tersedia'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <footer className="admin-footer">
          Batik Rina Admin Panel · Merawat tradisi, merangkai keindahan.
        </footer>
      </main>
    </div>
  )
}
