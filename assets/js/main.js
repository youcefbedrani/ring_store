/* ============================================================
   ONTIME ECOM — Shared JS
   Sticky CTA • FAQ accordion • Lightbox • Form → Google Sheet
   Meta Pixel Lead event
   ============================================================ */

/* ---------- Configurable variables (edit these) ---------- */
const GOOGLE_SHEET_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbyhNiTSoA8RKsQzgh_eJAOxMgo8RbbRkqRNO_Lebljs74727OfweS2rLi_wnOuccVcgnQ/exec';
const PIXEL_ID = 'PIXEL_ID_HERE';

/* ---------- Meta Pixel (injected if PIXEL_ID is replaced) ---------- */
function loadPixel() {
  if (PIXEL_ID === 'PIXEL_ID_HERE' || !PIXEL_ID) return;
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

function firePixelLead(productName) {
  if (PIXEL_ID === 'PIXEL_ID_HERE' || !PIXEL_ID || typeof fbq === 'undefined') return;
  fbq('track', 'Lead', { content_name: productName });
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

/* ---------- Quantity stepper ---------- */
function initQtyStepper() {
  const stepper = document.querySelector('.qty-stepper');
  if (!stepper) return;
  const input = stepper.querySelector('input');
  const dec = stepper.querySelector('[data-dec]');
  const inc = stepper.querySelector('[data-inc]');
  const clamp = v => Math.max(1, Math.min(99, v));
  dec.addEventListener('click', () => input.value = clamp(+input.value - 1));
  inc.addEventListener('click', () => input.value = clamp(+input.value + 1));
  input.addEventListener('change', () => input.value = clamp(+input.value || 1));
}

/* ---------- Libyan phone validation ---------- */
function isValidLibyanPhone(phone) {
  const cleaned = phone.replace(/[\s\-]/g, '');
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
    msg.style.display = 'block';

    const phone = form.querySelector('[name="phone"]').value.trim();
    if (!isValidLibyanPhone(phone)) {
      msg.classList.add('err');
      msg.textContent = 'يرجى إدخال رقم هاتف ليبي صحيح (مثال: 0912345678)';
      return;
    }

    const payload = {
      product_name: productName,
      full_name: form.querySelector('[name="full_name"]').value.trim(),
      phone: phone,
      city: form.querySelector('[name="city"]').value.trim(),
      address: form.querySelector('[name="address"]').value.trim(),
      quantity: parseInt(form.querySelector('[name="quantity"]').value || '1', 10),
      notes: form.querySelector('[name="notes"]').value.trim(),
      submitted_at: new Date().toISOString()
    };

    submitBtn.disabled = true;
    submitBtn.textContent = 'جاري الإرسال...';

    try {
      const res = await fetch(GOOGLE_SHEET_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Network error');
      msg.classList.add('ok');
      msg.textContent = '✅ تم استلام طلبك بنجاح! سنتصل بك قريباً لتأكيد التوصيل.';
      form.reset();
      firePixelLead(productName);
    } catch (err) {
      msg.classList.add('err');
      msg.textContent = '⚠️ حدث خطأ في الإرسال. يرجى المحاولة مرة أخرى أو الاتصال بنا مباشرة.';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'أكّد الطلب الآن';
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
