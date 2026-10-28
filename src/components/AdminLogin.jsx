import { useState } from 'react'
import { ArrowRight, LockKeyhole } from 'lucide-react'

export default function AdminLogin({ onLogin, loading, error }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    onLogin({ email, password })
  }

  return (
    <main className="admin-login">
      <section className="admin-login__panel">
        <a href="/" className="admin-login__brand">
          <span className="admin-login__brand-name">
            Batik Rina
          </span>
          <span className="admin-login__brand-tagline">
            Keindahan dalam setiap motif
          </span>
        </a>

        <div className="admin-login__icon">
          <LockKeyhole size={23} />
        </div>

        <p className="eyebrow">ADMINISTRATION</p>

        <h1>Selamat datang kembali.</h1>

        <p className="admin-login__description">
          Masuk untuk mengelola katalog dan koleksi Batik Rina.
        </p>

        <form
          onSubmit={handleSubmit}
          className="admin-login__form"
        >
          <label htmlFor="admin-email">Email admin</label>
          <input
            id="admin-email"
            type="email"
            autoComplete="username"
            placeholder="admin@batikrina.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label htmlFor="admin-password">Password</label>
          <input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            placeholder="Masukkan password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          {error && (
            <p className="admin-login__error" role="alert">
              {error}
            </p>
          )}

          <button
            className="admin-login__submit"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Memproses...' : 'Masuk ke Dashboard'}
            {!loading && <ArrowRight size={17} />}
          </button>
        </form>

        <a href="/" className="admin-login__back">
          Kembali ke katalog Batik Rina
        </a>
      </section>

      <aside className="admin-login__visual">
        <div className="admin-login__visual-copy">
          <p className="eyebrow">BATIK RINA COLLECTION</p>
          <h2>Merawat tradisi, merangkai keindahan.</h2>
          <p>
            Kelola koleksi batik dengan lebih mudah melalui
            satu ruang pengelolaan.
          </p>
        </div>

        <span className="admin-login__visual-mark">
          BR — 01
        </span>
      </aside>
    </main>
  )
}
