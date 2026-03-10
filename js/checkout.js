/* Checkout page — order form, validation, and Razorpay inline modal */

document.addEventListener('DOMContentLoaded', async () => {
  initMobileMenu();

  const slug = getParam('slug');
  if (!slug) {
    redirectToProducts('No product selected.');
    return;
  }

  const product = await getProductBySlug(slug);
  if (!product) {
    redirectToProducts('Product not found.');
    return;
  }

  renderOrderSummary(product);
  attachFormListeners(product);
});

/* ─── ORDER SUMMARY SIDEBAR ─── */

/** Urgent delivery is free; no extra charge. Kept for backward compatibility with saved orders. */
const URGENT_DELIVERY_CHARGE = 0;

function renderOrderSummary(product, urgentDelivery = false) {
  const el = document.getElementById('order-summary');
  if (!el) return;

  const deliveryCost = urgentDelivery ? URGENT_DELIVERY_CHARGE : 0;
  const total = product.price + deliveryCost;
  const deliveryLabel = urgentDelivery ? 'Urgent delivery' : 'Delivery';
  const deliveryValue = '<span style="color:var(--color-success);font-weight:600">Free</span>';

  el.innerHTML = `
    <div class="order-summary-card__product">
      <div class="order-summary-card__product-img">
        <img
          src="${getImageUrl(product.primaryImage, 'medium')}"
          alt="${escapeHtml(product.name)}"
          onerror="this.src='${CONFIG.PLACEHOLDER_IMG}';this.onerror=null;"
        >
      </div>
      <div class="order-summary-card__product-info">
        <p class="order-summary-card__product-name">${escapeHtml(product.name)}</p>
        <p class="order-summary-card__product-price">₹${product.price.toLocaleString('en-IN')}</p>
      </div>
    </div>
    <div class="order-summary-card__totals">
      <div class="order-summary-row">
        <span>Subtotal</span>
        <span>₹${product.price.toLocaleString('en-IN')}</span>
      </div>
      <div class="order-summary-row">
        <span>${deliveryLabel}</span>
        <span>${deliveryValue}</span>
      </div>
      <div class="order-summary-row total">
        <span>Total</span>
        <span>₹${total.toLocaleString('en-IN')}</span>
      </div>
    </div>
    <div class="order-summary-card__secure">
      🔒 Secured by Razorpay — 100% safe checkout
    </div>
  `;
}

/* ─── FORM VALIDATION RULES ─── */

const VALIDATORS = {
  senderName:       v => v.trim().length >= 2  || 'Enter your full name',
  senderPhone:      v => /^[6-9]\d{9}$/.test(v.trim()) || 'Enter a valid 10-digit Indian mobile number',
  senderEmail:      v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || 'Enter a valid email address',
  recipientName:    v => v.trim().length >= 2  || 'Enter the recipient\'s name',
  recipientPhone:  v => /^[6-9]\d{9}$/.test(v.trim()) || 'Enter a valid 10-digit recipient mobile number',
  deliveryAddress:  v => v.trim().length >= 10 || 'Enter a complete delivery address',
  deliveryCity:     v => v.trim().length >= 2  || 'Enter the city',
  deliveryPincode:  v => /^\d{6}$/.test(v.trim()) || 'Enter a valid 6-digit pincode',
  deliveryDate:     v => {
    if (!v) return 'Select a delivery date';
    const isUrgent = document.getElementById('urgentDelivery')?.checked === true;
    if (isUrgent) return true;
    const d = new Date(v + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const minDate = new Date(today);
    minDate.setDate(minDate.getDate() + 2);
    if (d.getTime() < minDate.getTime()) return 'Standard delivery requires at least 48 hours. Choose a date at least 2 days from today, or use Urgent delivery.';
    return true;
  },
};

function validateField(name, value) {
  const rule = VALIDATORS[name];
  if (!rule) return null;
  const result = rule(value);
  return result === true ? null : result;
}

function showFieldError(name, message) {
  const input = document.getElementById(name);
  const errEl = document.getElementById(`${name}-error`);
  if (input)  input.classList.add('error');
  if (errEl) { errEl.textContent = message; errEl.style.display = 'flex'; }
}

function clearFieldError(name) {
  const input = document.getElementById(name);
  const errEl = document.getElementById(`${name}-error`);
  if (input)  input.classList.remove('error');
  if (errEl) { errEl.textContent = ''; errEl.style.display = 'none'; }
}

/* ─── FORM LISTENERS ─── */

function attachFormListeners(product) {
  Object.keys(VALIDATORS).forEach(name => {
    const el = document.getElementById(name);
    if (!el) return;
    el.addEventListener('blur',  () => {
      const err = validateField(name, el.value);
      err ? showFieldError(name, err) : clearFieldError(name);
    });
    el.addEventListener('input', () => clearFieldError(name));
  });

  function setDeliveryDateMin(urgent) {
    const dateInput = document.getElementById('deliveryDate');
    if (!dateInput) return;
    const today = new Date();
    if (urgent) {
      dateInput.setAttribute('min', today.toISOString().split('T')[0]);
    } else {
      const minDate = new Date(today);
      minDate.setDate(minDate.getDate() + 2);
      dateInput.setAttribute('min', minDate.toISOString().split('T')[0]);
    }
  }

  setDeliveryDateMin(false);

  const urgentCheckbox = document.getElementById('urgentDelivery');
  const urgentNotice = document.getElementById('urgent-whatsapp-notice');
  if (urgentCheckbox) {
    urgentCheckbox.addEventListener('change', () => {
      const checked = urgentCheckbox.checked;
      if (urgentNotice) urgentNotice.style.display = checked ? 'block' : 'none';
      setDeliveryDateMin(checked);
      renderOrderSummary(product, checked);
      const err = validateField('deliveryDate', document.getElementById('deliveryDate')?.value);
      if (err) showFieldError('deliveryDate', err);
      else clearFieldError('deliveryDate');
    });
  }

  const urgentWhatsAppBtn = document.getElementById('urgent-whatsapp-btn');
  if (urgentWhatsAppBtn) {
    urgentWhatsAppBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openUrgentDeliveryWhatsApp(product);
    });
  }

  const form = document.getElementById('checkout-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      handleSubmit(product);
    });
  }
}

/* ─── FORM SUBMIT — OPEN RAZORPAY MODAL ─── */

function handleSubmit(product) {
  // Validate all fields first
  let hasErrors = false;
  Object.keys(VALIDATORS).forEach(name => {
    const el  = document.getElementById(name);
    if (!el) return;
    const err = validateField(name, el.value);
    if (err) { showFieldError(name, err); hasErrors = true; }
    else       clearFieldError(name);
  });

  if (hasErrors) {
    const firstError = document.querySelector('.form-input.error, .form-textarea.error');
    if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  const orderData = collectFormValues(product);

  // Persist order details — success.js reads these after payment
  sessionSave('pendingOrder', orderData);

  openRazorpay(product, orderData);
}

/* ─── COLLECT FORM VALUES ─── */

function collectFormValues(product) {
  const deliveryCharge = urgentDelivery ? URGENT_DELIVERY_CHARGE : 0;
  return {
    productName:     product.name,
    productSlug:     product.slug,
    productPrice:    product.price,
    productDescription: (product.description || '').trim(),
    urgentDelivery,
    deliveryCharge,
    senderName:      document.getElementById('senderName').value.trim(),
    senderPhone:     document.getElementById('senderPhone').value.trim(),
    senderEmail:     document.getElementById('senderEmail').value.trim(),
    recipientName:   document.getElementById('recipientName').value.trim(),
    recipientPhone:  document.getElementById('recipientPhone').value.trim(),
    deliveryAddress: document.getElementById('deliveryAddress').value.trim(),
    deliveryCity:    document.getElementById('deliveryCity').value.trim(),
    deliveryPincode: document.getElementById('deliveryPincode').value.trim(),
    deliveryDate:    document.getElementById('deliveryDate').value,
    giftMessage:     (document.getElementById('giftMessage')?.value  || '').trim(),
    specialNote:     (document.getElementById('specialNote')?.value  || '').trim(),
    orderedAt:       new Date().toISOString(),
  };
}

/* ─── RAZORPAY MODAL ─── */

function openRazorpay(product, order) {
  if (typeof Razorpay === 'undefined') {
    showToast('Payment gateway failed to load. Please refresh and try again.', 'error');
    return;
  }

  const submitBtn = document.getElementById('submit-btn');
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Opening payment…'; }

  const totalAmount = product.price + (order.urgentDelivery ? URGENT_DELIVERY_CHARGE : 0);

  const options = {
    key:         CONFIG.RAZORPAY_KEY_ID,
    amount:      totalAmount * 100,  // Razorpay expects paise
    currency:    'INR',
    name:        CONFIG.SITE_NAME,
    description: product.name,
    image:       getImageUrl(product.primaryImage, 'thumb'),

    prefill: {
      name:    order.senderName,
      email:   order.senderEmail,
      contact: '91' + order.senderPhone,
    },

    // Notes are stored on the Razorpay transaction and visible in the dashboard
    notes: {
      recipient:       order.recipientName,
      recipient_phone: order.recipientPhone || '',
      address:         `${order.deliveryAddress}, ${order.deliveryCity} - ${order.deliveryPincode}`,
      delivery_date:   order.deliveryDate,
      urgent_delivery: order.urgentDelivery ? 'yes' : 'no',
      gift_message:    order.giftMessage || '',
      product:         product.name,
    },

    theme: { color: '#c0392b' },

    // Called by Razorpay after successful payment
    handler: function(response) {
      // Add payment ID to the order data already in sessionStorage
      const saved = sessionLoad('pendingOrder') || {};
      saved.paymentId = response.razorpay_payment_id;
      sessionSave('pendingOrder', saved);

      window.location.href = './success.html';
    },

    modal: {
      ondismiss: function() {
        const saved = sessionLoad('pendingOrder') || {};
        saved.status = 'cancelled';
        saved.errorReason = 'Payment window was closed';
        sessionSave('pendingOrder', saved);
        window.location.href = './cancelled.html';
      },
    },
  };

  const rzp = new Razorpay(options);

  rzp.on('payment.failed', function(response) {
    const saved = sessionLoad('pendingOrder') || {};
    saved.status = 'failed';
    saved.errorReason = response.error?.description || 'Payment could not be completed';
    sessionSave('pendingOrder', saved);
    window.location.href = './cancelled.html';
  });

  rzp.open();
}

function redirectToProducts(msg) {
  showToast(msg, 'error');
  setTimeout(() => { window.location.href = './products.html'; }, 1500);
}

/* ─── URGENT DELIVERY — WHATSAPP MESSAGE TO ADMIN ─── */

/**
 * Builds a presentable WhatsApp message for urgent delivery: user intro + order details.
 * Uses current form values so admin receives full context when customer clicks the CTA.
 */
function buildUrgentWhatsAppMessage(product) {
  const g = (id) => (document.getElementById(id) && document.getElementById(id).value) ? document.getElementById(id).value.trim() : '';
  const senderName = g('senderName');
  const senderPhone = g('senderPhone');
  const senderEmail = g('senderEmail');
  const recipientName = g('recipientName');
  const recipientPhone = g('recipientPhone');
  const deliveryAddress = g('deliveryAddress');
  const deliveryCity = g('deliveryCity');
  const deliveryPincode = g('deliveryPincode');
  const deliveryDate = g('deliveryDate');
  const giftMessage = g('giftMessage');
  const specialNote = g('specialNote');

  const formatDate = (d) => {
    if (!d) return '—';
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  };

  const lines = [
    'Hi, I am interested in this product but I need immediate delivery.',
    '',
    '——— ORDER DETAILS ———',
    `Product: ${product.name}`,
    `Price: ₹${product.price.toLocaleString('en-IN')}`,
    '',
    '——— MY DETAILS ———',
    `Name: ${senderName || '—'}`,
    `Phone: ${senderPhone || '—'}`,
    `Email: ${senderEmail || '—'}`,
    '',
    '——— DELIVERY ———',
    `Recipient: ${recipientName || '—'}`,
    `Recipient Phone: ${recipientPhone || '—'}`,
    `Address: ${deliveryAddress || '—'}`,
    `City: ${deliveryCity || '—'}`,
    `Pincode: ${deliveryPincode || '—'}`,
    `Preferred Date: ${formatDate(deliveryDate)}`,
  ];

  if (giftMessage) lines.push('', 'Gift Message: ' + giftMessage);
  if (specialNote) lines.push('', 'Special Instructions: ' + specialNote);

  return lines.join('\n');
}

/**
 * Opens WhatsApp to admin (CONFIG.WHATSAPP_NUMBER) with pre-filled urgent delivery message.
 */
function openUrgentDeliveryWhatsApp(product) {
  const message = buildUrgentWhatsAppMessage(product);
  const url = `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}
