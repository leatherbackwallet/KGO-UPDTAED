/*
 * Post-payment success page.
 * Reads order data from sessionStorage + Razorpay callback URL params.
 * Sends notification emails to the merchant (Web3Forms) and customer (EmailJS).
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
  sendCustomerEmail(order);

  // Clear the pending order from storage after processing
  sessionClear('pendingOrder');
});

/* ─── RENDER SUCCESS ─── */

function getTotalAmount(order) {
  const delivery = order.urgentDelivery ? (order.deliveryCharge || 0) : 0;
  return (order.productPrice || 0) + delivery;
}

function renderSuccess(order) {
  const container = document.getElementById('success-content');
  if (!container) return;

  const totalAmount = getTotalAmount(order);
  const deliveryCharge = order.urgentDelivery ? (order.deliveryCharge || 0) : 0;
  const deliveryLabel = order.urgentDelivery ? 'Urgent delivery' : 'Delivery';
  const deliveryValue = order.urgentDelivery
    ? ((order.deliveryCharge && order.deliveryCharge > 0) ? formatPrice(order.deliveryCharge) : 'Free')
    : 'Free';

  container.innerHTML = `
    <div class="success-icon">🎉</div>
    <h1>Payment Successful</h1>
    <p class="subtitle">
      Thank you, <strong>${escapeHtml(order.senderName)}</strong>!
      Your order has been received. We'll confirm your delivery via WhatsApp or phone shortly.
    </p>

    <div class="success-order-card">
      <div class="success-order-card__header">Order Details</div>
      <div class="success-order-card__body">
        ${row('Product',           order.productName)}
        ${row('Subtotal',           formatPrice(order.productPrice))}
        ${row(deliveryLabel,        deliveryValue)}
        ${row('Total Paid',         formatPrice(totalAmount))}
        ${row('Payment ID',         order.paymentId || '—')}
        ${row('Ordered At',         formatDate(order.orderedAt))}
      </div>
    </div>

    <div class="success-order-card">
      <div class="success-order-card__header">Your Details</div>
      <div class="success-order-card__body">
        ${row('Name',               order.senderName)}
        ${row('Phone',               order.senderPhone)}
        ${row('Email',              order.senderEmail)}
      </div>
    </div>

    <div class="success-order-card">
      <div class="success-order-card__header">Delivery Details</div>
      <div class="success-order-card__body">
        ${row('Deliver To',          order.recipientName)}
        ${order.recipientPhone ? row('Recipient Phone', order.recipientPhone) : ''}
        ${row('Address',            order.deliveryAddress + ', ' + order.deliveryCity + ' — ' + order.deliveryPincode)}
        ${row('Delivery Date',       formatDate(order.deliveryDate))}
        ${order.giftMessage ? row('Gift Message', order.giftMessage) : ''}
        ${order.specialNote ? row('Special Instructions', order.specialNote) : ''}
      </div>
    </div>

    <div class="success-actions">
      <a href="./products.html" class="btn btn-outline">Continue Shopping</a>
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
        <a href="./products.html" class="btn btn-outline">Browse Products</a>
        <a href="https://wa.me/${CONFIG.WHATSAPP_NUMBER}" target="_blank" rel="noopener" class="btn btn-whatsapp">WhatsApp Us</a>
      </div>
    </div>
  `;
}

/* ─── MERCHANT EMAIL NOTIFICATION via Web3Forms ─── */

async function sendMerchantEmail(order) {
  const keys = CONFIG.MERCHANT_ACCESS_KEYS || [];
  if (keys.length === 0 && (!CONFIG.WEB3FORMS_KEY || CONFIG.WEB3FORMS_KEY === 'YOUR_WEB3FORMS_ACCESS_KEY')) {
    console.warn('Web3Forms key(s) not configured. Skipping merchant email.');
    return;
  }

  const emailBody = buildEmailBody(order);
  const payload = buildMerchantEmailPayload(order, emailBody);

  // Use MERCHANT_ACCESS_KEYS if set (one key per To recipient); otherwise fallback to single WEB3FORMS_KEY
  const accessKeys = keys.filter(Boolean).length
    ? keys.filter(Boolean)
    : [CONFIG.WEB3FORMS_KEY];

  try {
    const requests = accessKeys.map((key) =>
      fetch('https://api.web3forms.com/submit', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, access_key: key }),
      })
    );

    const results = await Promise.all(requests);
    for (let i = 0; i < results.length; i++) {
      const data = await results[i].json();
      if (!data.success) {
        console.error('Web3Forms error:', data.message, `(recipient ${i + 1})`);
      }
    }
  } catch (err) {
    console.error('Failed to send merchant email:', err);
  }
}

function buildMerchantEmailPayload(order, emailBody) {
  const totalAmount = getTotalAmount(order);
  return {
    subject:     `New Order: ${order.productName} — ₹${totalAmount.toLocaleString('en-IN')}`,
    from_name:   CONFIG.SITE_NAME,
    message:     emailBody,
    'Product':            order.productName,
    'Product Description': order.productDescription || '—',
    'Subtotal':           `₹${(order.productPrice || 0).toLocaleString('en-IN')}`,
    'Delivery Charge':    order.urgentDelivery ? `₹${(order.deliveryCharge || 0).toLocaleString('en-IN')}` : 'Free',
    'Total':              `₹${totalAmount.toLocaleString('en-IN')}`,
    'Razorpay Payment ID': order.paymentId || '—',
    'Order ID':           order.paymentId || '—',
    'Sender Name':        order.senderName,
    'Sender Phone':       order.senderPhone,
    'Sender Email':       order.senderEmail,
    'Recipient Name':     order.recipientName,
    'Recipient Phone':    order.recipientPhone || '—',
    'Delivery Address':   order.deliveryAddress,
    'City':               order.deliveryCity,
    'Pincode':            order.deliveryPincode,
    'Delivery Date':      formatDate(order.deliveryDate),
    'Urgent Delivery':    order.urgentDelivery ? 'Yes' : 'No',
    'Gift Message':       order.giftMessage || '—',
    'Special Note':       order.specialNote || '—',
    'Ordered At':         formatDate(order.orderedAt),
  };
}

function buildEmailBody(order) {
  const totalAmount = getTotalAmount(order);
  return `
NEW ORDER RECEIVED — ${CONFIG.SITE_NAME}
${'='.repeat(50)}

PRODUCT
  Name:        ${order.productName}
  Description: ${order.productDescription || '(none)'}
  Subtotal:    ₹${(order.productPrice || 0).toLocaleString('en-IN')}
  Delivery:    ${order.urgentDelivery ? `₹${(order.deliveryCharge || 0).toLocaleString('en-IN')} (Urgent)` : 'Free'}
  Total:       ₹${totalAmount.toLocaleString('en-IN')}

RAZORPAY / ORDER ID
  Payment ID:  ${order.paymentId || 'Pending confirmation'}

SENDER (Customer)
  Name:   ${order.senderName}
  Phone:  ${order.senderPhone}
  Email:  ${order.senderEmail}

DELIVERY DETAILS
  Recipient:        ${order.recipientName}
  Recipient Phone:  ${order.recipientPhone || '—'}
  Address:          ${order.deliveryAddress}
  City:             ${order.deliveryCity}
  Pincode:          ${order.deliveryPincode}
  Requested Date:   ${formatDate(order.deliveryDate)}
  Urgent Delivery:  ${order.urgentDelivery ? 'Yes' : 'No'}

GIFT MESSAGE
  ${order.giftMessage || '(none)'}

SPECIAL INSTRUCTIONS
  ${order.specialNote || '(none)'}

Ordered at: ${formatDate(order.orderedAt)}
${'='.repeat(50)}
`.trim();
}

/* ─── CUSTOMER CONFIRMATION EMAIL via EmailJS ───
 * Customer-friendly only: smiley, welcoming text. No Razorpay or internal details.
 */

function sendCustomerEmail(order) {
  const publicKey = CONFIG.EMAILJS_PUBLIC_KEY;
  const serviceId = CONFIG.EMAILJS_SERVICE_ID;
  const templateId = CONFIG.EMAILJS_TEMPLATE_CONFIRMED;

  if (!publicKey || publicKey === 'YOUR_EMAILJS_PUBLIC_KEY' ||
      !serviceId || serviceId === 'YOUR_EMAILJS_SERVICE_ID' ||
      !templateId || templateId === 'YOUR_TEMPLATE_ID') {
    console.warn('EmailJS not configured. Skipping customer confirmation email.');
    return;
  }

  if (typeof emailjs === 'undefined') {
    console.warn('EmailJS SDK not loaded. Skipping customer confirmation email.');
    return;
  }

  const templateParams = {
    to_email:        order.senderEmail,
    to_name:         order.senderName,
    greeting:        'Wonderful! We have received your order 😊',
    body_text:       'Thank you for your purchase. Your gift will be delivered to the recipient as per your chosen date. We will confirm delivery via WhatsApp or phone.',
    product_name:   order.productName,
    recipient_name: order.recipientName,
    delivery_date:  formatDate(order.deliveryDate),
  };

  try {
    emailjs.init(publicKey);
    emailjs.send(serviceId, templateId, templateParams).catch((err) => {
      console.error('Failed to send customer confirmation email:', err);
    });
  } catch (err) {
    console.error('Failed to send customer confirmation email:', err);
  }
}
