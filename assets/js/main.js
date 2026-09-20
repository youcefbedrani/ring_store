/* ============================================================
   ONTIME ECOM — Shared JS
   Sticky CTA • FAQ accordion • Lightbox • Form → Google Sheet
   Meta Pixel Purchase event (browser + CAPI, deduplicated)
   ============================================================ */

/* ---------- Configurable variables (edit these) ---------- */
const GOOGLE_SHEET_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbyRg-g6PzdDgThndMEd5x1wKsZtRmFApkF308avmGFacMhn5002URGkt1RUgX24n5ArUQ/exec';
const PIXEL_ID = '27911627961853086';
const CAPI_ACCESS_TOKEN = 'EAATzTbBM3VgBSRdDk8eX3ao56N74n1QeCtVc0ZCT8a9EmWwWnw7ds1normTJkLrKDpWbKNjGQ5AS4HqkZBGHGMUFKqP8cPVMRZC7ideiJABzNVjrABr9HEWMk0cxwwX2x2KiRv7PZBjMQxZCql1pu7DWYDzLeS3ZAxmFo4lB928fqydTjgJEQ7EwqvfndngfP6tAZDZD';

/* ---------- Meta Pixel (injected if PIXEL_ID is replaced) ---------- */
function loadPixel() {
  if (PIXEL_ID === 'PIXEL_ID_HERE' || !PIXEL_ID) return;
  if (window.fbq && window.fbq.loaded) return;
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', PIXEL_ID);
  fbq('track', 'PageView');
}

function firePixelPurchase(productName, eventId, value, quantity) {
  if (PIXEL_ID === 'PIXEL_ID_HERE' || !PIXEL_ID || typeof fbq === 'undefined') return;
  const leadData = {
    content_name: productName,
    content_type: 'product',
    contents: [{ id: productName, quantity: quantity || 1 }],
    num_items: quantity || 1,
    currency: 'LYD',
    value: value || 167
  };
  if (eventId) {
    fbq('track', 'Purchase', leadData, { eventID: eventId });
  } else {
    fbq('track', 'Purchase', leadData);
  }
}

/* ---------- Conversions API (server-side) ---------- */
async function fireCAPIEvent(userData, customData, eventId) {
  try {
    const [emHash, phHash, fnHash, lnHash, ctHash] = await Promise.all([
      hashString(userData.email || ''),
      hashString(userData.phone || ''),
      hashString(userData.firstName || ''),
      hashString(userData.lastName || ''),
      hashString(userData.city || '')
    ]);

    const eventItem = {
      event_name: 'Purchase',
      event_time: Math.floor(Date.now() / 1000),
      action_source: 'website',
      event_source_url: location.href,
      user_data: {
        em: emHash ? [emHash] : [],
        ph: phHash ? [phHash] : [],
        fn: fnHash ? [fnHash] : [],
        ln: lnHash ? [lnHash] : [],
        ct: ctHash ? [ctHash] : []
      },
      custom_data: customData || {},
      original_event_data: {
        event_name: 'Purchase',
        event_time: Math.floor(Date.now() / 1000)
      }
    };
    if (eventId) eventItem.event_id = eventId;

    const payload = { data: [eventItem] };

    await fetch(`https://graph.facebook.com/v21.0/${PIXEL_ID}/events?access_token=${CAPI_ACCESS_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.debug('CAPI error:', err);
  }
}

/* SHA-256 hash for user data (required by Facebook CAPI) */
async function hashString(str) {
  if (!str) return '';
  const encoder = new TextEncoder();
  const data = encoder.encode(str.trim().toLowerCase());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/* ---------- Sticky bottom CTA ---------- */
function initStickyCta() {
  const cta = document.querySelector('.sticky-cta');
  if (!cta) return;
  const hero = document.querySelector('.hero');
  if (!hero) return;
  const triggerPoint = hero.offsetHeight - 80;
  const onScroll = () => {
    if (window.scrollY > triggerPoint) cta.classList.add('show');
    else cta.classList.remove('show');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  const jumpBtn = cta.querySelector('[data-jump]');
  if (jumpBtn) jumpBtn.addEventListener('click', () => {
    const target = document.querySelector(jumpBtn.dataset.jump);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

/* ---------- FAQ accordion ---------- */
function initFaq() {
  document.querySelectorAll('.faq-q').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.parentElement;
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(openItem => {
        openItem.classList.remove('open');
        openItem.querySelector('.faq-a').style.maxHeight = '0';
      });
      if (!isOpen) {
        item.classList.add('open');
        const answer = item.querySelector('.faq-a');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });
}

/* ---------- Lightbox ---------- */
function initLightbox() {
  const lb = document.querySelector('.lightbox');
  if (!lb) return;
  const img = lb.querySelector('img');
  const closeBtn = lb.querySelector('.close');
  document.querySelectorAll('.gallery img').forEach(el => {
    el.addEventListener('click', () => {
      img.src = el.src;
      lb.classList.add('open');
    });
  });
  const close = () => lb.classList.remove('open');
  closeBtn.addEventListener('click', close);
  lb.addEventListener('click', e => { if (e.target === lb) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
}

/* ---------- Quantity stepper & price calculation ---------- */
function getUnitPrice() {
  const priceEl = document.querySelector('[data-sale-price]');
  if (priceEl) {
    const num = parseInt(priceEl.textContent.replace(/[^\d]/g, ''), 10);
    if (!isNaN(num) && num > 0) return num;
  }
  return 167;
}

function updateOrderTotal() {
  const qtyInput = document.getElementById('quantity');
  const totalSpan = document.querySelector('[data-sale-price-total]');
  if (qtyInput && totalSpan) {
    const qty = parseInt(qtyInput.value, 10) || 1;
    totalSpan.textContent = (qty * getUnitPrice()).toString();
  }
}

function initQtyStepper() {
  const stepper = document.querySelector('.qty-stepper');
  if (!stepper) return;
  const input = stepper.querySelector('input');
  const dec = stepper.querySelector('[data-dec]');
  const inc = stepper.querySelector('[data-inc]');
  const clamp = v => Math.max(1, Math.min(99, v));
  dec.addEventListener('click', () => { input.value = clamp(+input.value - 1); updateOrderTotal(); });
  inc.addEventListener('click', () => { input.value = clamp(+input.value + 1); updateOrderTotal(); });
  input.addEventListener('change', () => { input.value = clamp(+input.value || 1); updateOrderTotal(); });
}

/* ---------- Libyan phone normalization & validation ---------- */
function normalizeArabicNumerals(str) {
  return (str || '').replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
}

function normalizeLibyanPhone(phone) {
  let cleaned = normalizeArabicNumerals(phone).replace(/[\s\-\(\)\.]/g, '');
  if (cleaned.startsWith('00218')) cleaned = '+218' + cleaned.slice(5);
  else if (cleaned.startsWith('218')) cleaned = '+218' + cleaned.slice(3);
  return cleaned;
}

function isValidLibyanPhone(phone) {
  const cleaned = normalizeLibyanPhone(phone);
  return /^(?:\+218|0)?(?:91|92|93|94|95|96|97|98|99)\d{7}$/.test(cleaned);
}

/* ---------- Order form handler ---------- */
async function initOrderForm(productName) {
  const form = document.getElementById('order-form');
  if (!form) return;
  const msg = form.querySelector('.form-msg');
  const submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', async e => {
    e.preventDefault();
    msg.className = 'form-msg';
    msg.style.display = 'none';

    const fullName = form.querySelector('[name="full_name"]')?.value.trim() || '';
    const rawPhone = form.querySelector('[name="phone"]')?.value.trim() || '';
    const city = form.querySelector('[name="city"]')?.value.trim() || '';
    const address = form.querySelector('[name="address"]')?.value.trim() || '';
    const quantity = parseInt(form.querySelector('[name="quantity"]')?.value || '1', 10);
    const notes = form.querySelector('[name="notes"]')?.value.trim() || '';

    if (!fullName) {
      msg.className = 'form-msg err';
      msg.style.display = 'block';
      msg.textContent = 'يرجى إدخال الاسم الكامل.';
      return;
    }

    if (!isValidLibyanPhone(rawPhone)) {
      msg.className = 'form-msg err';
      msg.style.display = 'block';
      msg.textContent = 'يرجى إدخال رقم هاتف ليبي صحيح (مثال: 0912345678).';
      return;
    }

    if (!city) {
      msg.className = 'form-msg err';
      msg.style.display = 'block';
      msg.textContent = 'يرجى إدخال المدينة.';
      return;
    }

    if (!address) {
      msg.className = 'form-msg err';
      msg.style.display = 'block';
      msg.textContent = 'يرجى إدخال العنوان بالتفصيل.';
      return;
    }

    const phone = normalizeLibyanPhone(rawPhone);
    const unitPrice = getUnitPrice();
    const totalPrice = quantity * unitPrice;

    const payload = {
      product_name: productName,
      full_name: fullName,
      phone: phone,
      city: city,
      address: address,
      quantity: quantity,
      total_price: totalPrice + ' LYD',
      notes: notes,
      submitted_at: new Date().toISOString()
    };

    const submitLabel = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'جاري الإرسال...';

    try {
      const res = await fetch(GOOGLE_SHEET_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Network error');

      msg.className = 'form-msg ok';
      msg.style.display = 'block';
      msg.textContent = '✅ تم استلام طلبك بنجاح! سنتصل بك قريباً لتأكيد التوصيل.';
      form.reset();
      updateOrderTotal();

      /* Generate unique eventID for deduplication */
      const eventId = 'purchase_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);

      /* Browser Pixel */
      firePixelPurchase(productName, eventId, totalPrice, quantity);

      /* Server-side CAPI event */
      const nameParts = fullName.split(' ');
      fireCAPIEvent(
        {
          phone: phone,
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          city: city
        },
        { content_name: productName, content_type: 'product', num_items: quantity, currency: 'LYD', value: totalPrice },
        eventId
      );
    } catch (err) {
      msg.className = 'form-msg err';
      msg.style.display = 'block';
      msg.textContent = '⚠️ حدث خطأ في الإرسال. يرجى المحاولة مرة أخرى أو الاتصال بنا مباشرة.';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = submitLabel;
    }
  });
}

/* ---------- Boot ---------- */
document.addEventListener('DOMContentLoaded', () => {
  loadPixel();
  initStickyCta();
  initFaq();
  initLightbox();
  initQtyStepper();
  const prodField = document.querySelector('input[name="product_name"]');
  if (prodField && prodField.value) initOrderForm(prodField.value);
});
