/* Homepage logic — featured products, occasion tiles, category banners */

document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  highlightActiveNav();
  renderOccasionTiles();
  renderFeaturedProducts();
  renderCategoryBanners();
});

/* ─── OCCASION TILES ─── */

async function renderOccasionTiles() {
  const container = document.getElementById('occasion-tiles');
  if (!container) return;

  const occasionKeys = await getAllOccasions();
  container.innerHTML = occasionKeys.map(key => {
    const meta = getOccasionMeta(key);
    return `
      <a href="/KGO-UPDTAED/products.html?occasion=${encodeURIComponent(key)}"
         class="occasion-tile"
         aria-label="Shop ${meta.label} gifts">
        <span class="occasion-tile__emoji">${meta.emoji}</span>
        <span class="occasion-tile__name">${meta.label}</span>
      </a>
    `;
  }).join('');
}

/* ─── FEATURED PRODUCTS ─── */

async function renderFeaturedProducts() {
  const container = document.getElementById('featured-grid');
  if (!container) return;

  renderSkeletons(container, 8);

  const products = await getFeaturedProducts(8);

  if (!products.length) {
    container.innerHTML = '<p class="text-muted text-center">No products available.</p>';
    return;
  }

  container.innerHTML = products.map(renderProductCard).join('');
}

/* ─── CATEGORY BANNERS ─── */

async function renderCategoryBanners() {
  const container = document.getElementById('category-banners');
  if (!container) return;

  const categories = await getAllCategories();

  // We use a Cloudinary generic search image per category as placeholder
  // since we don't store per-category cover images
  const categoryImages = {
    'cakes':      'keralagiftsonline/categories/cakes',
    'flowers':    'keralagiftsonline/categories/flowers',
    'chocolates': 'keralagiftsonline/categories/chocolates',
    'hampers':    'keralagiftsonline/categories/hampers',
    'plants':     'keralagiftsonline/categories/plants',
    'sweets':     'keralagiftsonline/categories/sweets',
  };

  container.innerHTML = categories.slice(0, 6).map(cat => {
    const imgId = categoryImages[cat.key] || '';
    const imgSrc = imgId
      ? getImageUrl(imgId, 'medium')
      : CONFIG.PLACEHOLDER_IMG;

    return `
      <a href="/KGO-UPDTAED/products.html?category=${cat.key}"
         class="category-banner"
         aria-label="Shop ${cat.label}">
        <img src="${imgSrc}"
             alt="${escapeHtml(cat.label)}"
             loading="lazy"
             onerror="this.src='${CONFIG.PLACEHOLDER_IMG}';this.onerror=null;">
        <span class="category-banner__label">${escapeHtml(cat.label)}</span>
      </a>
    `;
  }).join('');
}

/* ─── SHARED PRODUCT CARD RENDERER ─── */

/**
 * Render a single product card HTML string.
 * Used on both homepage and catalog page.
 */
function renderProductCard(product) {
  const price    = formatPrice(product.price);
  const imgSrc   = getImageUrl(product.primaryImage, 'medium');
  const detailUrl = `/KGO-UPDTAED/product.html?slug=${encodeURIComponent(product.slug)}`;
  const occasionTags = product.occasions.slice(0, 3).map(o => {
    const meta = getOccasionMeta(o);
    return `<span class="product-card__occasion-tag">${meta.emoji} ${meta.label}</span>`;
  }).join('');

  const buyBtn = `<a href="/KGO-UPDTAED/checkout.html?slug=${encodeURIComponent(product.slug)}" class="btn btn-primary btn-sm product-card__buy">Buy Now</a>`;

  return `
    <div class="product-card">
      <a href="${detailUrl}" class="product-card__image-wrap">
        <img
          src="${imgSrc}"
          alt="${escapeHtml(product.name)}"
          loading="lazy"
          onerror="this.src='${CONFIG.PLACEHOLDER_IMG}';this.onerror=null;"
        >
        ${product.isFeatured ? '<div class="product-card__badges"><span class="badge badge-gold">Featured</span></div>' : ''}
      </a>
      <div class="product-card__body">
        <a href="${detailUrl}" class="product-card__name">${escapeHtml(product.name)}</a>
        <div class="product-card__occasions">${occasionTags}</div>
        <div class="product-card__footer">
          <span class="product-card__price"><span class="currency">₹</span>${product.price.toLocaleString('en-IN')}</span>
          ${buyBtn}
        </div>
      </div>
    </div>
  `;
}
