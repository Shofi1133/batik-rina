import { useEffect, useMemo, useState } from 'react'
import { supabase } from './lib/supabase'
import {
  ArrowDown,
  ArrowRight,
  Check,
  ChevronDown,
  Camera,
  Menu,
  Minus,
  Plus,
  Search,
  X,
} from 'lucide-react'
import {
  benefits,
  brandStory,
  catalogNote,
  categories,
  categoryTiles,
  colors,
  collections,
  filterProducts,
  generalWhatsAppUrl,
  heroImage,
  storyImage,
  heroSubtitle,
  heroTitle,
  instagramAccountNote,
  instagramUrl,
  orderWhatsAppUrl,
  productSortOptions,
  products as legacyProducts,
  productImages,
  promotionalCopy,
  promotionalDescription,
  sortProducts,
  whatsappContactNote,
  whatsappNumberIsConfigured,
} from './data/products.js'

function BrandMark({ compact = false }) {
  return (
    <a className={`brand-mark${compact ? ' brand-mark--compact' : ''}`} href="#home" aria-label="Batik Rina, kembali ke beranda">
      <span className="brand-mark__name">Batik Rina</span>
      <span className="brand-mark__tagline">BATIK · BUSANA · CERITA</span>
    </a>
  )
}

function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const links = [
    ['Beranda', '#home'],
    ['Katalog', '#shop'],
    ['Cerita Motif', '#collections'],
    ['Tentang', '#about'],
  ]

  return (
    <>
      <div className="announcement-bar">Batik lokal, gaya tanpa batas — temukan ceritamu</div>
      <header className="site-header">
        <div className="header-inner page-container">
          <BrandMark />
          <nav className={`main-nav${menuOpen ? ' main-nav--open' : ''}`} aria-label="Navigasi utama">
            {links.map(([label, href]) => (
              <a key={href} href={href} onClick={() => setMenuOpen(false)}>{label}</a>
            ))}
            <a className="mobile-contact-link" href="#contact" onClick={() => setMenuOpen(false)}>Hubungi kami</a>
          </nav>
          <div className="header-actions">
            <a className="admin-access-link" href="/admin">Admin</a>
            <a className="header-whatsapp" href={generalWhatsAppUrl} target="_blank" rel="noreferrer">Pesan via WhatsApp <ArrowRight aria-hidden="true" /></a>
            <button className="icon-button menu-toggle" type="button" aria-label={menuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>
              {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
            </button>
          </div>
        </div>
      </header>
    </>
  )
}

function SectionHeading({ eyebrow, title, description, action, titleId }) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 id={titleId}>{title}</h2>
        {description && <p className="section-description">{description}</p>}
      </div>
      {action}
    </div>
  )
}

function ProductCard({ product, onSelect }) {
  return (
    <article className="product-card">
      <button type="button" className="product-card__image" onClick={() => onSelect(product)} aria-label={`Lihat detail ${product.name}`}>
        <img src={product.image} alt={product.alt} loading="lazy" />
        {product.isNew && <span className="product-badge">Baru</span>}
        <span className="product-card__view">Lihat detail <ArrowRight aria-hidden="true" /></span>
      </button>
      <div className="product-card__meta">
        <div>
          <p className="product-card__collection">{product.collection}</p>
          <h3><button type="button" onClick={() => onSelect(product)}>{product.name}</button></h3>
          <p className="product-card__category">{product.category}</p>
        </div>
      </div>
    </article>
  )
}

function ProductGrid({ items, onSelect, emptyText }) {
  if (!items.length) {
    return <div className="empty-state"><Search aria-hidden="true" /><p>{emptyText}</p></div>
  }
  return <div className="product-grid">{items.map((product) => <ProductCard key={product.id} product={product} onSelect={onSelect} />)}</div>
}

function ProductDialog({ product, onClose }) {
  const [size, setSize] = useState(product.sizes[1] || product.sizes[0])
  const [color, setColor] = useState(product.colors[0])
  const [quantity, setQuantity] = useState(1)

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="product-dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-product-name" onKeyDown={(event) => { if (event.key === 'Escape') onClose() }}>
        <button className="icon-button dialog-close" type="button" onClick={onClose} aria-label="Tutup detail produk"><X aria-hidden="true" /></button>
        <div className="dialog-image"><img src={product.image} alt={product.alt} /></div>
        <div className="dialog-content">
          <p className="eyebrow">{product.collection}</p>
          <h2 id="dialog-product-name">{product.name}</h2>
          <p className="dialog-description">{product.description}</p>
          <div className="product-facts">
            <p><span>Motif</span><strong>{product.motif}</strong></p>
            <p><span>Ketersediaan</span><strong>Konfirmasi melalui WhatsApp</strong></p>
          </div>
          <fieldset className="variant-fieldset">
            <legend>Ukuran <span>{size}</span></legend>
            <div className="size-options">
              {product.sizes.map((option) => <button key={option} type="button" className={size === option ? 'size-option is-selected' : 'size-option'} aria-pressed={size === option} onClick={() => setSize(option)}>{option}</button>)}
            </div>
            <p className="size-hint">Panduan ukuran dapat dikonfirmasi melalui WhatsApp.</p>
          </fieldset>
          <fieldset className="variant-fieldset">
            <legend>Warna <span>{color}</span></legend>
            <div className="color-options">
              {product.colors.map((option) => <button key={option} className={`color-option${color === option ? ' is-selected' : ''}`} type="button" aria-label={`Pilih warna ${option}`} aria-pressed={color === option} onClick={() => setColor(option)}><span className="color-dot" style={{ backgroundColor: colors[option] }} />{option}{color === option && <Check aria-hidden="true" />}</button>)}
            </div>
          </fieldset>
          <div className="dialog-order-row">
            <div className="quantity-stepper" aria-label="Jumlah produk">
              <button type="button" aria-label="Kurangi jumlah" disabled={quantity <= 1} onClick={() => setQuantity((current) => Math.max(1, current - 1))}><Minus aria-hidden="true" /></button>
              <span aria-live="polite">{quantity}</span>
              <button type="button" aria-label="Tambah jumlah" disabled={quantity >= 10} onClick={() => setQuantity((current) => Math.min(10, current + 1))}><Plus aria-hidden="true" /></button>
            </div>
          </div>
          <a className="button button--dark button--full" href={orderWhatsAppUrl({ product, size, color, quantity })} target="_blank" rel="noreferrer">
            Pesan via WhatsApp <ArrowRight aria-hidden="true" />
          </a>
          {!whatsappNumberIsConfigured && <p className="dialog-note">Nomor bisnis belum diatur. WhatsApp akan terbuka agar Anda dapat memilih kontak Batik Rina.</p>}
        </div>
      </section>
    </div>
  )
}

function Hero({ onExplore }) {
  return (
    <section className="hero page-container" id="home">
      <div className="hero-copy">
        <p className="eyebrow">Keindahan yang selalu relevan</p>
        <h1>{heroTitle}</h1>
        <p className="hero-description">{heroSubtitle}</p>
        <div className="hero-actions">
          <button className="button button--dark" type="button" onClick={onExplore}>Jelajahi ragam <ArrowRight aria-hidden="true" /></button>
          <a className="button button--text" href="#about">Tentang Kami <ArrowDown aria-hidden="true" /></a>
        </div>
        <div className="hero-caption"><span className="caption-line" />Ragam motif, satu cerita personal</div>
      </div>
      <div className="hero-visual">
        <img src={heroImage} alt="Tunik batik panjang dengan motif geometris biru, cokelat, dan keemasan" fetchPriority="high" />
        <div className="hero-image-label"><span>01 / 20</span><span>Keindahan dalam detail</span></div>
        <div className="hero-seal" aria-hidden="true"><span>BATIK</span><span>RINA</span><span className="seal-star">✳</span></div>
      </div>
    </section>
  )
}

function CategorySection({ onChoose }) {
  return (
    <section className="category-section page-container" id="categories">
      <SectionHeading eyebrow="Dibuat untuk setiap momen" title="Banyak rupa, satu rasa." description="Outer, tunik, dan dress batik dalam beragam motif serta pilihan warna." />
      <div className="category-grid">
        {categoryTiles.map((tile, index) => (
          <button type="button" className="category-tile" key={tile.label} onClick={() => onChoose(tile.label)}>
            <img src={tile.image} alt={`Pilihan ${tile.label}`} loading="lazy" />
            <span className="category-tile__number">0{index + 1}</span>
            <span className="category-tile__label">{tile.label}<ArrowRight aria-hidden="true" /></span>
          </button>
        ))}
      </div>
    </section>
  )
}

function CollectionsSection({ onChoose }) {
  return (
    <section className="collections-section page-container" id="collections">
      <SectionHeading eyebrow="Ragam cerita, satu keindahan" title="Kenali koleksi Batik Rina" description="Temukan karakter motif yang berbeda untuk melengkapi berbagai suasana." />
      <div className="collection-grid">
        {collections.map((collection, index) => (
          <button key={collection.name} className={`collection-card collection-card--${index + 1}`} type="button" onClick={() => onChoose(collection.category)}>
            <img src={collection.image} alt={`Koleksi ${collection.name} Batik Rina`} loading="lazy" />
            <span className="collection-card__veil" />
            <span className="collection-card__content"><span className="eyebrow">Koleksi 0{index + 1}</span><strong>{collection.name}</strong><span>{collection.subtitle}</span></span>
            <span className="collection-card__arrow"><ArrowRight aria-hidden="true" /></span>
          </button>
        ))}
      </div>
    </section>
  )
}

function AboutSection() {
  return (
    <section className="about-section page-container" id="about">
      <div className="about-image"><img src={storyImage} alt="Atasan batik turquoise dan hijau dengan pola abstrak" loading="lazy" /><span className="about-image__caption">Motif yang bercerita</span></div>
      <div className="about-copy">
        <p className="eyebrow">Tentang Batik Rina</p>
        <h2>Batik yang terasa dekat, di setiap cerita.</h2>
        <p>{brandStory}</p>
        <a href="#shop" className="text-link">Jelajahi pilihan kami <ArrowRight aria-hidden="true" /></a>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="site-footer" id="contact">
      <div className="footer-main page-container">
        <div className="footer-brand"><BrandMark compact /><p>Keindahan batik, untuk setiap cerita.</p></div>
        <div className="footer-contact"><p className="eyebrow">Mari berbincang</p><h2>Ada yang ingin ditanyakan?</h2><p>Hubungi Batik Rina untuk bertanya tentang pilihan dan ketersediaan produk.</p><a href={generalWhatsAppUrl} target="_blank" rel="noreferrer" className="footer-contact__link">{whatsappNumberIsConfigured ? 'Hubungi kami via WhatsApp' : 'Buka WhatsApp untuk bertanya'} <ArrowRight aria-hidden="true" /></a>{!whatsappNumberIsConfigured && <p className="footer-note">{whatsappContactNote}</p>}</div>
        <div className="footer-links"><p className="eyebrow">Jelajahi</p><a href="#shop">Shop</a><a href="#collections">Collections</a><a href="#about">About Us</a><a href={instagramUrl} target="_blank" rel="noreferrer" aria-label="Instagram Batik Rina"><Camera aria-hidden="true" /> Instagram</a><p className="footer-note">{instagramAccountNote}</p></div>
      </div>
      <div className="footer-bottom page-container"><span>© {new Date().getFullYear()} Batik Rina. Seluruh hak cipta dilindungi.</span><a href="#home">Kembali ke atas ↑</a></div>
    </footer>
  )
}

export default function App() {
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [category, setCategory] = useState('Semua')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('featured')
  const [remoteProducts, setRemoteProducts] = useState([])
  useEffect(() => {
    if (!supabase) return
    supabase.from('products').select('*').eq('is_published', true).order('created_at', { ascending: false }).then(({ data }) => {
      if (data?.length) setRemoteProducts(data.map((product) => ({ ...product, image: product.photo, alt: product.description || product.name, colors: product.colors || ['Navy'], sizes: product.sizes || ['S', 'M', 'L', 'XL'], collection: 'Katalog toko', motif: product.motif || 'Batik', isNew: true })))
    })
  }, [])
  const catalogProducts = remoteProducts.length ? remoteProducts : legacyProducts
  const matchingProducts = useMemo(() => sortProducts(filterProducts(catalogProducts, query, category), sort), [catalogProducts, category, query, sort])
  const featured = catalogProducts.slice(0, 4)
  const latest = catalogProducts.filter((product) => product.isNew).slice(0, 3)

  const chooseCategory = (value) => {
    setCategory(value)
    document.querySelector('#shop')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <Header />
      <main>
        <Hero onExplore={() => document.querySelector('#shop')?.scrollIntoView({ behavior: 'smooth' })} />
        <CategorySection onChoose={chooseCategory} />
        <section className="featured-section page-container" aria-labelledby="featured-title">
          <SectionHeading eyebrow="Pilihan yang istimewa" title="Produk unggulan" titleId="featured-title" description="Pilihan motif dan siluet yang mudah menjadi favorit." action={<a className="text-link section-link" href="#shop">Lihat semua produk <ArrowRight aria-hidden="true" /></a>} />
          <ProductGrid items={featured} onSelect={setSelectedProduct} emptyText="Belum ada produk." />
        </section>
        <CollectionsSection onChoose={chooseCategory} />
        <section className="promotion-banner page-container">
          <div className="promotion-image"><img src={productImages[5]} alt="Outer batik panjang dengan kombinasi biru, putih, dan oranye" loading="lazy" /></div>
          <div className="promotion-copy"><p className="eyebrow">Koleksi Batik Rina</p><h2>{promotionalCopy}</h2><p>{promotionalDescription}</p><a className="button button--light" href="#shop">Jelajahi koleksi <ArrowRight aria-hidden="true" /></a></div>
          <span className="promotion-index" aria-hidden="true">BR — 01</span>
        </section>
        <section className="latest-section page-container" aria-labelledby="latest-title">
          <SectionHeading eyebrow="Temukan yang terbaru" title="Koleksi terbaru" titleId="latest-title" description="Kenali pilihan terbaru dari ragam motif Batik Rina." action={<a className="text-link section-link" href="#shop">Jelajahi katalog <ArrowRight aria-hidden="true" /></a>} />
          <ProductGrid items={latest} onSelect={setSelectedProduct} emptyText="Belum ada produk terbaru." />
        </section>
        <section className="values-section page-container">
          <div className="values-heading"><p className="eyebrow">Keistimewaan Batik Rina</p><h2>Lebih dari sekadar motif.</h2><p>Pilihan sederhana yang merayakan keindahan dan karakter batik.</p></div>
          <div className="values-list">{benefits.map((item) => <article className="value-item" key={item.number}><span>{item.number}</span><div><h3>{item.title}</h3><p>{item.description}</p></div><ArrowDown aria-hidden="true" /></article>)}</div>
        </section>
        <AboutSection />
        <section className="shop-section" id="shop">
          <div className="page-container">
            <SectionHeading eyebrow="Koleksi pilihan" title="Temukan batik pilihan Anda" description="Motif yang berkarakter, siluet yang terasa modern." />
            <div className="catalog-tools">
              <label className="search-field"><Search aria-hidden="true" /><span className="sr-only">Cari produk</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value.slice(0, 80))} placeholder="Cari nama, motif, atau kategori" /></label>
              <label className="sort-field"><span>Urutkan</span><select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Urutkan produk">{productSortOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select><ChevronDown aria-hidden="true" /></label>
            </div>
            <div className="category-filters" aria-label="Filter kategori">
              {categories.map((item) => <button type="button" key={item} className={category === item ? 'category-filter is-active' : 'category-filter'} aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}
            </div>
            <p className="catalog-count" aria-live="polite">{matchingProducts.length} produk</p>
            <ProductGrid items={matchingProducts} onSelect={setSelectedProduct} emptyText="Belum ada produk yang sesuai. Coba kata kunci atau kategori lain." />
            <p className="catalog-disclaimer">Catatan katalog: {catalogNote}</p>
          </div>
        </section>
      </main>
      <Footer />
      {selectedProduct && <ProductDialog key={selectedProduct.id} product={selectedProduct} onClose={() => setSelectedProduct(null)} />}
    </>
  )
}
