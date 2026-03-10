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
  const deliveryLabel = order.urgentDelivery ? 'Urgent/same day delivery' : 'Delivery';
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

  const emailBody = buildEmailBodyHtml(order);
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
    // Order details
    'Product':             order.productName,
    'Product Description': order.productDescription || '—',
    'Product Slug':       order.productSlug || '—',
    'Subtotal':            `₹${(order.productPrice || 0).toLocaleString('en-IN')}`,
    'Delivery Charge':     order.urgentDelivery ? `₹${(order.deliveryCharge || 0).toLocaleString('en-IN')}` : 'Free',
    'Total':               `₹${totalAmount.toLocaleString('en-IN')}`,
    'Razorpay Payment ID': order.paymentId || '—',
    'Order ID':            order.paymentId || '—',
    'Ordered At':          formatDate(order.orderedAt),
    // Customer (everything from "Your Details")
    'Customer Name':       order.senderName,
    'Customer Phone':      order.senderPhone,
    'Customer Email':      order.senderEmail,
    'Sender Name':         order.senderName,
    'Sender Phone':        order.senderPhone,
    'Sender Email':       order.senderEmail,
    // Delivery (everything from "Delivery Details")
    'Recipient Name':      order.recipientName,
    'Recipient Phone':     order.recipientPhone || '—',
    'Delivery Address':    order.deliveryAddress,
    'City':                order.deliveryCity,
    'Pincode':             order.deliveryPincode,
    'Delivery Date':       formatDate(order.deliveryDate),
    'Urgent Delivery':     order.urgentDelivery ? 'Yes' : 'No',
    // Gift message section
    'Gift Message':        order.giftMessage || '—',
    'Special Note':       order.specialNote || '—',
  };
}

/* HTML email: section and row helpers (inline styles for email clients) */
function emailSection(title, rows) {
  return `
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:16px;background:#f6f6f6;border-radius:8px;overflow:hidden;">
  <tr><td style="padding:12px 16px;background:#e8e8e8;font-family:Arial,sans-serif;font-size:14px;font-weight:700;color:#333;">${escapeHtml(title)}</td></tr>
  <tr><td style="padding:12px 16px;font-family:Arial,sans-serif;font-size:14px;color:#444;line-height:1.6;">${rows}</td></tr>
</table>`;
}
function emailRow(label, value) {
  return `<div style="margin-bottom:8px;"><span style="color:#666;">${escapeHtml(label)}:</span> <strong style="color:#222;">${escapeHtml(String(value || '—'))}</strong></div>`;
}

function buildEmailBodyHtml(order) {
  const totalAmount = getTotalAmount(order);
  const deliveryText = order.urgentDelivery ? `₹${(order.deliveryCharge || 0).toLocaleString('en-IN')} (Urgent)` : 'Free';
  return `
<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#eee;font-family:Arial,sans-serif;">
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#eee;"><tr><td style="padding:24px 16px;">
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
  <tr><td style="padding:24px 24px 16px;background:linear-gradient(135deg,#c0392b 0%,#a93226 100%);color:#fff;font-size:20px;font-weight:700;text-align:center;">New order received — ${escapeHtml(CONFIG.SITE_NAME)}</td></tr>
  <tr><td style="padding:20px 24px;">
${emailSection('Order details', [
  emailRow('Product', order.productName),
  emailRow('Description', order.productDescription || '—'),
  emailRow('Subtotal', '₹' + (order.productPrice || 0).toLocaleString('en-IN')),
  emailRow('Delivery', deliveryText),
  emailRow('Total', '₹' + totalAmount.toLocaleString('en-IN')),
  emailRow('Razorpay payment ID', order.paymentId || 'Pending'),
  emailRow('Ordered at', formatDate(order.orderedAt)),
].join(''))}
${emailSection('Customer (order placed by)', [
  emailRow('Name', order.senderName),
  emailRow('Phone', order.senderPhone),
  emailRow('Email', order.senderEmail),
].join(''))}
${emailSection('Delivery (recipient & address)', [
  emailRow('Recipient name', order.recipientName),
  emailRow('Recipient phone', order.recipientPhone || '—'),
  emailRow('Address', order.deliveryAddress),
  emailRow('City', order.deliveryCity),
  emailRow('Pincode', order.deliveryPincode),
  emailRow('Preferred date', formatDate(order.deliveryDate)),
  emailRow('Urgent delivery', order.urgentDelivery ? 'Yes' : 'No'),
].join(''))}
${emailSection('Gift message', escapeHtml(order.giftMessage || '—'))}
${emailSection('Special instructions', escapeHtml(order.specialNote || '—'))}
  </td></tr>
  <tr><td style="padding:12px 24px;background:#f9f9f9;font-size:12px;color:#888;text-align:center;">${escapeHtml(CONFIG.SITE_NAME)} · Order notification</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

function buildCustomerSuccessEmailHtml(order) {
  const siteName = escapeHtml(CONFIG.SITE_NAME);
  const name = escapeHtml(order.senderName);
  const product = escapeHtml(order.productName);
  const recipient = escapeHtml(order.recipientName);
  const date = escapeHtml(formatDate(order.deliveryDate));
  return `
<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#eee;font-family:Arial,sans-serif;">
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#eee;"><tr><td style="padding:32px 16px;">
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.1);">
  <tr><td style="padding:28px 24px;background:linear-gradient(135deg,#2ecc71 0%,#27ae60 100%);color:#fff;font-size:22px;font-weight:700;text-align:center;">😊 Wonderful! We have received your order</td></tr>
  <tr><td style="padding:24px;">
    <p style="margin:0 0 16px;font-size:16px;color:#333;line-height:1.6;">Hi ${name},</p>
    <p style="margin:0 0 20px;font-size:15px;color:#444;line-height:1.6;">Thank you for your purchase. Your gift will be delivered to <strong>${recipient}</strong> as per your chosen date (<strong>${date}</strong>). We will confirm delivery via WhatsApp or phone.</p>
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f8f9fa;border-radius:8px;margin:16px 0;">
      <tr><td style="padding:16px;font-size:14px;color:#555;">
        <strong style="color:#333;">Order summary</strong><br>
        ${product}
      </td></tr>
    </table>
    <p style="margin:16px 0 0;font-size:14px;color:#666;">If you have any questions, reply to this email or contact us on WhatsApp.</p>
  </td></tr>
  <tr><td style="padding:16px 24px;background:#f5f5f5;font-size:12px;color:#888;text-align:center;">${siteName} · Gifts delivered across Kerala</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

/* ─── CUSTOMER CONFIRMATION EMAIL via EmailJS ───
 * Customer-friendly only: smiley, welcoming text. No Razorpay or internal details.
 * In EmailJS template: use {{{ body_html }}} (triple braces) to render the HTML.
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
    body_html:      buildCustomerSuccessEmailHtml(order),
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
