/*
 * Products data module — fetches and indexes the JSON file once,
 * then provides filtering/search helpers used by all pages.
 */

/** Singleton promise — the data is fetched only once per page load */
let _productsPromise = null;

/**
 * Load all non-deleted products from the JSON file.
 * Returns a flat array with derived fields added.
 */
function loadProducts() {
  if (_productsPromise) return _productsPromise;

  _productsPromise = fetch(CONFIG.PRODUCTS_JSON)
    .then(res => {
      if (!res.ok) throw new Error(`Failed to load products: ${res.status}`);
      return res.json();
    })
    .then(raw => {
      // raw is a MongoDB export — each item may have $oid/$date wrappers
      return raw
        .filter(p => !p.isDeleted)
        .map(normaliseProduct)
        .sort((a, b) => {
          // Featured products first, then by price ascending
          if (b.isFeatured !== a.isFeatured) return b.isFeatured ? 1 : -1;
          return a.price - b.price;
        });
    });

  return _productsPromise;
}

/**
 * Normalise a raw MongoDB product document into a clean object.
 * Strips $oid/$date wrappers, extracts the primary image, derives category.
 */
function normaliseProduct(raw) {
  const id = raw._id?.$oid || raw._id || '';
  const createdAt = raw.createdAt?.$date || raw.createdAt || '';

  // Flatten categories array: strip ObjectId wrappers (they're just refs, not names)
  // We derive the display category from the slug instead.
  const categoryKey   = deriveCategoryKey(raw.slug);
  const categoryLabel = deriveCategory(raw.slug);

  // Normalise occasions to an array of strings only (some MongoDB exports have $oid objects mixed in)
  const occasions = Array.isArray(raw.occasions)
    ? raw.occasions.filter(o => typeof o === 'string')
    : [];

  // Primary image public ID
  const primaryImage = raw.defaultImage || (raw.images && raw.images[0]) || '';
  const allImages    = Array.isArray(raw.images) ? raw.images : (primaryImage ? [primaryImage] : []);

  return {
    id,
    name:          raw.name || '',
    slug:          raw.slug || '',
    description:   raw.description || '',
    price:         Number(raw.price) || 0,
    primaryImage,
    allImages,
    occasions,
    categoryKey,
    categoryLabel,
    isFeatured:    Boolean(raw.isFeatured),
    razorpayLink:  raw.razorpayLink || '',
    createdAt,
  };
}

/**
 * Get a single product by its slug.
 */
async function getProductBySlug(slug) {
  const products = await loadProducts();
  return products.find(p => p.slug === slug) || null;
}

/**
 * Get featured products (up to `limit`).
 */
async function getFeaturedProducts(limit = 8) {
  const products = await loadProducts();
  const featured = products.filter(p => p.isFeatured);
  // If fewer than limit are marked featured, pad with top-priced products
  if (featured.length >= limit) return featured.slice(0, limit);
  const others = products.filter(p => !p.isFeatured).slice(0, limit - featured.length);
  return [...featured, ...others];
}

/**
 * Get a random sample of products (up to `limit`).
 * Uses Fisher–Yates shuffle for unbiased sampling.
 */
async function getRandomProducts(limit = 5) {
  const products = await loadProducts();
  if (products.length <= limit) return products.slice();
  const shuffled = products.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, limit);
}

/**
 * Get all unique occasions present in the catalogue.
 */
async function getAllOccasions() {
  const products = await loadProducts();
  const set = new Set();
  products.forEach(p => p.occasions.forEach(o => set.add(o)));
  return [...set].sort();
}

/**
 * Get all unique derived categories present in the catalogue.
 */
async function getAllCategories() {
  const products = await loadProducts();
  const map = new Map();
  products.forEach(p => {
    if (!map.has(p.categoryKey)) {
      map.set(p.categoryKey, p.categoryLabel);
    }
  });
  return [...map.entries()].map(([key, label]) => ({ key, label }));
}

/**
 * Filter products by a set of criteria.
 * @param {Object} opts
 * @param {string}   opts.query      - free-text search
 * @param {string}   opts.occasion   - occasion key (e.g. "BIRTHDAY")
 * @param {string}   opts.category   - category key (e.g. "cakes")
 * @param {string}   opts.sort       - "price-asc" | "price-desc" | ""
 * @param {number}   opts.minPrice
 * @param {number}   opts.maxPrice
 * @param {number}   opts.page       - 1-indexed
 * @param {number}   opts.perPage
 */
async function filterProducts(opts = {}) {
  const { query = '', occasion = '', category = '', sort = '', page = 1, perPage = CONFIG.PRODUCTS_PER_PAGE } = opts;
  let products = await loadProducts();

  if (query.trim()) {
    const q = query.toLowerCase().trim();
    products = products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.categoryLabel.toLowerCase().includes(q) ||
      p.occasions.some(o => o.toLowerCase().includes(q))
    );
  }

  if (occasion) {
    products = products.filter(p =>
      p.occasions.some(o => o.toUpperCase() === occasion.toUpperCase())
    );
  }

  if (category) {
    products = products.filter(p => p.categoryKey === category);
  }

  if (sort === 'price-asc') {
    products = products.slice().sort((a, b) => a.price - b.price);
  } else if (sort === 'price-desc') {
    products = products.slice().sort((a, b) => b.price - a.price);
  }

  const total   = products.length;
  const start   = (page - 1) * perPage;
  const items   = products.slice(start, start + perPage);
  const pages   = Math.ceil(total / perPage);

  return { items, total, page, pages };
}
