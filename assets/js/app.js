// app.js — main JS for Handmade By Bhumi static site
// Usage: Include this script on each page. It fetches products from data/products.json
// and manages cart, wishlist, reviews (localStorage), and checkout UPI flow.

// CONFIG
const STORE = {
  name: 'Handmade By Bhumi',
  upiId: 'bhumikhokhani-1@okdfcbank',
  packingCharge: 50,            // fixed packing charge in INR (adjustable)
  // Delivery rule: deliveryCharge = maxDimension + deliveryBase
  deliveryBase: 200
};

const app = (function(){
  // in-memory products
  let products = [];

  async function loadProducts(){
    const res = await fetch('data/products.json');
    const data = await res.json();
    products = data.products || [];
    return products;
  }

  // utils
  function formatCurrency(n){ return `₹${n.toFixed(0)}`; }

  function findProduct(id){ return products.find(p => p.id === id); }

  // CATALOG
  async function initCatalog(){
    await loadProducts();
    const el = document.getElementById('catalog');
    if(!el) return;
    el.innerHTML = '';
    products.forEach(p => {
      const card = document.createElement('div');
      card.className = 'card';
      const img = document.createElement('img');
      img.src = p.images && p.images[0] ? p.images[0] : '';
      img.alt = p.title;
      const h = document.createElement('h3');
      h.textContent = p.title;
      const d = document.createElement('div');
      d.className = 'meta small';
      d.textContent = p.description;
      const price = document.createElement('div');
      price.className = 'price';
      price.textContent = formatCurrency(p.price);
      const row = document.createElement('div');
      row.className = 'row';
      const view = document.createElement('a');
      view.className = 'btn';
      view.href = `product.html?id=${encodeURIComponent(p.id)}`;
      view.textContent = 'View';
      const wishlistBtn = document.createElement('button');
      wishlistBtn.className = 'btn secondary';
      wishlistBtn.textContent = '♥';
      wishlistBtn.onclick = () => {
        toggleWishlist(p.id);
        updateWishlistCount();
      };
      row.appendChild(view);
      row.appendChild(wishlistBtn);

      card.appendChild(img);
      card.appendChild(h);
      card.appendChild(d);
      card.appendChild(price);
      card.appendChild(row);
      el.appendChild(card);
    });
  }

  // PRODUCT PAGE
  async function initProductPage(id){
    await loadProducts();
    const p = findProduct(id);
    const root = document.getElementById('product-root');
    if(!p){ root.innerHTML = '<p>Product not found.</p>'; return; }
    const container = document.createElement('div');

    const title = document.createElement('h1'); title.textContent = p.title;
    const gallery = document.createElement('div'); gallery.className = 'gallery';
    (p.images || []).forEach(src => {
      const img = document.createElement('img'); img.src = src; img.alt = p.title;
      gallery.appendChild(img);
    });
    const desc = document.createElement('p'); desc.className='meta'; desc.textContent = p.description;
    const dims = document.createElement('div');
    dims.className='small';
    dims.textContent = `Dimensions (W×H×D): ${p.dimensions.width} × ${p.dimensions.height} × ${p.dimensions.depth}`;
    const price = document.createElement('div'); price.className='price'; price.textContent = formatCurrency(p.price);

    // variations
    const form = document.createElement('div');
    form.className = 'card';
    (p.variations || []).forEach(v => {
      const lab = document.createElement('div'); lab.className = 'label'; lab.textContent = v.name;
      const sel = document.createElement('select'); sel.name = `var-${v.name}`;
      v.options.forEach(opt => {
        const o = document.createElement('option'); o.value = opt; o.textContent = opt;
        sel.appendChild(o);
      });
      form.appendChild(lab); form.appendChild(sel);
    });

    // customization optional
    const labCust = document.createElement('div'); labCust.className='label'; labCust.textContent = 'Customization (optional)';
    const custNote = document.createElement('textarea'); custNote.placeholder = 'Any customization preferences? (We will try our best to follow.)';
    form.appendChild(labCust); form.appendChild(custNote);

    const qtyLabel = document.createElement('div'); qtyLabel.className='label'; qtyLabel.textContent='Quantity';
    const qty = document.createElement('input'); qty.type='number'; qty.min='1'; qty.value='1';
    form.appendChild(qtyLabel); form.appendChild(qty);

    const addToCartBtn = document.createElement('button'); addToCartBtn.className='btn'; addToCartBtn.textContent='Add to cart';
    addToCartBtn.onclick = () => {
      const selectedVars = {};
      (p.variations || []).forEach((v, idx) => {
        const sel = form.querySelectorAll('select')[idx];
        selectedVars[v.name] = sel ? sel.value : v.options[0];
      });
      addToCart({
        productId: p.id,
        title: p.title,
        price: p.price,
        qty: Number(qty.value),
        variations: selectedVars,
        customization: custNote.value || ''
      });
      alert('Added to cart');
      location.href = 'checkout.html';
    };

    const wishlistBtn = document.createElement('button'); wishlistBtn.className='btn secondary'; wishlistBtn.textContent='Add to wishlist';
    wishlistBtn.onclick = () => { toggleWishlist(p.id); updateWishlistCount(); };

    // reviews
    const reviewsRoot = document.createElement('div');
    reviewsRoot.className = 'card';
    const revTitle = document.createElement('h3'); revTitle.textContent = 'Customer Reviews';
    reviewsRoot.appendChild(revTitle);

    function renderReviews(){
      reviewsRoot.querySelectorAll('.review').forEach(n => n.remove());
      const allReviews = getProductReviews(p.id);
      if(allReviews.length===0){
        const none = document.createElement('div'); none.className='small'; none.textContent='No reviews yet.';
        reviewsRoot.appendChild(none);
      } else {
        allReviews.forEach(r => {
          const rdiv = document.createElement('div'); rdiv.className='review';
          rdiv.innerHTML = `<strong>${r.name || 'Anonymous'}</strong> — ${'★'.repeat(r.rating)}<div class="small">${r.text || ''}</div><div class="small">${r.date || ''}</div>`;
          reviewsRoot.appendChild(rdiv);
        });
      }
    }

    // review form
    const reviewForm = document.createElement('div');
    const rName = document.createElement('input'); rName.placeholder='Your name (optional)';
    const rRating = document.createElement('select'); [5,4,3,2,1].forEach(n => { const o = document.createElement('option'); o.value=n; o.textContent=`${n} ★`; rRating.appendChild(o); });
    const rText = document.createElement('textarea'); rText.placeholder='Write a review';
    const rBtn = document.createElement('button'); rBtn.className='btn'; rBtn.textContent='Submit review';
    rBtn.onclick = () => {
      const rv = { name: rName.value||'Guest', rating: Number(rRating.value), text: rText.value, date: new Date().toISOString().split('T')[0] };
      saveProductReview(p.id, rv);
      rName.value=''; rRating.value='5'; rText.value='';
      renderReviews();
    };
    reviewForm.appendChild(rName); reviewForm.appendChild(rRating); reviewForm.appendChild(rText); reviewForm.appendChild(rBtn);

    // related products
    const relatedRoot = document.createElement('div');
    relatedRoot.className='card';
    const relTitle = document.createElement('h3'); relTitle.textContent='Related Products';
    relatedRoot.appendChild(relTitle);

    // build product markup
    container.appendChild(title);
    container.appendChild(gallery);
    container.appendChild(price);
    container.appendChild(desc);
    container.appendChild(dims);
    container.appendChild(form);
    container.appendChild(addToCartBtn);
    container.appendChild(wishlistBtn);
    container.appendChild(reviewsRoot);
    container.appendChild(reviewForm);
    container.appendChild(relatedRoot);
    root.appendChild(container);

    // initial review render
    renderReviews();

    // related product rendering
    let relatedIds = (p.related || []).filter(Boolean);
    if(relatedIds.length === 0){
      // auto-pick 3-5 other products
      const others = products.filter(pp => pp.id !== p.id);
      // random pick
      shuffleArray(others);
      relatedIds = others.slice(0, Math.min(5, others.length)).map(o => o.id);
    }
    const relDiv = document.createElement('div'); relDiv.className='related';
    relatedIds.forEach(rid=>{
      const rp = findProduct(rid);
      if(!rp) return;
      const c = document.createElement('div'); c.className='card';
      c.style.minWidth='150px';
      const im = document.createElement('img'); im.src = rp.images[0] || ''; im.style.height='100px'; im.style.objectFit='cover';
      const t = document.createElement('div'); t.textContent = rp.title;
      const pr = document.createElement('div'); pr.className='price'; pr.textContent = formatCurrency(rp.price);
      const a = document.createElement('a'); a.href=`product.html?id=${encodeURIComponent(rp.id)}`; a.className='btn'; a.textContent='View';
      c.appendChild(im); c.appendChild(t); c.appendChild(pr); c.appendChild(a);
      relDiv.appendChild(c);
    });
    relatedRoot.appendChild(relDiv);
  }

  // CART FUNCTIONS (uses localStorage)
  const CART_KEY = 'hb_cart_v1';
  function getCart(){ return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
  function saveCart(cart){ localStorage.setItem(CART_KEY, JSON.stringify(cart)); }
  function addToCart(item){
    const cart = getCart();
    cart.push(item);
    saveCart(cart);
  }
  function clearCart(){ localStorage.removeItem(CART_KEY); }

  // WISHLIST
  const WISH_KEY = 'hb_wishlist_v1';
  function getWishlist(){ return JSON.parse(localStorage.getItem(WISH_KEY) || '[]'); }
  function toggleWishlist(productId){
    const wl = getWishlist();
    const idx = wl.indexOf(productId);
    if(idx === -1) wl.push(productId); else wl.splice(idx,1);
    localStorage.setItem(WISH_KEY, JSON.stringify(wl));
    alert('Wishlist updated');
  }
  function updateWishlistCount(){
    const el = document.getElementById('wishlist-count');
    if(el) el.textContent = getWishlist().length;
  }

  // WISHLIST PAGE
  async function initWishlist(){
    await loadProducts();
    const root = document.getElementById('wishlist-root');
    const ids = getWishlist();
    root.innerHTML = '';
    if(!ids.length){ root.innerHTML = '<p>Your wishlist is empty.</p>'; return; }
    ids.forEach(id => {
      const p = findProduct(id);
      if(!p) return;
      const c = document.createElement('div');
      c.className='card';
      const im = document.createElement('img');
      im.src = p.images[0];
      im.style.width='120px';
      im.style.height='120px';
      im.style.objectFit='cover';
      const t = document.createElement('div');
      t.innerHTML = `<strong>${p.title}</strong><div class="small">${p.description}</div><div class="price">${formatCurrency(p.price)}</div>`;
      const remove = document.createElement('button');
      remove.className='btn secondary';
      remove.textContent='Remove';
      remove.onclick = () => { toggleWishlist(p.id); initWishlist(); updateWishlistCount(); };
      const view = document.createElement('a');
      view.className='btn';
      view.href=`product.html?id=${encodeURIComponent(p.id)}`;
      view.textContent='View';
      c.appendChild(im);
      c.appendChild(t);
      c.appendChild(view);
      c.appendChild(remove);
      root.appendChild(c);
    });
  }

  // REVIEWS (localStorage fallback)
  const REV_KEY = 'hb_reviews_v1';
  function getAllLocalReviews(){ return JSON.parse(localStorage.getItem(REV_KEY) || '{}'); }
  function saveAllLocalReviews(obj){ localStorage.setItem(REV_KEY, JSON.stringify(obj)); }
  function getProductReviews(productId){
    const local = getAllLocalReviews();
    const fromOwner = (findProduct(productId) && findProduct(productId).reviews) || [];
    return [...fromOwner, ...(local[productId] || [])];
  }
  function saveProductReview(productId, review){
    const local = getAllLocalReviews();
    if(!local[productId]) local[productId] = [];
    local[productId].push(review);
    saveAllLocalReviews(local);
  }

  // CHECKOUT
  async function initCheckout(){
    await loadProducts();
    const root = document.getElementById('checkout-root');
    const cart = getCart();
    if(cart.length === 0){
      root.innerHTML = '<p>Your cart is empty. <a href="index.html">Continue shopping</a></p>';
      return;
    }
    root.innerHTML = '';
    // list items
    const list = document.createElement('div'); list.className='card';
    let subtotal = 0;
    cart.forEach((it, idx) => {
      const p = findProduct(it.productId) || {};
      const itemRow = document.createElement('div'); itemRow.className='row';
      itemRow.innerHTML = `<div style="flex:1"><strong>${it.title}</strong><div class="small">${JSON.stringify(it.variations)}</div><div class="small">${it.customization ? 'Customization: ' + it.customization : ''}</div></div><div>${formatCurrency(it.price)} × ${it.qty}</div>`;
      list.appendChild(itemRow);
      subtotal += it.price * it.qty;
    });
    root.appendChild(list);

    // buyer info & optional note
    const form = document.createElement('div'); form.className='card';
    form.innerHTML = `
      <div class="label">Name</div><input id="buyer-name" placeholder="Your name" />
      <div class="label">Phone</div><input id="buyer-phone" placeholder="Phone" />
      <div class="label">Shipping address</div><textarea id="buyer-address" placeholder="Address"></textarea>
      <div class="label">Optional note for seller</div><textarea id="buyer-note" placeholder="Any note (optional)"></textarea>
    `;
    root.appendChild(form);

    // charges
    const charges = document.createElement('div'); charges.className='card';
    const packing = STORE.packingCharge;
    const maxDimension = computeMaxDimensionForCart(cart);
    const delivery = maxDimension + STORE.deliveryBase; // per your "max item's size + Rs. 200"
    const total = subtotal + packing + delivery;
    charges.innerHTML = `
      <div><strong>Subtotal:</strong> ${formatCurrency(subtotal)}</div>
      <div><strong>Packing charge:</strong> ${formatCurrency(packing)}</div>
      <div><strong>Delivery charge (max item dimension ${maxDimension} + base ${STORE.deliveryBase}):</strong> ${formatCurrency(delivery)}</div>
      <div style="margin-top:8px;font-size:1.2rem"><strong>Total: ${formatCurrency(total)}</strong></div>
    `;
    root.appendChild(charges);

    // pay button + UPI flow
    const payCard = document.createElement('div'); payCard.className='card';
    const payBtn = document.createElement('button'); payBtn.className='btn'; payBtn.textContent='Pay with UPI';
    const upiNote = document.createElement('div'); upiNote.className='small'; upiNote.style.marginTop='8px';
    const qrImg = document.createElement('img'); qrImg.style.display='none'; qrImg.alt='UPI QR';
    payCard.appendChild(payBtn); payCard.appendChild(upiNote); payCard.appendChild(qrImg);
    root.appendChild(payCard);

    payBtn.onclick = () => {
      const name = document.getElementById('buyer-name').value || 'Customer';
      const phone = document.getElementById('buyer-phone').value || '';
      const address = document.getElementById('buyer-address').value || '';
      // simple validation
      if(!address){
        alert('Please provide a shipping address.');
        return;
      }
      // Build UPI link
      const amount = total.toFixed(2);
      const upiLink = buildUpiLink({ pa: STORE.upiId, pn: STORE.name, am: amount, tn: `Order from ${STORE.name} - ${name}` });
      // show instruction and try to open UPI
      upiNote.innerHTML = `A UPI app should open on your device. If it doesn't, scan the QR code below or use the UPI ID: <strong>${STORE.upiId}</strong>. After paying, click 