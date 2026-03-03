/* Shared utility functions used across all pages */

/**
 * Build a full Cloudinary URL from a public ID stored in the JSON.
 * Handles both raw public IDs and already-full URLs gracefully.
 */
function getImageUrl(publicId, size = 'medium') {
  if (!publicId) return CONFIG.PLACEHOLDER_IMG;
  if (publicId.startsWith('http')) return publicId;

  const transforms = size === 'thumb'  ? CONFIG.CLOUDINARY_THUMB
                   : size === 'large'  ? CONFIG.CLOUDINARY_LARGE
                   : CONFIG.CLOUDINARY_TRANSFORMS;

  return `${CONFIG.CLOUDINARY_BASE}/${transforms}/${publicId}`;
}

/** Format a number as Indian Rupees (e.g. "₹5,300") */
function formatPrice(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Derive a display category string from a product's slug.
 * Returns the first matching category label, or 'Other'.
 */
function deriveCategory(slug) {
  const s = (slug || '').toLowerCase();
  for (const cat of CONFIG.CATEGORY_KEYWORDS) {
    if (cat.keywords.some(kw => s.includes(kw))) return cat.label;
  }
  return 'Other';
}

/**
 * Derive category key from slug (for filtering).
 */
function deriveCategoryKey(slug) {
  const s = (slug || '').toLowerCase();
  for (const cat of CONFIG.CATEGORY_KEYWORDS) {
    if (cat.keywords.some(kw => s.includes(kw))) return cat.key;
  }
  return 'other';
}

/** Get occasion display label and emoji */
function getOccasionMeta(occasionKey) {
  return CONFIG.OCCASIONS[occasionKey] || { emoji: '🎁', label: occasionKey };
}

/** Capitalise first letter of each word */
function titleCase(str) {
  return (str || '').replace(/\b\w/g, c => c.toUpperCase());
}

/** Read a URL query parameter by name */
function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

/** Navigate to a page with query params */
function navigateTo(page, params = {}) {
  const qs = new URLSearchParams(params).toString();
  window.location.href = qs ? `${page}?${qs}` : page;
}

/** Save an object to sessionStorage */
function sessionSave(key, data) {
  try {
    sessionStorage.setItem(key, JSON.stringify(data));
  } catch (_) { /* storage full or blocked */ }
}

/** Load an object from sessionStorage */
function sessionLoad(key) {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

/** Remove an item from sessionStorage */
function sessionClear(key) {
  try { sessionStorage.removeItem(key); } catch (_) { /* noop */ }
}

/** Show a brief toast notification */
function showToast(message, type = 'default') {
  let toast = document.getElementById('site-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'site-toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.className = `toast${type !== 'default' ? ' ' + type : ''}`;

  // Trigger reflow before adding .show to enable CSS transition
  void toast.offsetHeight;
  toast.classList.add('show');

  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 3000);
}

/**
 * Build a WhatsApp enquiry link for a product.
 */
function buildWhatsAppLink(productName, price) {
  const msg = encodeURIComponent(
    `Hi! I'm interested in "${productName}" (${formatPrice(price)}). Can you help me order?`
  );
  return `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${msg}`;
}

/**
 * Debounce a function call.
 */
function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Render skeleton product cards into a container.
 */
function renderSkeletons(container, count = 8) {
  container.innerHTML = Array.from({ length: count }, () => `
    <div class="product-card product-card--skeleton">
      <div class="product-card__image-wrap">
        <div class="skeleton sk-img" style="width:100%;height:100%;"></div>
      </div>
      <div class="product-card__body">
        <div class="skeleton sk-line" style="width:85%"></div>
        <div class="skeleton sk-line" style="width:60%"></div>
        <div class="skeleton sk-line short"></div>
        <div style="margin-top:12px;display:flex;justify-content:space-between;align-items:center;">
          <div class="skeleton sk-line price" style="width:35%;margin:0"></div>
          <div class="skeleton" style="width:80px;height:32px;border-radius:6px;"></div>
        </div>
      </div>
    </div>
  `).join('');
}

/**
 * Build an img element with lazy loading and error fallback.
 */
function buildImg(publicId, alt, size = 'medium') {
  const src = getImageUrl(publicId, size);
  return `<img
    src="${src}"
    alt="${escapeHtml(alt)}"
    loading="lazy"
    onerror="this.src='${CONFIG.PLACEHOLDER_IMG}';this.onerror=null;"
  >`;
}

/** Escape HTML to prevent XSS */
function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Format a date string nicely (e.g. "11 Sep 2025") */
function formatDate(dateStr) {
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  } catch (_) {
    return dateStr;
  }
}

/** Init the mobile hamburger menu toggle */
function initMobileMenu() {
  const toggle   = document.getElementById('nav-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  if (!toggle || !mobileMenu) return;

  toggle.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!toggle.contains(e.target) && !mobileMenu.contains(e.target)) {
      mobileMenu.classList.remove('open');
    }
  });
}

/** Mark active nav link based on current page */
function highlightActiveNav() {
  const path = window.location.pathname.replace(/\/$/, '') || '/index.html';
  document.querySelectorAll('.navbar__link').forEach(link => {
    const href = link.getAttribute('href') || '';
    if (path.endsWith(href) && href !== '/') {
      link.classList.add('active');
    }
  });
}
