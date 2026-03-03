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

function renderOrderSummary(product) {
  const el = document.getElementById('order-summary');
  if (!el) return;

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
        <span>Delivery</span>
        <span style="color:var(--color-success);font-weight:600">Free</span>
      </div>
      <div class="order-summary-row total">
        <span>Total</span>
        <span>₹${product.price.toLocaleString('en-IN')}</span>
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
  deliveryAddress:  v => v.trim().length >= 10 || 'Enter a complete delivery address',
  deliveryCity:     v => v.trim().length >= 2  || 'Enter the city',
  deliveryPincode:  v => /^\d{6}$/.test(v.trim()) || 'Enter a valid 6-digit pincode',
  deliveryDate:     v => {
    if (!v) return 'Select a delivery date';
    const d = new Date(v);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d >= today || 'Delivery date cannot be in the past';
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

  const dateInput = document.getElementById('deliveryDate');
  if (dateInput) {
    dateInput.setAttribute('min', new Date().toISOString().split('T')[0]);
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
  return {
    productName:     product.name,
    productSlug:     product.slug,
    productPrice:    product.price,
    senderName:      document.getElementById('senderName').value.trim(),
    senderPhone:     document.getElementById('senderPhone').value.trim(),
    senderEmail:     document.getElementById('senderEmail').value.trim(),
    recipientName:   document.getElementById('recipientName').value.trim(),
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

  const options = {
    key:         CONFIG.RAZORPAY_KEY_ID,
    amount:      product.price * 100,  // Razorpay expects paise
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
      recipient:     order.recipientName,
      address:       `${order.deliveryAddress}, ${order.deliveryCity} - ${order.deliveryPincode}`,
      delivery_date: order.deliveryDate,
      gift_message:  order.giftMessage || '',
      product:       product.name,
    },

    theme: { color: '#c0392b' },

    // Called by Razorpay after successful payment
    handler: function(response) {
      // Add payment ID to the order data already in sessionStorage
      const saved = sessionLoad('pendingOrder') || {};
      saved.paymentId = response.razorpay_payment_id;
      sessionSave('pendingOrder', saved);

      window.location.href = '/KGO-UPDTAED/success.html';
    },

    modal: {
      ondismiss: function() {
        if (submitBtn) {
          submitBtn.disabled    = false;
          submitBtn.textContent = 'Proceed to Payment →';
        }
      },
    },
  };

  const rzp = new Razorpay(options);

  rzp.on('payment.failed', function(response) {
    showToast('Payment failed: ' + (response.error?.description || 'Unknown error'), 'error');
    if (submitBtn) {
      submitBtn.disabled    = false;
      submitBtn.textContent = 'Proceed to Payment →';
    }
  });

  rzp.open();
}

function redirectToProducts(msg) {
  showToast(msg, 'error');
  setTimeout(() => { window.location.href = '/KGO-UPDTAED/products.html'; }, 1500);
}
