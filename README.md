# OVERTIME ECOM — Libyan COD Landing Pages

Lightweight, mobile-first landing pages for Cash-on-Delivery orders in Libya.

## Quick start

1. **Images**: put optimized WebP images in `assets/images/product1/` and `assets/images/product2/`.
   - Product 1 (Ring): `hero.webp`, `g1.webp`–`g5.webp`
   - Product 2 (Key Holder): `hero.webp`, `g1.webp`–`g5.webp`
2. **Pixel ID**: replace `PIXEL_ID_HERE` in both `product1/index.html` and `product2/index.html` `<head>` sections.
3. **Google Sheet Webhook**: ✅ **Configured** — `https://script.google.com/macros/s/AKfycbyhNiTSoA8RKsQzgh_eJAOxMgo8RbbRkqRNO_Lebljs74727OfweS2rLi_wnOuccVcgnQ/exec` (linked to Sheet: `14zFYs6dnCHvvgZjI20MYVdN5lluUFI0Vj4L7-xeQ7_s`)
4. **Prices & stock**: edit the price spans and `data-stock-left` values in each product HTML file.
5. **Contact info**: update phone number, WhatsApp link, and email in both product pages and `index.html`.
6. **Deploy**: push to GitHub and connect repo to Render.com Static Site, or use `render.yaml`.

## Deploy on Render.com (FREE)

1. Push this folder to a GitHub repo.
2. In Render dashboard → **New** → **Static Site**.
3. Connect repo, set **Build Command** to `echo "No build step needed"` (or leave blank).
4. Set **Publish Directory** to `/` (root).
5. Or simply upload `render.yaml` with your repo — Render will auto-detect it.

## Edit prices / offer text

Search for the price spans in each product page:
- `data-sale-price` / `data-original-price` (hero)
- `data-sale-price-total` (form total)
- `data-sale-price-sticky` / `data-original-price-sticky` (bottom CTA)

The urgency block also contains inline prices and `data-stock-left` — edit those directly.

## Google Sheet Webhook setup

1. Create a Google Sheet with columns: `product_name`, `full_name`, `phone`, `city`, `address`, `quantity`, `notes`, `submitted_at`.
2. Apps Script → New project → paste doPost handler that writes JSON payload to sheet.
3. Deploy → New deployment → Web app → Execute as: Me → Who has access: Anyone.
4. Copy the Web App URL into `assets/js/main.js` (`GOOGLE_SHEET_WEBHOOK_URL`).

## Structure

```
/
├── index.html
├── product1/index.html
├── product2/index.html
├── assets/
│   ├── css/style.css
│   ├── js/main.js
│   └── images/
│       ├── product1/...
│       └── product2/...
├── render.yaml
└── README.md
```

## Redeploy

- Any push to the connected branch triggers a new Render deploy automatically.
- For manual redeploy: Render dashboard → your site → **Manual Deploy**.
