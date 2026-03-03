/* Product detail page — renders a single product loaded by ?slug= URL param */

document.addEventListener('DOMContentLoaded', async () => {
  initMobileMenu();
  highlightActiveNav();

  const slug = getParam('slug');
  if (!slug) {
    renderError('No product specified.');
    return;
  }

  renderLoadingState();
  const product = await getProductBySlug(slug);

  if (!product) {
    renderError('Product not found.');
    return;
  }

  renderProductDetail(product);
  renderRelatedProducts(product);
  updatePageMeta(product);
});

/* ─── LOADING STATE ─── */

function renderLoadingState() {
  const gallery = document.getElementById('product-gallery');
  const info    = document.getElementById('product-info');
  if (gallery) gallery.innerHTML = `<div class="skeleton" style="width:100%;aspect-ratio:1/1;border-radius:var(--radius-xl)"></div>`;
  if (info)    info.innerHTML    = `<div style="padding:2rem 0"><div class="spinner" style="margin:0 auto"></div></div>`;
}

/* ─── ERROR STATE ─── */

function renderError(msg) {
  const layout = document.getElementById('product-layout');
  if (!layout) return;
  layout.innerHTML = `
    <div class="empty-state" style="grid-column:1/-1">
      <div class="empty-state__icon">😕</div>
      <h3>${escapeHtml(msg)}</h3>
      <a href="./products.html" class="btn btn-primary">Browse Products</a>
    </div>
  `;
}

/* ─── MAIN RENDER ─── */

function renderProductDetail(product) {
  renderGallery(product);
  renderInfo(product);
  renderBreadcrumb(product);
}

function renderBreadcrumb(product) {
  const el = document.getElementById('breadcrumb');
  if (!el) return;
  el.innerHTML = `
    <a href="/">Home</a>
    <span class="breadcrumb__sep">›</span>
    <a href="./products.html">Products</a>
    <span class="breadcrumb__sep">›</span>
    <span class="breadcrumb__current">${escapeHtml(product.name)}</span>
  `;
}

/* ─── GALLERY ─── */

let activeImageIndex = 0;

function renderGallery(product) {
  const galleryEl = document.getElementById('product-gallery');
  if (!galleryEl) return;

  const images = product.allImages.length ? product.allImages : [product.primaryImage || ''];
  activeImageIndex = 0;

  galleryEl.innerHTML = `
    <div class="product-gallery__main" id="gallery-main">
      <img
        id="gallery-main-img"
        src="${getImageUrl(images[0], 'large')}"
        alt="${escapeHtml(product.name)}"
        onerror="this.src='${CONFIG.PLACEHOLDER_IMG}';this.onerror=null;"
      >
    </div>
    ${images.length > 1 ? `
      <div class="product-gallery__thumbs" id="gallery-thumbs">
        ${images.map((img, i) => `
          <div class="product-gallery__thumb ${i === 0 ? 'active' : ''}"
               data-index="${i}"
               onclick="switchImage(${i},'${escapeHtml(img)}','${escapeHtml(product.name)}')">
            <img src="${getImageUrl(img, 'thumb')}"
                 alt="${escapeHtml(product.name)} view ${i + 1}"
                 loading="lazy"
                 onerror="this.src='${CONFIG.PLACEHOLDER_IMG}';this.onerror=null;">
          </div>
        `).join('')}
      </div>
    ` : ''}
  `;
}

window.switchImage = function(index, publicId, alt) {
  const mainImg   = document.getElementById('gallery-main-img');
  const thumbs    = document.querySelectorAll('.product-gallery__thumb');
  if (!mainImg) return;

  mainImg.src = getImageUrl(publicId, 'large');
  mainImg.alt = alt;
  activeImageIndex = index;

  thumbs.forEach((t, i) => t.classList.toggle('active', i === index));
};

/* ─── INFO PANEL ─── */

function renderInfo(product) {
  const infoEl = document.getElementById('product-info');
  if (!infoEl) return;

  const occasions = product.occasions.map(o => {
    const meta = getOccasionMeta(o);
    return `<span class="filter-pill">${meta.emoji} ${meta.label}</span>`;
  }).join('');

  const buyBtn = `<a href="./checkout.html?slug=${encodeURIComponent(product.slug)}" class="btn btn-primary btn-lg">Buy Now — ${formatPrice(product.price)}</a>`;

  infoEl.innerHTML = `
    <div class="product-info__badges">
      <span class="badge badge-primary">${escapeHtml(product.categoryLabel)}</span>
      ${product.isFeatured ? '<span class="badge badge-gold">Featured</span>' : ''}
    </div>

    <h1 class="product-info__name">${escapeHtml(product.name)}</h1>

    <div class="product-info__price-row">
      <span class="product-info__price">
        <span class="currency">₹</span>${product.price.toLocaleString('en-IN')}
      </span>
      <span class="product-info__price-note">Free delivery across Kerala</span>
    </div>

    ${product.description ? `
      <div class="product-info__description">
        <p>${escapeHtml(product.description)}</p>
      </div>
    ` : ''}

    ${product.occasions.length ? `
      <div class="product-info__occasions">
        <h4>Perfect for</h4>
        <div class="filter-pills">${occasions}</div>
      </div>
    ` : ''}

    <div class="product-cta">
      <p class="product-cta__note">
        🚚 Delivered same day or as per your selected date
      </p>
      <div class="product-cta__buttons">
        ${buyBtn}
        <a href="${buildWhatsAppLink(product.name, product.price)}"
           target="_blank" rel="noopener"
           class="btn btn-whatsapp">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" style="flex-shrink:0">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          WhatsApp
        </a>
      </div>
      <div class="product-cta__trust">
        <span class="product-cta__trust-item">✅ Genuine products</span>
        <span class="product-cta__trust-item">🔒 Secure payment</span>
      </div>
    </div>
  `;
}

/* ─── RELATED PRODUCTS ─── */

async function renderRelatedProducts(product) {
  const container = document.getElementById('related-grid');
  if (!container) return;

  const result = await filterProducts({
    occasion: product.occasions[0] || '',
    category: product.categoryKey,
    perPage:  4,
  });

  const related = result.items.filter(p => p.slug !== product.slug).slice(0, 4);
  if (!related.length) {
    document.getElementById('related-section')?.remove();
    return;
  }

  container.innerHTML = related.map(renderProductCard).join('');
}

/* ─── PAGE META ─── */

function updatePageMeta(product) {
  document.title = `${product.name} — ${CONFIG.SITE_NAME}`;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) {
    metaDesc.setAttribute('content', product.description
      ? product.description.slice(0, 155)
      : `Buy ${product.name} online in Kerala. ${formatPrice(product.price)}. Same-day delivery.`
    );
  }
}
