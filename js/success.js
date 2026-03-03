/*
 * Post-payment success page.
 * Reads order data from sessionStorage + Razorpay callback URL params.
 * Sends a notification email to the merchant via Web3Forms.
 */

document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();

  const order = sessionLoad('pendingOrder');

  if (!order) {
    renderNoOrder();
    return;
  }

  // paymentId is written into sessionStorage by checkout.js handler before redirecting here
  order.paymentId = order.paymentId || '';

  renderSuccess(order);
  sendMerchantEmail(order);

  // Clear the pending order from storage after processing
  sessionClear('pendingOrder');
});

/* ─── RENDER SUCCESS ─── */

function renderSuccess(order) {
  const container = document.getElementById('success-content');
  if (!container) return;

  container.innerHTML = `
    <div class="success-icon">🎉</div>
    <h1>Order Placed!</h1>
    <p class="subtitle">
      Thank you, <strong>${escapeHtml(order.senderName)}</strong>!
      Your order has been received. We'll confirm your delivery via WhatsApp or phone shortly.
    </p>

    <div class="success-order-card">
      <div class="success-order-card__header">Order Details</div>
      <div class="success-order-card__body">
        ${row('Product',         order.productName)}
        ${row('Amount Paid',     formatPrice(order.productPrice))}
        ${row('Payment ID',      order.paymentId || '—')}
        ${row('Deliver To',      order.recipientName)}
        ${row('Delivery Address',order.deliveryAddress + ', ' + order.deliveryCity + ' — ' + order.deliveryPincode)}
        ${row('Delivery Date',   formatDate(order.deliveryDate))}
        ${order.giftMessage ? row('Gift Message', order.giftMessage) : ''}
      </div>
    </div>

    <div class="success-actions">
      <a href="/KGO-UPDTAED/products.html" class="btn btn-outline">Continue Shopping</a>
      <a href="https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent('Hi! I just placed an order for ' + order.productName + '. Payment ID: ' + (order.paymentId || 'pending'))}"
         target="_blank" rel="noopener"
         class="btn btn-whatsapp">
        Contact us on WhatsApp
      </a>
    </div>
  `;
}

function row(label, value) {
  return `
    <div class="success-detail-row">
      <span class="label">${escapeHtml(label)}</span>
      <span class="value">${escapeHtml(String(value || '—'))}</span>
    </div>
  `;
}

/* ─── NO ORDER STATE ─── */

function renderNoOrder() {
  const container = document.getElementById('success-content');
  if (!container) return;
  container.innerHTML = `
    <div class="empty-state">
      <div class="empty-state__icon">🤔</div>
      <h3>No recent order found</h3>
      <p>If you just completed a payment, please contact us on WhatsApp with your Payment ID.</p>
      <div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap;margin-top:1rem">
        <a href="/KGO-UPDTAED/products.html" class="btn btn-outline">Browse Products</a>
        <a href="https://wa.me/${CONFIG.WHATSAPP_NUMBER}" target="_blank" rel="noopener" class="btn btn-whatsapp">WhatsApp Us</a>
      </div>
    </div>
  `;
}

/* ─── MERCHANT EMAIL NOTIFICATION via Web3Forms ─── */

async function sendMerchantEmail(order) {
  if (!CONFIG.WEB3FORMS_KEY || CONFIG.WEB3FORMS_KEY === 'YOUR_WEB3FORMS_ACCESS_KEY') {
    console.warn('Web3Forms key not configured. Skipping merchant email.');
    return;
  }

  const emailBody = buildEmailBody(order);

  try {
    const res = await fetch('https://api.web3forms.com/submit', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_key:  CONFIG.WEB3FORMS_KEY,
        subject:     `New Order: ${order.productName} — ₹${order.productPrice.toLocaleString('en-IN')}`,
        from_name:   CONFIG.SITE_NAME,
        to:          CONFIG.MERCHANT_EMAIL,
        message:     emailBody,
        // Structured fields — appear as a table in the email
        'Product':          order.productName,
        'Price':            `₹${order.productPrice.toLocaleString('en-IN')}`,
        'Payment ID':       order.paymentId || 'Pending',
        'Sender Name':      order.senderName,
        'Sender Phone':     order.senderPhone,
        'Sender Email':     order.senderEmail,
        'Recipient Name':   order.recipientName,
        'Delivery Address': order.deliveryAddress,
        'City':             order.deliveryCity,
        'Pincode':          order.deliveryPincode,
        'Delivery Date':    formatDate(order.deliveryDate),
        'Gift Message':     order.giftMessage || '—',
        'Special Note':     order.specialNote || '—',
        'Ordered At':       formatDate(order.orderedAt),
      }),
    });

    const data = await res.json();
    if (!data.success) {
      console.error('Web3Forms error:', data.message);
    }
  } catch (err) {
    console.error('Failed to send merchant email:', err);
  }
}

function buildEmailBody(order) {
  return `
NEW ORDER RECEIVED — ${CONFIG.SITE_NAME}
${'='.repeat(50)}

PRODUCT
  Name:       ${order.productName}
  Price:      ₹${order.productPrice.toLocaleString('en-IN')}
  Payment ID: ${order.paymentId || 'Pending confirmation'}

SENDER (Customer)
  Name:  ${order.senderName}
  Phone: ${order.senderPhone}
  Email: ${order.senderEmail}

DELIVERY DETAILS
  Recipient:       ${order.recipientName}
  Address:         ${order.deliveryAddress}
  City:            ${order.deliveryCity}
  Pincode:         ${order.deliveryPincode}
  Requested Date:  ${formatDate(order.deliveryDate)}

GIFT MESSAGE
  ${order.giftMessage || '(none)'}

SPECIAL INSTRUCTIONS
  ${order.specialNote || '(none)'}

Ordered at: ${formatDate(order.orderedAt)}
${'='.repeat(50)}
`.trim();
}
