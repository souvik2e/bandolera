// ==========================================================================
// BANDOLERA v3 — LOGIC
// Cart state is in-memory for this demo (no localStorage) — swap in the
// same localStorage/Cashfree pattern used on the other sites when live.
// Notify-me capture on Coming Soon panels is also demo-only (toast + memory,
// no real backend) — wire to an actual email list before going live.
// ==========================================================================

let cart = [];
let activeTab = "tshirt";
const notifiedEmails = [];

const money = n => "₹" + n.toLocaleString("en-IN");

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

// ---- catalog rendering ----------------------------------------------------
function productCard(item){
  const off = Math.round(100 - (item.price/item.mrp)*100);
  return `
    <article class="card" data-id="${item.id}">
      <div class="card__art">
        ${artSVG(item.art)}
        <span class="card__tag">${item.code}</span>
        ${item.badge ? `<span class="card__badge">${item.badge}</span>` : ""}
      </div>
      <div class="card__body">
        <h3 class="card__name">${item.name}</h3>
        <div class="card__price">
          <span class="price-now">${money(item.price)}</span>
          <span class="price-mrp">${money(item.mrp)}</span>
          <span class="price-off">${off}% OFF</span>
        </div>
        <button class="btn-add" data-id="${item.id}">
          <span class="btn-add__label">Add to Bag</span>
          <span class="btn-add__check">Added ✓</span>
        </button>
      </div>
    </article>`;
}

function comingSoonPanel(label){
  return `
    <div class="coming-soon">
      <div class="coming-soon__blob"></div>
      <svg class="coming-soon__icon" viewBox="0 0 24 24" fill="none" stroke="#18140F" stroke-width="1.4">
        <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 3.2"/>
      </svg>
      <h3>${label}. Dropping Soon.</h3>
      <p>We're finishing the fit before it goes live — pieces built the same way as everything else in this catalog. Leave your email and be first to know.</p>
      <form class="notify-row" data-notify-form>
        <input type="email" placeholder="you@email.com" required>
        <button type="submit">Notify Me</button>
      </form>
    </div>`;
}

function findItem(id){
  for(const key of ["tshirt","oversized"]){
    const hit = CATALOG[key].items.find(i=>i.id===id);
    if(hit) return {...hit, cat:key};
  }
  return null;
}

function renderCatalog(){
  const host = document.getElementById("shopContent");
  const cat = CATALOG[activeTab];
  if(cat.comingSoon){
    host.innerHTML = comingSoonPanel(cat.label);
  } else {
    host.innerHTML = `<div class="grid">${cat.items.map(productCard).join("")}</div>`;
  }
}

function renderTabs(){
  const bar = document.getElementById("tabBar");
  bar.innerHTML = TABS.map(t => `
    <button class="tab ${t.key===activeTab?"is-active":""}" data-tab="${t.key}">
      ${t.label}${t.note ? `<span class="tab__note">${t.note}</span>` : ""}
    </button>`).join("");
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
        <div class="cart-line__art">${artSVG(c.art)}</div>
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

// ---- wire up --------------------------------------------------------------
function init(){
  renderTabs();
  renderCatalog();
  renderCart();
  setupScrollSpy();

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
    if(!btn) return;
    addToCart(btn.dataset.id, btn);
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

  document.getElementById("navHome").addEventListener("click", ()=> window.scrollTo({top:0, behavior:"smooth"}));
  document.getElementById("navShop").addEventListener("click", ()=> document.getElementById("shop").scrollIntoView({behavior:"smooth"}));
  document.getElementById("navDrops").addEventListener("click", ()=> document.getElementById("brandmark").scrollIntoView({behavior:"smooth"}));

  document.getElementById("checkoutBtn").addEventListener("click", ()=>{
    if(cart.length === 0){ toast("Add something first 👀"); return; }
    toast("Demo checkout — wire this to Cashfree when you're ready 🚀");
  });

  document.querySelectorAll("[data-scroll-shop]").forEach(el=>{
    el.addEventListener("click", ()=> document.getElementById("shop").scrollIntoView({behavior:"smooth"}));
  });

  document.getElementById("contactForm").addEventListener("submit", e=>{
    e.preventDefault();
    const [nameInput, emailInput] = e.target.querySelectorAll("input");
    const message = e.target.querySelector("textarea").value;
    const subject = encodeURIComponent(`Message from ${nameInput.value} via Bandolera site`);
    const body = encodeURIComponent(`${message}\n\n— ${nameInput.value} (${emailInput.value})`);
    window.location.href = `mailto:hello@bandolera.com?subject=${subject}&body=${body}`;
  });

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
