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
    <div class="success-icon" style="background:var(--color-error, #c0392b);color:#fff;">✕</div>
    <h1>${isFailed ? 'Payment Failed' : 'Payment Cancelled'}</h1>
    <p class="subtitle">
      ${escapeHtml(order.senderName || 'Customer')}, your payment was not completed.
      ${order.errorReason ? `<br><strong>Reason:</strong> ${escapeHtml(order.errorReason)}` : ''}
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

function buildCancelEmailBody(order) {
  return `
PAYMENT ${(order.status || 'cancelled').toUpperCase()} — ${CONFIG.SITE_NAME}
${'='.repeat(50)}

Product:     ${order.productName}
Amount:      ₹${(order.productPrice || 0).toLocaleString('en-IN')}
Status:      ${order.status || 'cancelled'}
Reason:      ${order.errorReason || 'Not completed'}

SENDER (Customer)
  Name:  ${order.senderName}
  Phone: ${order.senderPhone}
  Email: ${order.senderEmail}

Recipient:   ${order.recipientName}
Address:     ${order.deliveryAddress}, ${order.deliveryCity} — ${order.deliveryPincode}
Requested:   ${typeof formatDate === 'function' ? formatDate(order.deliveryDate) : order.deliveryDate}
${'='.repeat(50)}
`.trim();
}

async function sendMerchantCancelEmail(order) {
  const keys = CONFIG.MERCHANT_ACCESS_KEYS || [];
  if (keys.length === 0 && (!CONFIG.WEB3FORMS_KEY || CONFIG.WEB3FORMS_KEY === 'YOUR_WEB3FORMS_ACCESS_KEY')) {
    return;
  }

  const emailBody = buildCancelEmailBody(order);
  const subject = `Payment ${(order.status || 'cancelled').toUpperCase()}: ${order.productName} — ₹${(order.productPrice || 0).toLocaleString('en-IN')}`;
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

/* ─── CUSTOMER CANCELLATION EMAIL via EmailJS ─── */

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
    to_email:     order.senderEmail,
    to_name:      order.senderName,
    product_name: order.productName,
    amount:       formatPrice(getTotalAmount(order)),
    error_reason: order.errorReason || 'Payment was not completed',
    retry_link:   retryLink,
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
