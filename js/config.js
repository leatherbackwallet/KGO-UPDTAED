/* Site-wide configuration constants */

const CONFIG = Object.freeze({
  SITE_NAME:        'KeralGiftsOnline',
  SITE_TAGLINE:     'Gifts Delivered Across Kerala',
  SITE_URL:         'https://keralagiftsonline.in',
  WHATSAPP_NUMBER:  '918075030919',  // without +, for wa.me links
  MERCHANT_EMAIL:   'sales@keralagiftsonline.com',

  // All recipients get the order email as "To" (no CC). Create one Web3Forms access key per email at web3forms.com and list in same order as MERCHANT_EMAILS.
  MERCHANT_EMAILS:  ['sales@keralagiftsonline.com', 'robin.joseph742@gmail.com', 'sreekuttan59@gmail.com'],
  MERCHANT_ACCESS_KEYS: [
    'd58444e8-db52-446c-adab-7da5185a2015', // sales@keralagiftsonline.com — add keys for robin & sreekuttan when ready
  ],

  // Web3Forms — get free key at https://web3forms.com (enter sales@keralagiftsonline.com)
  WEB3FORMS_KEY:    'd58444e8-db52-446c-adab-7da5185a2015',

  // Razorpay — public key only (safe to expose). Get from Razorpay Dashboard → Settings → API Keys
  RAZORPAY_KEY_ID:  'rzp_live_RJUs4PJL0Hctlv',

  // Cloudinary
  CLOUDINARY_BASE:  'https://res.cloudinary.com/deojqbepy/image/upload',
  CLOUDINARY_TRANSFORMS: 'w_600,h_600,c_fill,q_auto,f_auto',
  CLOUDINARY_THUMB:      'w_150,h_150,c_fill,q_auto,f_auto',
  CLOUDINARY_LARGE:      'w_1200,h_1200,c_fill,q_auto,f_auto',

  // Data
  PRODUCTS_JSON:    './data/keralagiftsonline.products.json',

  // Catalog pagination
  PRODUCTS_PER_PAGE: 24,

  // Placeholder image (base64 tiny grey square)
  PLACEHOLDER_IMG: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="600" height="600"%3E%3Crect width="600" height="600" fill="%23f2ede7"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="48" fill="%23c8bdb5"%3E🎁%3C/text%3E%3C/svg%3E',

  // Occasions metadata — emoji + display label
  OCCASIONS: {
    'BIRTHDAY':       { emoji: '🎂', label: 'Birthday' },
    'ANNIVERSARY':    { emoji: '💑', label: 'Anniversary' },
    'WEDDING':        { emoji: '💍', label: 'Wedding' },
    'DIWALI':         { emoji: '🪔', label: 'Diwali' },
    'CHRISTMAS':      { emoji: '🎄', label: 'Christmas' },
    'NEW YEAR':       { emoji: '🎆', label: 'New Year' },
    'MOTHERS DAY':    { emoji: '💐', label: "Mother's Day" },
    'FATHERS DAY':    { emoji: '👔', label: "Father's Day" },
    'VALENTINES DAY': { emoji: '❤️', label: "Valentine's Day" },
    'CONGRATULATION': { emoji: '🎉', label: 'Congratulations' },
    'GET WELL SOON':  { emoji: '🌸', label: 'Get Well Soon' },
    'THANK YOU':      { emoji: '🙏', label: 'Thank You' },
    'MISS YOU':       { emoji: '💌', label: 'Miss You' },
    'CONDOLENCES':    { emoji: '🕊️', label: 'Condolences' },
    'NEW BORN':       { emoji: '👶', label: 'New Born' },
    'HOUSE WARMING':  { emoji: '🏠', label: 'House Warming' },
    'RETIREMENT':     { emoji: '🏖️', label: 'Retirement' },
    'FAREWELL':       { emoji: '👋', label: 'Farewell' },
    'ONAM':           { emoji: '🌺', label: 'Onam' },
    'EID':            { emoji: '🌙', label: 'Eid' },
  },

  // Slug-based category derivation keywords (order matters — first match wins)
  CATEGORY_KEYWORDS: [
    { key: 'cakes',        label: 'Cakes',         keywords: ['cake', 'truffle', 'pastry', 'cupcake'] },
    { key: 'flowers',      label: 'Flowers',        keywords: ['rose', 'bouquet', 'flower', 'lily', 'gypsophila', 'floral', 'orchid'] },
    { key: 'chocolates',   label: 'Chocolates',     keywords: ['chocolate', 'ferrero', 'truffle', 'praline', 'choco'] },
    { key: 'plants',       label: 'Plants',         keywords: ['plant', 'succulent', 'bamboo', 'bonsai'] },
    { key: 'hampers',      label: 'Gift Hampers',   keywords: ['hamper', 'basket', 'box', 'kit', 'combo', 'set'] },
    { key: 'dry-fruits',   label: 'Dry Fruits',     keywords: ['dry fruit', 'almond', 'cashew', 'pista', 'walnut', 'raisin'] },
    { key: 'sweets',       label: 'Sweets',         keywords: ['sweet', 'ladoo', 'barfi', 'halwa', 'mithai', 'payasam'] },
  ],
});
