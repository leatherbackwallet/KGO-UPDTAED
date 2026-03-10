/*
 * Payment cancelled/failed page.
 * Reads order data from sessionStorage (status + errorReason set by checkout.js).
 * Sends notification emails to merchant (Web3Forms) and customer (EmailJS).
 */

document.addEventListener('DOMContentLoaded', () => {
  if (typeof initMobileMenu === 'function') initMobileMenu();

  const order = sessionLoad('pendingOrder');

  if (!order) {
    renderNoOrder();
    return;
  }

  order.status = order.status || 'cancelled';
  order.errorReason = order.errorReason || 'Payment was not completed';

  renderCancelled(order);
  sendMerchantCancelEmail(order);
  sendCustomerCancelEmail(order);

  sessionClear('pendingOrder');
});

/* ─── RENDER CANCELLED ─── */

function getTotalAmount(order) {
  const delivery = order.urgentDelivery ? (order.deliveryCharge || 0) : 0;
  return (order.productPrice || 0) + delivery;
}

function getRetryLink(order) {
  const slug = order.productSlug || '';
  return slug ? `./checkout.html?slug=${encodeURIComponent(slug)}` : './checkout.html';
}

function renderCancelled(order) {
  const container = document.getElementById('cancelled-content');
  if (!container) return;

  const totalAmount = getTotalAmount(order);
  const retryLink = getRetryLink(order);
  const isFailed = order.status === 'failed';

  container.innerHTML = `
    <div class="success-icon" style="background:var(--color-error, #c0392b);color:#fff;">😔</div>
    <h1>${isFailed ? 'Payment Failed' : 'Payment Cancelled'}</h1>
    <p class="subtitle">
      ${escapeHtml(order.senderName || 'Customer')}, we could not complete your payment.
      <br>No amount has been charged. You can try again or contact us if you need help.
    </p>

    <div class="success-order-card">
      <div class="success-order-card__header">Order Summary</div>
      <div class="success-order-card__body">
        <div class="success-detail-row">
          <span class="label">Product</span>
          <span class="value">${escapeHtml(order.productName || '—')}</span>
        </div>
        <div class="success-detail-row">
          <span class="label">Amount</span>
          <span class="value">${formatPrice(totalAmount)}</span>
        </div>
      </div>
    </div>

    <p style="margin-top:1rem;color:var(--color-muted, #666);">
      No amount has been charged. You can try again or choose another product.
    </p>

    <div class="success-actions">
      <a href="${escapeHtml(retryLink)}" class="btn btn-primary">Try Again — Same Product</a>
      <a href="./products.html" class="btn btn-outline">Browse Products</a>
      <a href="https://wa.me/${CONFIG.WHATSAPP_NUMBER}" target="_blank" rel="noopener" class="btn btn-whatsapp">Contact us on WhatsApp</a>
    </div>
  `;
}

function renderNoOrder() {
  const container = document.getElementById('cancelled-content');
  if (!container) return;
  container.innerHTML = `
    <div class="empty-state">
      <div class="empty-state__icon">🤔</div>
      <h3>No payment session found</h3>
      <p>If you were trying to complete a payment, you can start again from our product list.</p>
      <div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap;margin-top:1rem">
        <a href="./products.html" class="btn btn-outline">Browse Products</a>
        <a href="https://wa.me/${CONFIG.WHATSAPP_NUMBER}" target="_blank" rel="noopener" class="btn btn-whatsapp">WhatsApp Us</a>
      </div>
    </div>
  `;
}

/* ─── MERCHANT CANCELLATION EMAIL via Web3Forms ─── */

function emailSectionCancel(title, rows) {
  return `
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:16px;background:#f6f6f6;border-radius:8px;overflow:hidden;">
  <tr><td style="padding:12px 16px;background:#e8e8e8;font-family:Arial,sans-serif;font-size:14px;font-weight:700;color:#333;">${escapeHtml(title)}</td></tr>
  <tr><td style="padding:12px 16px;font-family:Arial,sans-serif;font-size:14px;color:#444;line-height:1.6;">${rows}</td></tr>
</table>`;
}
function emailRowCancel(label, value) {
  return `<div style="margin-bottom:8px;"><span style="color:#666;">${escapeHtml(label)}:</span> <strong style="color:#222;">${escapeHtml(String(value || '—'))}</strong></div>`;
}

function buildCancelEmailBodyHtml(order) {
  const totalAmount = getTotalAmount(order);
  const status = (order.status || 'cancelled').toUpperCase();
  return `
<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#eee;font-family:Arial,sans-serif;">
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#eee;"><tr><td style="padding:24px 16px;">
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
  <tr><td style="padding:24px 24px 16px;background:linear-gradient(135deg,#c0392b 0%,#a93226 100%);color:#fff;font-size:18px;font-weight:700;text-align:center;">Payment ${escapeHtml(status)} — ${escapeHtml(CONFIG.SITE_NAME)}</td></tr>
  <tr><td style="padding:20px 24px;">
${emailSectionCancel('Order details', [
  emailRowCancel('Product', order.productName),
  emailRowCancel('Description', order.productDescription || '—'),
  emailRowCancel('Amount', '₹' + totalAmount.toLocaleString('en-IN')),
  emailRowCancel('Status', order.status || 'cancelled'),
  emailRowCancel('Reason', order.errorReason || 'Not completed'),
].join(''))}
${emailSectionCancel('Customer (order placed by)', [
  emailRowCancel('Name', order.senderName),
  emailRowCancel('Phone', order.senderPhone),
  emailRowCancel('Email', order.senderEmail),
].join(''))}
${emailSectionCancel('Delivery (recipient & address)', [
  emailRowCancel('Recipient name', order.recipientName),
  emailRowCancel('Recipient phone', order.recipientPhone || '—'),
  emailRowCancel('Address', order.deliveryAddress + ', ' + order.deliveryCity + ' — ' + order.deliveryPincode),
  emailRowCancel('Preferred date', typeof formatDate === 'function' ? formatDate(order.deliveryDate) : order.deliveryDate),
  emailRowCancel('Urgent delivery', order.urgentDelivery ? 'Yes' : 'No'),
].join(''))}
${emailSectionCancel('Gift message', escapeHtml(order.giftMessage || '—'))}
${emailSectionCancel('Special instructions', escapeHtml(order.specialNote || '—'))}
  </td></tr>
  <tr><td style="padding:12px 24px;background:#f9f9f9;font-size:12px;color:#888;text-align:center;">${escapeHtml(CONFIG.SITE_NAME)} · Payment notification</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

function buildCancelEmailBody(order) {
  const totalAmount = getTotalAmount(order);
  return `
PAYMENT ${(order.status || 'cancelled').toUpperCase()} — ${CONFIG.SITE_NAME}
${'='.repeat(50)}

ORDER DETAILS
  Product:        ${order.productName}
  Description:    ${order.productDescription || '(none)'}
  Product Slug:   ${order.productSlug || '—'}
  Amount:         ₹${totalAmount.toLocaleString('en-IN')}
  Status:         ${order.status || 'cancelled'}
  Reason:         ${order.errorReason || 'Not completed'}

CUSTOMER (Order placed by — all details from form)
  Customer Name:   ${order.senderName}
  Customer Phone:  ${order.senderPhone}
  Customer Email:  ${order.senderEmail}

DELIVERY DETAILS (Recipient & address from form)
  Recipient Name:   ${order.recipientName}
  Recipient Phone:  ${order.recipientPhone || '—'}
  Address:          ${order.deliveryAddress}, ${order.deliveryCity} — ${order.deliveryPincode}
  Preferred Date:   ${typeof formatDate === 'function' ? formatDate(order.deliveryDate) : order.deliveryDate}
  Urgent Delivery:  ${order.urgentDelivery ? 'Yes' : 'No'}

GIFT MESSAGE (from form)
  ${order.giftMessage || '(none)'}

SPECIAL INSTRUCTIONS (from form)
  ${order.specialNote || '(none)'}

${'='.repeat(50)}
`.trim();
}

function buildCustomerCancelEmailHtml(order) {
  const siteName = escapeHtml(CONFIG.SITE_NAME);
  const name = escapeHtml(order.senderName);
  const product = escapeHtml(order.productName);
  const retryLink = getRetryLink(order);
  return `
<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#eee;font-family:Arial,sans-serif;">
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#eee;"><tr><td style="padding:32px 16px;">
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.1);">
  <tr><td style="padding:28px 24px;background:linear-gradient(135deg,#95a5a6 0%,#7f8c8d 100%);color:#fff;font-size:20px;font-weight:700;text-align:center;">😔 Oh, there was a problem with your purchase</td></tr>
  <tr><td style="padding:24px;">
    <p style="margin:0 0 16px;font-size:16px;color:#333;line-height:1.6;">Hi ${name},</p>
    <p style="margin:0 0 20px;font-size:15px;color:#444;line-height:1.6;">We could not complete your payment for <strong>${product}</strong>. No amount has been charged to your account.</p>
    <p style="margin:0 0 20px;font-size:15px;color:#444;line-height:1.6;">You can try again whenever you are ready, or contact us if you need help.</p>
    <p style="margin:20px 0 0;text-align:center;">
      <a href="${escapeHtml(retryLink)}" style="display:inline-block;padding:12px 24px;background:#c0392b;color:#fff;text-decoration:none;font-weight:600;border-radius:8px;font-size:15px;">Try again</a>
    </p>
  </td></tr>
  <tr><td style="padding:16px 24px;background:#f5f5f5;font-size:12px;color:#888;text-align:center;">${siteName} · Gifts delivered across Kerala</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

async function sendMerchantCancelEmail(order) {
  const keys = CONFIG.MERCHANT_ACCESS_KEYS || [];
  if (keys.length === 0 && (!CONFIG.WEB3FORMS_KEY || CONFIG.WEB3FORMS_KEY === 'YOUR_WEB3FORMS_ACCESS_KEY')) {
    return;
  }

  const emailBody = buildCancelEmailBodyHtml(order);
  const totalAmount = getTotalAmount(order);
  const subject = `Payment ${(order.status || 'cancelled').toUpperCase()}: ${order.productName} — ₹${totalAmount.toLocaleString('en-IN')}`;
  const payload = {
    subject,
    from_name: CONFIG.SITE_NAME,
    message: emailBody,
  };

  const accessKeys = keys.filter(Boolean).length ? keys.filter(Boolean) : [CONFIG.WEB3FORMS_KEY];

  try {
    const requests = accessKeys.map((key) =>
      fetch('https://api.web3forms.com/submit', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, access_key: key }),
      })
    );
    await Promise.all(requests);
  } catch (err) {
    console.error('Failed to send merchant cancellation email:', err);
  }
}

/* ─── CUSTOMER CANCELLATION EMAIL via EmailJS ───
 * Customer-friendly only: sad smiley, reassuring text. No Razorpay or internal error details.
 * In EmailJS template: use {{{ body_html }}} (triple braces) to render the HTML.
 */

function sendCustomerCancelEmail(order) {
  const publicKey = CONFIG.EMAILJS_PUBLIC_KEY;
  const serviceId = CONFIG.EMAILJS_SERVICE_ID;
  const templateId = CONFIG.EMAILJS_TEMPLATE_CANCELLED;

  if (!publicKey || publicKey === 'YOUR_EMAILJS_PUBLIC_KEY' ||
      !serviceId || serviceId === 'YOUR_EMAILJS_SERVICE_ID' ||
      !templateId || templateId === 'YOUR_TEMPLATE_ID') {
    return;
  }

  if (typeof emailjs === 'undefined') return;

  const retryLink = getRetryLink(order);

  const templateParams = {
    to_email:        order.senderEmail,
    to_name:         order.senderName,
    greeting:         'Oh, there was a problem with your purchase 😔',
    body_text:        'We could not complete your payment. No amount has been charged. You can try again whenever you are ready, or contact us if you need help.',
    product_name:    order.productName,
    retry_link:      retryLink,
    body_html:       buildCustomerCancelEmailHtml(order),
  };

  try {
    emailjs.init(publicKey);
    emailjs.send(serviceId, templateId, templateParams).catch((err) => {
      console.error('Failed to send customer cancellation email:', err);
    });
  } catch (err) {
    console.error('Failed to send customer cancellation email:', err);
  }
}
