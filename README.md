# Handmade By Bhumi — GitHub Pages Store

This repository provides a simple static e-commerce experience for Handmade By Bhumi (crochet store), built for GitHub Pages.

Features:
- Catalog of products with variations and multiple images
- Product page with dimensions, optional "customization preference" field, and related products
- Cart + Checkout: item costs + packing charge + delivery charge
- UPI payment flow that opens UPI apps via a deep link and shows QR code (UPI ID: bhumikhokhani-1@okdfcbank)
- Reviews per product (owner-editable in data/products.json; customers can add reviews saved to browser localStorage)
- Wishlist stored in localStorage
- Related products: owner can specify related product ids; otherwise auto-pick 3–5 products
- Simple configuration in assets/js/app.js and data/products.json

IMPORTANT: This is a static site. Real-time UPI payment verification requires a backend or a payment gateway. The checkout flow opens a UPI app (or displays a QR code) and the customer confirms payment by clicking "I have paid". This is a pragmatic approach without a server.

Deploy:
1. Put all files on the `main` branch of the GitHub repo named `handmadebybhumi`.
2. In repository Settings → Pages, enable GitHub Pages from `main` branch (root).
3. Your site will be at `https://handmadebybhumi.github.io`.

How to add or edit products:
- Edit `data/products.json`.
- Each product example is shown there. Important fields:
  - id: unique string
  - title, description, price
  - images: array of image paths relative to repo (put images in `assets/images/` or use external URLs)
  - variations: optional array e.g. sizes/colors
  - dimensions: { width, height, depth } in numbers (units you prefer, e.g. cm). Delivery charge uses the max dimension among purchased items.
  - related: optional array of product ids you want to recommend for this product

Packing & delivery rules:
- Packing charge and base behavior are in `assets/js/app.js` (easy to adjust).
- Delivery charge (current rule): maxDimension + 200 (as you requested "max item's size + Rs. 200"). If you prefer a per-cm multiplier, edit the calculation in app.js.

Reviews & persistence:
- Owner permanent reviews: include them in `data/products.json` -> `reviews` array.
- Customer-submitted reviews are saved to browser localStorage. If you want to persist customer reviews server-side, integrate a backend.

Payment:
- UPI ID used: bhumikhokhani-1@okdfcbank
- Checkout builds a UPI deep link to open UPI apps on mobile. If nothing opens, the page shows a QR code for scanning.
- After paying in their UPI app, customer clicks "I have paid" to complete the order.

If you'd like:
- I can add an admin UI to add/edit products (using a password and storing data to a gist or a lightweight serverless endpoint).
- Or I can wire a real payment gateway with server-side verification (requires hosting and credentials).

Enjoy! If you'd like me to push these files to the handmadebybhumi repo and enable Pages, please authorize GitHub access (or tell me to proceed) and I will publish the site immediately.