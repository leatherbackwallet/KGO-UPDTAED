/* Homepage logic — featured products, occasion tiles, category banners, carousel */

const HOME_CAROUSEL_SIZE = 10;
const HOME_CAROUSEL_AUTOROTATE_MS = 4500;
const HOME_CAROUSEL_SLIDE_WIDTH_PCT = 0.52;

document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  highlightActiveNav();
  renderOccasionTiles();
  renderHomeCarousel();
  renderFeaturedProducts();
  renderCategoryBanners();
});

/* ─── HOME CAROUSEL (Picked for you) ─── */

async function renderHomeCarousel() {
  const section = document.getElementById('products-carousel-section');
  const track = document.getElementById('products-carousel-track');
  const dotsContainer = document.getElementById('products-carousel-dots');
  const carouselEl = track ? track.closest('.products-carousel') : null;

  if (!section || !track || !dotsContainer || !carouselEl) return;

  const products = await getRandomProducts(HOME_CAROUSEL_SIZE);
  if (!products.length) return;

  if (section._carouselResizeObserver) {
    section._carouselResizeObserver.disconnect();
    section._carouselResizeObserver = null;
  }

  track.innerHTML = products.map((p, i) =>
    `<div class="products-carousel__slide ${i === 0 ? 'is-active' : ''}" data-slide-index="${i}" role="tabpanel" aria-hidden="${i !== 0}">
       ${renderProductCard(p)}
     </div>`
  ).join('');

  dotsContainer.innerHTML = products.map((_, i) =>
    `<button type="button" class="products-carousel__dot ${i === 0 ? 'is-active' : ''}"
             data-slide-index="${i}"
             role="tab"
             aria-selected="${i === 0}"
             aria-label="Go to slide ${i + 1}"></button>`
  ).join('');

  let currentIndex = 0;

  function updateTrackTransform() {
    const w = carouselEl.offsetWidth;
    const centerOffset = HOME_CAROUSEL_SLIDE_WIDTH_PCT / 2 - 0.5;
    const offsetPx = (currentIndex * HOME_CAROUSEL_SLIDE_WIDTH_PCT + centerOffset) * w;
    track.style.transform = `translateX(-${offsetPx}px)`;
  }

  function goToSlide(index) {
    if (index < 0 || index >= products.length) return;
    currentIndex = index;
    updateTrackTransform();
    track.querySelectorAll('.products-carousel__slide').forEach((slide, i) => {
      slide.classList.toggle('is-active', i === index);
      slide.setAttribute('aria-hidden', i !== index);
    });
    dotsContainer.querySelectorAll('.products-carousel__dot').forEach((dot, i) => {
      dot.classList.toggle('is-active', i === index);
      dot.setAttribute('aria-selected', i === index);
    });
  }

  const prevBtn = document.getElementById('carousel-prev');
  const nextBtn = document.getElementById('carousel-next');
  if (prevBtn) prevBtn.addEventListener('click', () => { goToSlide((currentIndex - 1 + products.length) % products.length); resetAutorotate(); });
  if (nextBtn) nextBtn.addEventListener('click', () => { goToSlide((currentIndex + 1) % products.length); resetAutorotate(); });

  dotsContainer.addEventListener('click', (e) => {
    const dot = e.target.closest('.products-carousel__dot');
    if (!dot) return;
    const index = parseInt(dot.getAttribute('data-slide-index'), 10);
    if (!Number.isNaN(index)) {
      goToSlide(index);
      resetAutorotate();
    }
  });

  function startAutorotate() {
    if (section._carouselInterval) clearInterval(section._carouselInterval);
    section._carouselInterval = setInterval(() => {
      goToSlide((currentIndex + 1) % products.length);
    }, HOME_CAROUSEL_AUTOROTATE_MS);
  }

  function resetAutorotate() {
    if (section._carouselInterval) {
      clearInterval(section._carouselInterval);
      section._carouselInterval = null;
    }
    startAutorotate();
  }

  updateTrackTransform();
  startAutorotate();

  const resizeObserver = new ResizeObserver(() => updateTrackTransform());
  resizeObserver.observe(carouselEl);
  section._carouselResizeObserver = resizeObserver;
}

/* ─── OCCASION TILES ─── */

async function renderOccasionTiles() {
  const container = document.getElementById('occasion-tiles');
  if (!container) return;

  const occasionKeys = await getAllOccasions();
  container.innerHTML = occasionKeys.map(key => {
    const meta = getOccasionMeta(key);
    return `
      <a href="./products.html?occasion=${encodeURIComponent(key)}"
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
      <a href="./products.html?category=${cat.key}"
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
  const detailUrl = `./product.html?slug=${encodeURIComponent(product.slug)}`;
  const occasionTags = product.occasions.slice(0, 3).map(o => {
    const meta = getOccasionMeta(o);
    return `<span class="product-card__occasion-tag">${meta.emoji} ${meta.label}</span>`;
  }).join('');

  const buyBtn = `<a href="./checkout.html?slug=${encodeURIComponent(product.slug)}" class="btn btn-primary btn-sm product-card__buy">Buy Now</a>`;

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
