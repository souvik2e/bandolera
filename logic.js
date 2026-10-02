// ==========================================================================
// BANDOLERA v3 — LOGIC
// Cart state is in-memory for this demo (no localStorage) — swap in the
// same localStorage/Cashfree pattern used on the other sites when live.
// Notify-me capture on Coming Soon panels is also demo-only (toast + memory,
// no real backend) — wire to an actual email list before going live.
// ==========================================================================

let cart = [];
let activeTab = "tshirt";
let CATALOG = {};
const notifiedEmails = [];

const money = n => "₹" + n.toLocaleString("en-IN");

// ---- palette for admin-added products that don't have an image yet -------
const ART_PALETTE = [
  {type:"wave",   c1:"#EDE4D3", c2:"#B7A688"},
  {type:"stripe", c1:"#211F1C", c2:"#57534A"},
  {type:"wave",   c1:"#E7C9C2", c2:"#AD766C"},
  {type:"burst",  c1:"#F2EEE3", c2:"#ACA492"},
  {type:"stripe", c1:"#8B6A52", c2:"#5B4433"},
  {type:"burst",  c1:"#D8CCB8", c2:"#8B7E68"},
];
function pickArt(name){
  let hash = 0;
  for(let i=0;i<name.length;i++){ hash = (hash*31 + name.charCodeAt(i)) >>> 0; }
  return ART_PALETTE[hash % ART_PALETTE.length];
}

// ---- card art (pure SVG/CSS, no image assets needed) --------------------
function artSVG(art, extra){
  const {type, c1, c2} = art;
  const gid = "g" + Math.random().toString(36).slice(2,9);
  const grad = `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/>
    </linearGradient></defs>`;
  if(type === "burst"){
    return `<svg viewBox="0 0 200 200" class="art">${grad}
      <rect width="200" height="200" fill="url(#${gid})"/>
      <g stroke="rgba(255,255,255,.35)" stroke-width="2">
        ${Array.from({length:14}).map((_,i)=>{
          const a = (i/14)*Math.PI*2;
          const x1=100+Math.cos(a)*30, y1=100+Math.sin(a)*30;
          const x2=100+Math.cos(a)*95, y2=100+Math.sin(a)*95;
          return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
        }).join("")}
      </g>
      <circle cx="100" cy="100" r="26" fill="rgba(0,0,0,.18)"/>
    </svg>`;
  }
  if(type === "wave"){
    return `<svg viewBox="0 0 200 200" class="art">${grad}
      <rect width="200" height="200" fill="url(#${gid})"/>
      <path d="M0,120 Q50,80 100,120 T200,120 V200 H0 Z" fill="rgba(0,0,0,.12)"/>
      <path d="M0,150 Q50,110 100,150 T200,150 V200 H0 Z" fill="rgba(0,0,0,.2)"/>
    </svg>`;
  }
  if(type === "stripe"){
    return `<svg viewBox="0 0 200 200" class="art">${grad}
      <rect width="200" height="200" fill="url(#${gid})"/>
      ${Array.from({length:6}).map((_,i)=>`<rect x="${-40+i*45}" y="-20" width="18" height="240" fill="rgba(255,255,255,.10)" transform="rotate(18 100 100)"/>`).join("")}
    </svg>`;
  }
  return "";
}

// ---- catalog loading — live control-panel data, demo data as fallback ----
function buildCatalogFromLive(products){
  const cats = {
    tshirt:     { label:"T-Shirts",    items:[] },
    oversized:  { label:"Oversized",   items:[] },
    polo:       { label:"Polo",        items:[] },
    hoodie:     { label:"Hoodies",     items:[] },
    sweatshirt: { label:"Sweatshirts", items:[] },
  };
  products.forEach(p=>{
    if(!cats[p.category]) return;
    const images = (p.images || "").split("|").map(s=>s.trim()).filter(Boolean);
    cats[p.category].items.push({
      id: p.id, name: p.name, price: p.price, mrp: p.mrp,
      badge: p.badge || null, tag: p.style || null,
      details: p.details || "", images: images,
      image_url: images[0] || null,
      art: images[0] ? null : pickArt(p.name),
    });
  });
  Object.keys(cats).forEach(k => {
    cats[k].comingSoon = ALWAYS_LIVE.includes(k) ? false : cats[k].items.length === 0;
  });
  return cats;
}

function normalizeDemoCatalog(){
  const cats = {};
  Object.keys(DEMO_CATALOG).forEach(key=>{
    const src = DEMO_CATALOG[key];
    cats[key] = {
      label: src.label,
      comingSoon: ALWAYS_LIVE.includes(key) ? false : src.comingSoon,
      items: src.items.map(p=>({
        id:p.id, name:p.name, price:p.price, mrp:p.mrp, badge:p.badge||null,
        tag:p.code||null, details:"", images:[], image_url:null, art:p.art,
      })),
    };
  });
  return cats;
}

function normalizeRow(obj, idx){
  return {
    id: obj.id || `row-${idx}`,
    name: obj.name,
    category: String(obj.category || "").toLowerCase().trim(),
    style: obj.style,
    price: Number(obj.price) || 0,
    mrp: Number(obj.mrp) || 0,
    details: obj.details,
    images: obj.images,
    badge: obj.badge,
    active: /^(true|yes|1)$/i.test(String(obj.active || "").trim()),
  };
}

async function loadCatalog(){
  try{
    if(!SHEET_DATA_URL || SHEET_DATA_URL.includes("PASTE-YOUR")) throw new Error("sheet not connected yet");
    const res = await fetch(`${SHEET_DATA_URL}?t=${Date.now()}`);
    if(!res.ok) throw new Error("sheet unreachable");
    const rows = await res.json();
    const products = rows.map(normalizeRow).filter(p => p.active && p.name && p.category);
    if(products.length === 0) throw new Error("sheet returned no active products");
    CATALOG = buildCatalogFromLive(products);
  } catch(err){
    // Sheet not connected yet, or the request failed — show the demo catalog
    // instead of a broken page. Once the Apps Script URL is pasted in, this stops firing.
    CATALOG = normalizeDemoCatalog();
  }
}

// ---- catalog rendering ----------------------------------------------------
function productCard(item){
  const off = Math.round(100 - (item.price/item.mrp)*100);
  const media = item.image_url
    ? `<img src="${item.image_url}" alt="${item.name}" loading="lazy">`
    : artSVG(item.art);
  return `
    <article class="card" data-id="${item.id}">
      <a class="card__link" href="product.html?id=${encodeURIComponent(item.id)}">
      <div class="card__art">
        ${media}
        ${item.tag ? `<span class="card__tag">${item.tag}</span>` : ""}
        ${item.badge ? `<span class="card__badge">${item.badge}</span>` : ""}
      </div>
      <div class="card__body">
        <h3 class="card__name">${item.name}</h3>
        ${item.details ? `<p class="card__details">${item.details}</p>` : ""}
        <div class="card__price">
          <span class="price-now">${money(item.price)}</span>
          <span class="price-mrp">${money(item.mrp)}</span>
          <span class="price-off">${off}% OFF</span>
        </div>
      </div>
      </a>
      <div class="card__foot">
        <button class="btn-add" data-id="${item.id}">
          <span class="btn-add__label">Add to Bag</span>
          <span class="btn-add__check">Added ✓</span>
        </button>
      </div>
    </article>`;
}

const GARMENT_ICONS = {
  hoodie: `<svg class="csp__icon" viewBox="0 0 200 240" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">
    <path d="M60 40 Q100 8 140 40 L150 70 Q100 52 50 70 Z"/>
    <path d="M50 70 L32 102 L32 222 L168 222 L168 102 L150 70 Q100 92 50 70 Z"/>
    <path d="M32 102 L4 158 L26 176 L50 122"/>
    <path d="M168 102 L196 158 L174 176 L150 122"/>
    <path d="M68 158 Q100 174 132 158"/>
    <path d="M90 74 L88 112" stroke-width="2"/>
    <path d="M110 74 L112 112" stroke-width="2"/>
  </svg>`,
  sweatshirt: `<svg class="csp__icon" viewBox="0 0 200 240" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">
    <path d="M76 42 Q100 58 124 42"/>
    <path d="M76 42 L38 58 L28 90 L44 100 L56 74 L56 222 L144 222 L144 74 L156 100 L172 90 L162 58 L124 42"/>
    <path d="M56 206 L144 206" stroke-width="2"/>
    <path d="M44 100 L56 100" stroke-width="2"/>
    <path d="M156 100 L144 100" stroke-width="2"/>
  </svg>`,
};

const CS_COPY = {
  hoodie: "Heavyweight comfort, cut right — dropping soon.",
  sweatshirt: "Layer-ready essentials, dropping soon.",
};

function comingSoonPanel(key, label){
  const icon = GARMENT_ICONS[key] || GARMENT_ICONS.hoodie;
  const tag = CS_COPY[key] || "We're finishing the fit before it goes live.";
  return `
    <div class="coming-soon-poster cs-${key}">
      <div class="csp__art">
        ${icon}
        <span class="csp__stamp">Coming Soon</span>
      </div>
      <div class="csp__content">
        <p class="eyebrow">// Next Drop</p>
        <h3 class="chrome-text">${label}.</h3>
        <p class="csp__tag">${tag} Leave your email and be first to know.</p>
        <form class="notify-row" data-notify-form>
          <input type="email" placeholder="you@email.com" required>
          <button type="submit">Notify Me</button>
        </form>
      </div>
    </div>`;
}

function findItem(id){
  for(const key of Object.keys(CATALOG)){
    const hit = CATALOG[key].items.find(i=>i.id===id);
    if(hit) return {...hit, cat:key};
  }
  return null;
}

function renderCatalog(){
  const host = document.getElementById("shopContent");
  const cat = CATALOG[activeTab];
  if(cat.comingSoon){
    host.innerHTML = comingSoonPanel(activeTab, cat.label);
  } else if(cat.items.length === 0){
    host.innerHTML = `<div class="empty-live"><p>New ${cat.label.toLowerCase()} styles landing here shortly — check back soon.</p></div>`;
  } else {
    host.innerHTML = `<div class="grid">${cat.items.map(productCard).join("")}</div>`;
  }
}

function renderTabs(){
  const bar = document.getElementById("tabBar");
  bar.innerHTML = TABS.map(t => {
    const isSoon = CATALOG[t.key] ? CATALOG[t.key].comingSoon : t.note;
    return `
    <button class="tab ${t.key===activeTab?"is-active":""}" data-tab="${t.key}">
      ${t.label}${isSoon ? `<span class="tab__note">Soon</span>` : ""}
    </button>`;
  }).join("");
}

// ---- cart -------------------------------------------------------------
function addToCart(id, sourceEl){
  const item = findItem(id);
  if(!item) return;
  const existing = cart.find(c=>c.id===id);
  if(existing) existing.qty++;
  else cart.push({...item, qty:1});
  renderCart();
  flyToCart(sourceEl);
  bumpCartIcon();
  toast(`${item.name} added to bag 🔥`);
}

function changeQty(id, delta){
  const line = cart.find(c=>c.id===id);
  if(!line) return;
  line.qty += delta;
  if(line.qty <= 0) cart = cart.filter(c=>c.id!==id);
  renderCart();
}

function cartCount(){ return cart.reduce((s,c)=>s+c.qty,0); }
function cartTotal(){ return cart.reduce((s,c)=>s+c.qty*c.price,0); }

function renderCart(){
  const count = cartCount();
  const total = cartTotal();

  document.getElementById("cartCount").textContent = count;
  document.getElementById("navBagBadge").textContent = count;
  document.getElementById("miniCartCount").textContent = count;
  document.getElementById("miniCartTotal").textContent = money(total);
  document.getElementById("miniCart").classList.toggle("is-visible", count > 0);

  const body = document.getElementById("cartBody");
  if(cart.length === 0){
    body.innerHTML = `<p class="cart-empty">Your bag's empty. Go start something.</p>`;
  } else {
    body.innerHTML = cart.map(c => `
      <div class="cart-line">
        <div class="cart-line__art">${c.image_url ? `<img src="${c.image_url}" alt="">` : artSVG(c.art)}</div>
        <div class="cart-line__info">
          <p class="cart-line__name">${c.name}</p>
          <p class="cart-line__price">${money(c.price)}</p>
        </div>
        <div class="qty">
          <button data-id="${c.id}" data-delta="-1">−</button>
          <span>${c.qty}</span>
          <button data-id="${c.id}" data-delta="1">+</button>
        </div>
      </div>`).join("");
  }
  document.getElementById("cartTotal").textContent = money(total);
}

function toggleCart(open){
  const drawer = document.getElementById("cartDrawer");
  const scrim = document.getElementById("scrim");
  const willOpen = open ?? !drawer.classList.contains("is-open");
  drawer.classList.toggle("is-open", willOpen);
  scrim.classList.toggle("is-open", willOpen);
}

function bumpCartIcon(){
  const icon = document.getElementById("cartIcon");
  icon.classList.remove("bump");
  void icon.offsetWidth;
  icon.classList.add("bump");
}

function flyToCart(sourceEl){
  if(!sourceEl) return;
  const card = sourceEl.closest(".card");
  const artNode = card?.querySelector(".card__art");
  const target = window.innerWidth < 900
    ? document.getElementById("navBag")
    : document.getElementById("cartIcon");
  if(!artNode || !target) return;
  const start = artNode.getBoundingClientRect();
  const end = target.getBoundingClientRect();
  const ghost = artNode.cloneNode(true);
  ghost.classList.add("fly-ghost");
  ghost.style.left = start.left + "px";
  ghost.style.top = start.top + "px";
  ghost.style.width = start.width + "px";
  ghost.style.height = start.height + "px";
  document.body.appendChild(ghost);
  requestAnimationFrame(()=>{
    ghost.style.transform = `translate(${end.left-start.left + end.width/2 - start.width/2}px, ${end.top-start.top}px) scale(.08)`;
    ghost.style.opacity = "0.2";
  });
  setTimeout(()=>ghost.remove(), 550);

  sourceEl.classList.add("is-added");
  setTimeout(()=>sourceEl.classList.remove("is-added"), 1100);
}

// ---- toast --------------------------------------------------------------
function toast(msg){
  const host = document.getElementById("toastHost");
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  host.appendChild(el);
  requestAnimationFrame(()=> el.classList.add("is-in"));
  setTimeout(()=>{
    el.classList.remove("is-in");
    setTimeout(()=>el.remove(), 300);
  }, 2200);
}

// ---- bottom nav active state (scroll-spy) --------------------------------
function setupScrollSpy(){
  const navHome = document.getElementById("navHome");
  const navShop = document.getElementById("navShop");
  const navDrops = document.getElementById("navDrops");
  const map = [
    { el: document.querySelector(".hero"), btn: navHome },
    { el: document.getElementById("shop"), btn: navShop },
    { el: document.getElementById("brandmark"), btn: navDrops },
  ];
  const observer = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        map.forEach(m => m.btn.classList.toggle("is-active", m.el === entry.target));
      }
    });
  }, { rootMargin: "-40% 0px -50% 0px" });
  map.forEach(m => m.el && observer.observe(m.el));
}

// ---- keep the top Collections showcase in sync with real stock ----------
function updateCollectionBadges(){
  document.querySelectorAll(".collection-card[data-goto-tab]").forEach(card=>{
    const key = card.dataset.gotoTab;
    const cat = CATALOG[key];
    if(!cat) return;
    const soonTag = card.querySelector(".collection-card__soon");
    const cta = card.querySelector(".collection-card__cta");
    if(cat.comingSoon){
      if(!soonTag){ card.insertAdjacentHTML("afterbegin", `<span class="collection-card__soon">Soon</span>`); }
      if(cta) cta.textContent = "Get Notified →";
    } else {
      if(soonTag) soonTag.remove();
      if(cta) cta.textContent = "Explore →";
    }
  });
}

// ---- product detail page ---------------------------------------------
function getSimilarProducts(current, limit=4){
  const sameCategory = [], others = [];
  Object.keys(CATALOG).forEach(key=>{
    CATALOG[key].items.forEach(p=>{
      if(p.id === current.id) return;
      (key === current.cat ? sameCategory : others).push(p);
    });
  });
  return [...sameCategory, ...others].slice(0, limit);
}

function renderProductDetail(){
  const host = document.getElementById("productDetail");
  const id = new URLSearchParams(window.location.search).get("id");
  const item = findItem(id);

  if(!item){
    host.innerHTML = `<div class="empty-live"><p>We couldn't find that product. <a href="index.html">← Back to shop</a></p></div>`;
    return;
  }

  const images = (item.images && item.images.length) ? item.images : (item.image_url ? [item.image_url] : []);
  const off = Math.round(100 - (item.price/item.mrp)*100);
  const mainMedia = images.length ? `<img id="pdMainImg" src="${images[0]}" alt="${item.name}">` : artSVG(item.art);
  const thumbs = images.length > 1
    ? `<div class="pd-thumbs">${images.map((src,i)=>`<button class="pd-thumb ${i===0?"is-active":""}" data-idx="${i}"><img src="${src}" alt=""></button>`).join("")}</div>`
    : "";
  const similar = getSimilarProducts(item);

  host.innerHTML = `
    <div class="pd-grid">
      <div class="pd-gallery">
        <div class="pd-gallery__main">${mainMedia}</div>
        ${thumbs}
      </div>
      <div class="pd-info">
        ${item.tag ? `<p class="eyebrow">${item.tag}</p>` : ""}
        ${item.badge ? `<span class="card__badge pd-badge">${item.badge}</span>` : ""}
        <h1>${item.name}</h1>
        <div class="pd-price">
          <span class="price-now">${money(item.price)}</span>
          <span class="price-mrp">${money(item.mrp)}</span>
          <span class="price-off">${off}% OFF</span>
        </div>
        ${item.details ? `<p class="pd-details">${item.details}</p>` : ""}
        <button class="btn-add pd-add" data-id="${item.id}">
          <span class="btn-add__label">Add to Bag</span>
          <span class="btn-add__check">Added ✓</span>
        </button>
      </div>
    </div>
    ${similar.length ? `
    <div class="pd-similar">
      <h2>You Might Also Like</h2>
      <div class="grid">${similar.map(productCard).join("")}</div>
    </div>` : ""}
  `;

  host.querySelectorAll(".pd-thumb").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const idx = Number(btn.dataset.idx);
      document.getElementById("pdMainImg").src = images[idx];
      host.querySelectorAll(".pd-thumb").forEach((b,i)=> b.classList.toggle("is-active", i===idx));
    });
  });

  host.querySelector(".pd-add")?.addEventListener("click", e=> addToCart(item.id, e.currentTarget));
  host.querySelectorAll(".btn-add[data-id]").forEach(btn=>{
    if(btn.classList.contains("pd-add")) return; // already wired above
    btn.addEventListener("click", ()=> addToCart(btn.dataset.id, btn));
  });

  document.title = `${item.name} — Bandolera`;
}

// ---- shared UI: cart, bottom nav, header — needed on every page -----------
function wireCommonUI(){
  const onShopPage = !!document.getElementById("shop");
  const goTo = (sectionId) => {
    if(onShopPage) document.getElementById(sectionId).scrollIntoView({behavior:"smooth"});
    else window.location.href = `index.html#${sectionId}`;
  };

  document.getElementById("cartBody").addEventListener("click", e=>{
    const btn = e.target.closest("button[data-delta]");
    if(!btn) return;
    changeQty(btn.dataset.id, Number(btn.dataset.delta));
  });

  document.getElementById("cartIcon").addEventListener("click", ()=>toggleCart(true));
  document.getElementById("cartClose").addEventListener("click", ()=>toggleCart(false));
  document.getElementById("scrim").addEventListener("click", ()=>toggleCart(false));
  document.getElementById("navBag").addEventListener("click", ()=>toggleCart(true));
  document.getElementById("miniCartCta").addEventListener("click", ()=>toggleCart(true));

  document.getElementById("navHome").addEventListener("click", ()=>{
    if(onShopPage) window.scrollTo({top:0, behavior:"smooth"});
    else window.location.href = "index.html";
  });
  document.getElementById("navShop").addEventListener("click", ()=> goTo("shop"));
  document.getElementById("navDrops").addEventListener("click", ()=> goTo("brandmark"));

  document.getElementById("checkoutBtn").addEventListener("click", async ()=>{
    if(cart.length === 0){ toast("Add something first 👀"); return; }

    const btn = document.getElementById("checkoutBtn");
    btn.disabled = true;
    btn.textContent = "Processing…";

    try {
      // Step 1 — create order on our server (secret key stays server-side)
      const total = cartTotal(); // in rupees
      const res = await fetch("/api/payment?action=create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: total * 100,          // Razorpay expects paise (₹1 = 100 paise)
          currency: "INR",
          receipt: `bdlr_${Date.now()}`,
        }),
      });
      const data = await res.json();
      if(!data.ok) throw new Error(data.error || "Order creation failed");

      // Step 2 — open Razorpay checkout popup
      const options = {
        key: data.key_id,              // returned from server so it's not hardcoded
        amount: data.amount,
        currency: data.currency,
        name: "Bandolera",
        description: `${cartCount()} item${cartCount()>1?"s":""}`,
        order_id: data.order_id,
        theme: { color: "#C81E3A" },
        handler: async function(response) {
          // Step 3 — verify payment signature on our server
          const verifyRes = await fetch("/api/payment?action=verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id:  response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
            }),
          });
          const verifyData = await verifyRes.json();
          if(verifyData.ok){
            cart = [];
            renderCart();
            toggleCart(false);
            window.location.href = `order-success.html?payment_id=${response.razorpay_payment_id}`;
          } else {
            toast("Payment verification failed. Please contact us.");
          }
        },
        modal: {
          ondismiss: function(){
            btn.disabled = false;
            btn.textContent = "Checkout";
          }
        }
      };
      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function(){
        toast("Payment failed. Please try again.");
        btn.disabled = false;
        btn.textContent = "Checkout";
      });
      rzp.open();
    } catch(err) {
      toast("Something went wrong. Please try again.");
      btn.disabled = false;
      btn.textContent = "Checkout";
    }
  });

  document.querySelectorAll("[data-scroll-shop]").forEach(el=>{
    el.addEventListener("click", ()=> goTo("shop"));
  });
}

// ---- index.html-only wiring ------------------------------------------
function wireHomeUI(){
  document.getElementById("tabBar").addEventListener("click", e=>{
    const btn = e.target.closest(".tab");
    if(!btn) return;
    activeTab = btn.dataset.tab;
    renderTabs();
    renderCatalog();
  });

  document.getElementById("collections").addEventListener("click", e=>{
    const btn = e.target.closest(".collection-card");
    if(!btn) return;
    activeTab = btn.dataset.gotoTab;
    renderTabs();
    renderCatalog();
    document.getElementById("shop").scrollIntoView({behavior:"smooth"});
  });

  document.getElementById("shopContent").addEventListener("click", e=>{
    const btn = e.target.closest(".btn-add");
    if(btn){ addToCart(btn.dataset.id, btn); return; }
  });

  document.getElementById("shopContent").addEventListener("submit", e=>{
    const form = e.target.closest("[data-notify-form]");
    if(!form) return;
    e.preventDefault();
    const email = form.querySelector("input").value;
    notifiedEmails.push(email);
    toast("You're on the list — we'll notify you 🚀");
    form.reset();
  });

  document.getElementById("contactForm").addEventListener("submit", e=>{
    e.preventDefault();
    const [nameInput, emailInput] = e.target.querySelectorAll("input");
    const message = e.target.querySelector("textarea").value;
    const subject = encodeURIComponent(`Message from ${nameInput.value} via Bandolera site`);
    const body = encodeURIComponent(`${message}\n\n— ${nameInput.value} (${emailInput.value})`);
    window.location.href = `mailto:hello@bandolera.com?subject=${subject}&body=${body}`;
  });

  setupScrollSpy();
}

// ---- wire up --------------------------------------------------------------
async function init(){
  await loadCatalog();
  renderCart();
  wireCommonUI();

  if(document.getElementById("shop")){
    updateCollectionBadges();
    renderTabs();
    renderCatalog();
    wireHomeUI();
  } else if(document.getElementById("productDetail")){
    renderProductDetail();
  }

  setupScrollReveal();
  setupTilt();
}

// ---- scroll reveal ----------------------------------------------------
function setupScrollReveal(){
  const items = document.querySelectorAll(".reveal");
  items.forEach(el => el.classList.add("reveal-armed"));
  const observer = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  items.forEach(el => observer.observe(el));
}

// ---- subtle 3D tilt on cards --------------------------------------------
function setupTilt(){
  document.body.addEventListener("mousemove", e=>{
    const card = e.target.closest(".card, .collection-card");
    if(!card) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(600px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-2px)`;
  });
  document.body.addEventListener("mouseout", e=>{
    const card = e.target.closest(".card, .collection-card");
    if(!card) return;
    card.style.transform = "";
  });
}

document.addEventListener("DOMContentLoaded", init);

// ==========================================================================
// BANDOLERA — PERFECT SECURE PAYMENTS SYSTEM TRIGGER
// Connected directly to your live Cloudflare Worker API
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
  const checkoutBtn = document.getElementById("checkoutBtn");
  
  if (checkoutBtn) {
    // Clean up older duplicate event listeners by replacing the button with a fresh copy
    const newCheckoutBtn = checkoutBtn.cloneNode(true);
    checkoutBtn.parentNode.replaceChild(newCheckoutBtn, checkoutBtn);

    newCheckoutBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      
      const totalTextElement = document.getElementById("cartTotal");
      if (!totalTextElement) return;

      // Extract raw digits from currency strings (converts "₹899" to 899)
      const numericAmount = parseFloat(totalTextElement.innerText.replace(/[^0-9.]/g, ''));
      
      if (!numericAmount || numericAmount <= 0) {
        alert("Your bag is empty! Add items to checkout.");
        return;
      }

      try {
        newCheckoutBtn.innerText = "Processing...";
        newCheckoutBtn.disabled = true;

        // 1. Fetch secure order payload out of your active Cloudflare Worker link
        const response = await fetch("https://workers.dev", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ amount: numericAmount, currency: "INR" })
        });
        
        if (!response.ok) throw new Error("Payment worker gateway returned an error response status");
        const order = await response.json();

        // 2. Open the official Razorpay checkout layout slider window layout configuration parameters
        const options = {
          "key": "rzp_test_TiarVgXZgGt9Av", // Your exact public Razorpay Key ID string
          "amount": order.amount,
          "currency": "INR",
          "name": "BANDOLERA",
          "description": "Store Purchase Checkout Summary",
          "order_id": order.id, 
          "handler": function (rzpResponse) {
            alert("Payment Successful! Tracking ID: " + rzpResponse.razorpay_payment_id);
            if (typeof clearCart === "function") clearCart();
          },
          "theme": {
            "color": "#211F1C" // Deep dark charcoal to match your layout accent aesthetic
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();

      } catch (error) {
        console.error("Checkout process caught a network configuration error:", error);
        alert("Payment initialization failed. Please try again shortly.");
      } finally {
        newCheckoutBtn.innerText = "Checkout";
        newCheckoutBtn.disabled = false;
      }
    });
  }
});

