/**
 * FreshMart - Main Application Logic
 * Manages state, cart, wishlist, search, filter, checkout, and UI events.
 * Displays all pricing in Indian Rupees (₹ - INR).
 */

// Helper to format currency in Indian Rupees
function formatCurrency(amount) {
  const num = Number(amount) || 0;
  if (Number.isInteger(num)) {
    return '₹' + num.toLocaleString('en-IN');
  }
  return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Initial Delivery Address setup with Indian address migration
let initialAddress = localStorage.getItem('freshmart_address');
if (!initialAddress || initialAddress.includes('Springfield') || initialAddress.includes('Evergreen')) {
  initialAddress = 'Flat 402, Green Acres, Indiranagar, Bengaluru - 560038';
  localStorage.setItem('freshmart_address', initialAddress);
}

// Global State
const State = {
  cart: JSON.parse(localStorage.getItem('freshmart_cart') || '[]'),
  wishlist: JSON.parse(localStorage.getItem('freshmart_wishlist') || '[]'),
  orders: JSON.parse(localStorage.getItem('freshmart_orders') || '[]'),
  category: 'all',
  searchQuery: '',
  sortBy: 'featured',
  filterOrganic: false,
  filterDiscounted: false,
  appliedPromo: null,
  deliveryAddress: initialAddress,
  deliveryFee: 40,
  freeDeliveryThreshold: 499
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  initCategories();
  renderProducts();
  updateCartBadge();
  updateWishlistBadge();
  setupEventListeners();
  renderAddress();

  // Initialize Lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }
});

// Save to LocalStorage
function saveCart() {
  localStorage.setItem('freshmart_cart', JSON.stringify(State.cart));
  updateCartBadge();
  renderCart();
  renderProducts(); // Update inline card quantity controls
}

function saveWishlist() {
  localStorage.setItem('freshmart_wishlist', JSON.stringify(State.wishlist));
  updateWishlistBadge();
  renderProducts();
}

function saveOrders() {
  localStorage.setItem('freshmart_orders', JSON.stringify(State.orders));
}

// Category Pill Rendering
function initCategories() {
  const container = document.getElementById('category-pills');
  if (!container) return;

  container.innerHTML = CATEGORIES.map(cat => {
    const count = cat.id === 'all' 
      ? PRODUCTS.length 
      : PRODUCTS.filter(p => p.category === cat.id).length;
    const isActive = State.category === cat.id;

    return `
      <button 
        onclick="setCategory('${cat.id}')"
        class="category-pill flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
          isActive 
            ? 'active' 
            : 'bg-white text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 shadow-sm'
        }"
      >
        <i data-lucide="${cat.icon}" class="w-4 h-4"></i>
        <span>${cat.name}</span>
        <span class="text-xs px-1.5 py-0.5 rounded-full ${isActive ? 'bg-emerald-700/40 text-white' : 'bg-slate-100 text-slate-500'}">
          ${count}
        </span>
      </button>
    `;
  }).join('');

  if (window.lucide) window.lucide.createIcons();
}

function setCategory(catId) {
  State.category = catId;
  initCategories();
  renderProducts();
}

// Filter and Sort Products
function getFilteredProducts() {
  let list = [...PRODUCTS];

  // Category filter
  if (State.category !== 'all') {
    list = list.filter(p => p.category === State.category);
  }

  // Search filter
  if (State.searchQuery.trim()) {
    const q = State.searchQuery.toLowerCase().trim();
    list = list.filter(p => 
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
    );
  }

  // Organic filter
  if (State.filterOrganic) {
    list = list.filter(p => p.isOrganic);
  }

  // Discounted filter
  if (State.filterDiscounted) {
    list = list.filter(p => p.originalPrice && p.originalPrice > p.price);
  }

  // Sorting
  switch (State.sortBy) {
    case 'price-low':
      list.sort((a, b) => a.price - b.price);
      break;
    case 'price-high':
      list.sort((a, b) => b.price - a.price);
      break;
    case 'rating':
      list.sort((a, b) => b.rating - a.rating);
      break;
    case 'name':
      list.sort((a, b) => a.name.localeCompare(b.name));
      break;
    default: // 'featured'
      list.sort((a, b) => (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0));
  }

  return list;
}

// Render Products Grid
function renderProducts() {
  const grid = document.getElementById('product-grid');
  const countEl = document.getElementById('product-count');
  if (!grid) return;

  const products = getFilteredProducts();

  if (countEl) {
    countEl.innerText = `${products.length} product${products.length === 1 ? '' : 's'} available`;
  }

  if (products.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full py-16 text-center">
        <div class="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <i data-lucide="search-x" class="w-10 h-10"></i>
        </div>
        <h3 class="text-xl font-bold text-slate-800 mb-1">No groceries found</h3>
        <p class="text-slate-500 max-w-md mx-auto mb-6">We couldn't find any items matching your filters or search. Try clearing your search or switching categories.</p>
        <button onclick="resetFilters()" class="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold shadow hover:bg-emerald-700 transition">
          Clear All Filters
        </button>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  grid.innerHTML = products.map(item => {
    const inWishlist = State.wishlist.includes(item.id);
    const cartItem = State.cart.find(c => c.id === item.id);
    const cartQty = cartItem ? cartItem.quantity : 0;

    return `
      <div class="product-card bg-white rounded-2xl border border-slate-200/90 overflow-hidden flex flex-col justify-between shadow-sm relative group">
        <!-- Badges & Wishlist -->
        <div class="absolute top-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-none">
          <div class="flex flex-col gap-1.5 pointer-events-auto">
            ${item.discount ? `
              <span class="text-[11px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full bg-rose-500 text-white shadow-sm">
                ${item.discount}
              </span>
            ` : ''}
            ${item.isOrganic ? `
              <span class="text-[11px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-sm">
                Organic
              </span>
            ` : ''}
          </div>
          <button 
            onclick="toggleWishlist('${item.id}')"
            class="pointer-events-auto w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-400 hover:text-rose-500 shadow-sm flex items-center justify-center transition-all ${inWishlist ? '!text-rose-500 bg-white' : ''}"
            title="${inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}"
          >
            <i data-lucide="heart" class="w-4 h-4 ${inWishlist ? 'fill-rose-500' : ''}"></i>
          </button>
        </div>

        <!-- Product Image & Quick View Trigger -->
        <div class="relative bg-slate-50 aspect-square overflow-hidden cursor-pointer" onclick="openQuickView('${item.id}')">
          <img 
            src="${item.image}" 
            alt="${item.name}" 
            loading="lazy"
            class="product-img w-full h-full object-cover object-center"
            onerror="this.src='https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=80'"
          />
          <div class="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3">
            <span class="text-xs font-semibold bg-white/95 text-slate-800 px-3 py-1.5 rounded-full shadow-md backdrop-blur-sm flex items-center gap-1.5">
              <i data-lucide="eye" class="w-3.5 h-3.5"></i> Quick View
            </span>
          </div>
        </div>

        <!-- Product Details -->
        <div class="p-4 flex flex-col flex-grow justify-between">
          <div>
            <div class="flex items-center justify-between text-xs text-slate-400 font-medium mb-1">
              <span class="uppercase tracking-wider text-[10px] text-emerald-600 font-bold">${item.category}</span>
              <div class="flex items-center gap-1 text-amber-500">
                <i data-lucide="star" class="w-3.5 h-3.5 fill-amber-400 text-amber-400"></i>
                <span class="font-semibold text-slate-700 text-xs">${item.rating}</span>
                <span class="text-slate-400 text-[11px]">(${item.reviews})</span>
              </div>
            </div>

            <h3 class="font-bold text-slate-800 text-base mb-1 line-clamp-1 hover:text-emerald-600 cursor-pointer transition" onclick="openQuickView('${item.id}')" title="${item.name}">
              ${item.name}
            </h3>
            
            <p class="text-xs text-slate-500 mb-3">${item.unit}</p>
          </div>

          <!-- Price & Action Button -->
          <div class="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto">
            <div>
              <div class="flex items-baseline gap-1.5">
                <span class="text-lg font-extrabold text-slate-900">${formatCurrency(item.price)}</span>
                ${item.originalPrice ? `
                  <span class="text-xs text-slate-400 line-through">${formatCurrency(item.originalPrice)}</span>
                ` : ''}
              </div>
            </div>

            <!-- Add or Stepper Controls -->
            <div>
              ${cartQty === 0 ? `
                <button 
                  onclick="addToCart('${item.id}')"
                  class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white font-semibold text-sm transition-all shadow-sm active:scale-95"
                >
                  <i data-lucide="plus" class="w-4 h-4"></i> Add
                </button>
              ` : `
                <div class="flex items-center bg-emerald-600 text-white rounded-xl shadow-sm overflow-hidden p-0.5">
                  <button 
                    onclick="updateCartItemQty('${item.id}', ${cartQty - 1})"
                    class="w-7 h-7 flex items-center justify-center hover:bg-emerald-700 active:scale-95 transition"
                    title="Decrease quantity"
                  >
                    <i data-lucide="minus" class="w-3.5 h-3.5"></i>
                  </button>
                  <span class="w-7 text-center font-bold text-xs">${cartQty}</span>
                  <button 
                    onclick="updateCartItemQty('${item.id}', ${cartQty + 1})"
                    class="w-7 h-7 flex items-center justify-center hover:bg-emerald-700 active:scale-95 transition"
                    title="Increase quantity"
                  >
                    <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                  </button>
                </div>
              `}
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) window.lucide.createIcons();
}

// Cart Operations
function addToCart(productId, qty = 1) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  const existing = State.cart.find(c => c.id === productId);
  if (existing) {
    existing.quantity += qty;
  } else {
    State.cart.push({ id: productId, quantity: qty });
  }

  saveCart();
  showToast(`Added ${product.name} to basket!`, 'success');
}

function updateCartItemQty(productId, newQty) {
  if (newQty <= 0) {
    removeFromCart(productId);
    return;
  }

  const item = State.cart.find(c => c.id === productId);
  if (item) {
    item.quantity = newQty;
    saveCart();
  }
}

function removeFromCart(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  State.cart = State.cart.filter(c => c.id !== productId);
  saveCart();
  if (product) {
    showToast(`Removed ${product.name} from basket`, 'info');
  }
}

function clearCart() {
  if (State.cart.length === 0) return;
  State.cart = [];
  State.appliedPromo = null;
  saveCart();
  showToast('Shopping basket cleared', 'info');
}

function updateCartBadge() {
  const totalCount = State.cart.reduce((sum, item) => sum + item.quantity, 0);
  const badge = document.getElementById('cart-badge');
  const navTotal = document.getElementById('cart-nav-total');

  if (badge) {
    badge.innerText = totalCount;
    badge.classList.toggle('hidden', totalCount === 0);
  }

  const subtotal = calculateSubtotal();
  if (navTotal) {
    navTotal.innerText = formatCurrency(subtotal);
  }
}

function calculateSubtotal() {
  return State.cart.reduce((sum, item) => {
    const prod = PRODUCTS.find(p => p.id === item.id);
    return sum + (prod ? prod.price * item.quantity : 0);
  }, 0);
}

function calculateDeliveryFee(subtotal) {
  if (subtotal === 0) return 0;
  if (State.appliedPromo === 'FREESHIP') return 0;
  if (subtotal >= State.freeDeliveryThreshold) return 0;
  return State.deliveryFee;
}

function calculateDiscount(subtotal) {
  if (!State.appliedPromo || !PROMO_CODES[State.appliedPromo]) return 0;
  const promo = PROMO_CODES[State.appliedPromo];
  
  if (subtotal < promo.minSpend) return 0;

  if (promo.discountPercent) {
    return Math.round((subtotal * promo.discountPercent) / 100);
  }
  if (promo.discountFixed) {
    return Math.min(subtotal, promo.discountFixed);
  }
  return 0;
}

// Render Cart Drawer
function renderCart() {
  const itemsContainer = document.getElementById('cart-items-container');
  const emptyState = document.getElementById('cart-empty-state');
  const footerEl = document.getElementById('cart-footer');
  const freeShipBar = document.getElementById('free-shipping-progress');
  const freeShipText = document.getElementById('free-shipping-text');

  if (!itemsContainer) return;

  const subtotal = calculateSubtotal();
  const delivery = calculateDeliveryFee(subtotal);
  const discount = calculateDiscount(subtotal);
  const total = Math.max(0, subtotal + delivery - discount);

  // Free shipping progress calculation
  if (freeShipBar && freeShipText) {
    if (subtotal >= State.freeDeliveryThreshold || State.appliedPromo === 'FREESHIP') {
      freeShipBar.style.width = '100%';
      freeShipBar.classList.replace('bg-emerald-500', 'bg-emerald-600');
      freeShipText.innerHTML = `🎉 You've unlocked <strong>FREE Delivery!</strong>`;
    } else {
      const remaining = State.freeDeliveryThreshold - subtotal;
      const progress = Math.min(100, (subtotal / State.freeDeliveryThreshold) * 100);
      freeShipBar.style.width = `${progress}%`;
      freeShipText.innerHTML = `Add <strong>${formatCurrency(remaining)}</strong> more for <strong>FREE Delivery</strong>`;
    }
  }

  if (State.cart.length === 0) {
    if (emptyState) emptyState.classList.remove('hidden');
    if (itemsContainer) itemsContainer.innerHTML = '';
    if (footerEl) footerEl.classList.add('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');
  if (footerEl) footerEl.classList.remove('hidden');

  itemsContainer.innerHTML = State.cart.map(item => {
    const prod = PRODUCTS.find(p => p.id === item.id);
    if (!prod) return '';

    const itemTotal = prod.price * item.quantity;

    return `
      <div class="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
        <img 
          src="${prod.image}" 
          alt="${prod.name}" 
          class="w-16 h-16 rounded-lg object-cover bg-slate-100 flex-shrink-0"
          onerror="this.src='https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=80'"
        />
        <div class="flex-grow min-w-0">
          <h4 class="font-semibold text-slate-800 text-sm truncate">${prod.name}</h4>
          <p class="text-xs text-slate-400 mb-1.5">${prod.unit}</p>
          <div class="flex items-center justify-between">
            <span class="font-extrabold text-slate-900 text-sm">${formatCurrency(itemTotal)}</span>
            <span class="text-[11px] text-slate-400">(${formatCurrency(prod.price)} each)</span>
          </div>
        </div>
        <div class="flex flex-col items-end justify-between self-stretch">
          <button 
            onclick="removeFromCart('${prod.id}')"
            class="text-slate-300 hover:text-rose-500 transition p-0.5"
            title="Remove item"
          >
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
          <div class="flex items-center bg-slate-100 rounded-lg overflow-hidden">
            <button 
              onclick="updateCartItemQty('${prod.id}', ${item.quantity - 1})"
              class="w-6 h-6 flex items-center justify-center hover:bg-slate-200 text-slate-700 transition"
            >
              <i data-lucide="minus" class="w-3 h-3"></i>
            </button>
            <span class="w-6 text-center text-xs font-bold text-slate-800">${item.quantity}</span>
            <button 
              onclick="updateCartItemQty('${prod.id}', ${item.quantity + 1})"
              class="w-6 h-6 flex items-center justify-center hover:bg-slate-200 text-slate-700 transition"
            >
              <i data-lucide="plus" class="w-3 h-3"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Update Summary fields
  document.getElementById('summary-subtotal').innerText = formatCurrency(subtotal);
  document.getElementById('summary-delivery').innerText = delivery === 0 ? 'FREE' : formatCurrency(delivery);
  
  const discountRow = document.getElementById('summary-discount-row');
  if (discount > 0) {
    discountRow.classList.remove('hidden');
    document.getElementById('summary-discount').innerText = `-${formatCurrency(discount)}`;
  } else {
    discountRow.classList.add('hidden');
  }

  document.getElementById('summary-total').innerText = formatCurrency(total);
  
  // Checkout button total
  const checkoutBtnTotal = document.getElementById('cart-checkout-total');
  if (checkoutBtnTotal) {
    checkoutBtnTotal.innerText = formatCurrency(total);
  }

  if (window.lucide) window.lucide.createIcons();
}

// Promo Code Logic
function applyPromoCode() {
  const input = document.getElementById('promo-input');
  if (!input) return;

  const code = input.value.trim().toUpperCase();
  if (!code) {
    showToast('Please enter a coupon code', 'error');
    return;
  }

  if (!PROMO_CODES[code]) {
    showToast('Invalid promo code. Try FRESH20, FREESHIP or SAVE100', 'error');
    return;
  }

  const promo = PROMO_CODES[code];
  const subtotal = calculateSubtotal();

  if (subtotal < promo.minSpend) {
    showToast(`Order must be at least ${formatCurrency(promo.minSpend)} to apply ${code}`, 'error');
    return;
  }

  State.appliedPromo = code;
  showToast(`Promo ${code} applied successfully!`, 'success');
  input.value = '';
  renderPromoBadge();
  renderCart();
}

function removePromoCode() {
  State.appliedPromo = null;
  renderPromoBadge();
  renderCart();
  showToast('Coupon code removed', 'info');
}

function renderPromoBadge() {
  const badgeContainer = document.getElementById('applied-promo-container');
  if (!badgeContainer) return;

  if (State.appliedPromo) {
    badgeContainer.innerHTML = `
      <div class="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5 text-xs text-emerald-800 font-semibold mb-3">
        <div class="flex items-center gap-1.5">
          <i data-lucide="tag" class="w-3.5 h-3.5 text-emerald-600"></i>
          <span>Coupon <strong>${State.appliedPromo}</strong> Applied!</span>
        </div>
        <button onclick="removePromoCode()" class="text-slate-400 hover:text-rose-600">
          <i data-lucide="x" class="w-3.5 h-3.5"></i>
        </button>
      </div>
    `;
  } else {
    badgeContainer.innerHTML = '';
  }

  if (window.lucide) window.lucide.createIcons();
}

function quickApplyPromo(code) {
  const input = document.getElementById('promo-input');
  if (input) input.value = code;
  applyPromoCode();
}

// Wishlist Logic
function toggleWishlist(productId) {
  const index = State.wishlist.indexOf(productId);
  const prod = PRODUCTS.find(p => p.id === productId);

  if (index > -1) {
    State.wishlist.splice(index, 1);
    showToast(`Removed ${prod ? prod.name : 'item'} from Wishlist`, 'info');
  } else {
    State.wishlist.push(productId);
    showToast(`Saved ${prod ? prod.name : 'item'} to Wishlist!`, 'success');
  }

  saveWishlist();
  renderWishlistModal();
}

function updateWishlistBadge() {
  const count = State.wishlist.length;
  const badge = document.getElementById('wishlist-badge');
  if (badge) {
    badge.innerText = count;
    badge.classList.toggle('hidden', count === 0);
  }
}

function renderWishlistModal() {
  const list = document.getElementById('wishlist-items-container');
  const empty = document.getElementById('wishlist-empty-state');
  if (!list) return;

  if (State.wishlist.length === 0) {
    list.innerHTML = '';
    if (empty) empty.classList.remove('hidden');
    return;
  }

  if (empty) empty.classList.add('hidden');

  list.innerHTML = State.wishlist.map(id => {
    const prod = PRODUCTS.find(p => p.id === id);
    if (!prod) return '';

    return `
      <div class="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
        <div class="flex items-center gap-3">
          <img src="${prod.image}" alt="${prod.name}" class="w-14 h-14 object-cover rounded-lg bg-white" />
          <div>
            <h4 class="font-bold text-slate-800 text-sm">${prod.name}</h4>
            <p class="text-xs text-slate-500">${prod.unit}</p>
            <span class="text-emerald-700 font-bold text-sm">${formatCurrency(prod.price)}</span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button 
            onclick="addToCart('${prod.id}'); toggleWishlist('${prod.id}');"
            class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 shadow-sm"
          >
            <i data-lucide="shopping-cart" class="w-3.5 h-3.5"></i> Move to Basket
          </button>
          <button 
            onclick="toggleWishlist('${prod.id}')"
            class="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-white transition"
          >
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) window.lucide.createIcons();
}

// Quick View Modal
function openQuickView(productId) {
  const prod = PRODUCTS.find(p => p.id === productId);
  if (!prod) return;

  const modal = document.getElementById('quickview-modal');
  const content = document.getElementById('quickview-content');
  if (!modal || !content) return;

  const inWishlist = State.wishlist.includes(prod.id);

  content.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
      <!-- Image Showcase -->
      <div class="relative bg-slate-100 rounded-2xl overflow-hidden aspect-square flex items-center justify-center">
        <img 
          src="${prod.image}" 
          alt="${prod.name}" 
          class="w-full h-full object-cover"
        />
        ${prod.discount ? `
          <span class="absolute top-4 left-4 bg-rose-500 text-white text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
            ${prod.discount}
          </span>
        ` : ''}
        ${prod.isOrganic ? `
          <span class="absolute top-4 right-4 bg-emerald-600 text-white text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
            Organic
          </span>
        ` : ''}
      </div>

      <!-- Info -->
      <div class="flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs uppercase font-extrabold tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
              ${prod.category}
            </span>
            <div class="flex items-center gap-1 text-amber-500 text-sm font-semibold">
              <i data-lucide="star" class="w-4 h-4 fill-amber-400 text-amber-400"></i>
              <span>${prod.rating}</span>
              <span class="text-slate-400 text-xs">(${prod.reviews} reviews)</span>
            </div>
          </div>

          <h2 class="text-2xl font-black text-slate-900 mb-1">${prod.name}</h2>
          <p class="text-sm font-medium text-slate-500 mb-3">${prod.unit}</p>

          <div class="flex items-baseline gap-3 mb-4">
            <span class="text-3xl font-extrabold text-slate-900">${formatCurrency(prod.price)}</span>
            ${prod.originalPrice ? `
              <span class="text-base text-slate-400 line-through">${formatCurrency(prod.originalPrice)}</span>
            ` : ''}
          </div>

          <p class="text-sm text-slate-600 leading-relaxed mb-6">
            ${prod.description}
          </p>

          <!-- Nutritional Info -->
          ${prod.nutrition ? `
            <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
              <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Nutrition Highlights</h4>
              <div class="grid grid-cols-2 gap-2 text-xs">
                ${Object.entries(prod.nutrition).map(([k, v]) => `
                  <div class="flex justify-between border-b border-slate-200/60 pb-1">
                    <span class="text-slate-500 capitalize">${k}:</span>
                    <span class="font-semibold text-slate-800">${v}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center gap-3 pt-4 border-t border-slate-100">
          <button 
            onclick="addToCart('${prod.id}'); closeQuickView();"
            class="flex-1 py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition active:scale-95"
          >
            <i data-lucide="shopping-cart" class="w-4 h-4"></i> Add to Basket
          </button>
          <button 
            onclick="toggleWishlist('${prod.id}')"
            class="p-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
            title="Wishlist"
          >
            <i data-lucide="heart" class="w-5 h-5 ${inWishlist ? 'fill-rose-500 text-rose-500' : ''}"></i>
          </button>
        </div>
      </div>
    </div>
  `;

  modal.classList.remove('hidden');
  if (window.lucide) window.lucide.createIcons();
}

function closeQuickView() {
  const modal = document.getElementById('quickview-modal');
  if (modal) modal.classList.add('hidden');
}

// Drawer & Modal Toggles
function toggleCartDrawer() {
  const drawer = document.getElementById('cart-drawer');
  const backdrop = document.getElementById('cart-backdrop');
  if (!drawer || !backdrop) return;

  const isOpen = !drawer.classList.contains('translate-x-full');
  if (isOpen) {
    drawer.classList.add('translate-x-full');
    backdrop.classList.add('hidden');
  } else {
    renderCart();
    renderPromoBadge();
    drawer.classList.remove('translate-x-full');
    backdrop.classList.remove('hidden');
  }
}

function toggleWishlistModal() {
  const modal = document.getElementById('wishlist-modal');
  if (!modal) return;
  const isHidden = modal.classList.contains('hidden');
  if (isHidden) {
    renderWishlistModal();
    modal.classList.remove('hidden');
  } else {
    modal.classList.add('hidden');
  }
}

function openAddressModal() {
  const modal = document.getElementById('address-modal');
  const input = document.getElementById('address-input');
  if (input) input.value = State.deliveryAddress;
  if (modal) modal.classList.remove('hidden');
}

function saveAddress() {
  const input = document.getElementById('address-input');
  if (!input || !input.value.trim()) return;

  State.deliveryAddress = input.value.trim();
  localStorage.setItem('freshmart_address', State.deliveryAddress);
  renderAddress();
  closeAddressModal();
  showToast('Delivery location updated!', 'success');
}

function closeAddressModal() {
  const modal = document.getElementById('address-modal');
  if (modal) modal.classList.add('hidden');
}

function renderAddress() {
  const el = document.getElementById('nav-delivery-address');
  if (el) {
    el.innerText = State.deliveryAddress;
  }
}

// Checkout Modal
function openCheckoutModal() {
  if (State.cart.length === 0) {
    showToast('Your basket is empty!', 'error');
    return;
  }

  // Close cart drawer
  toggleCartDrawer();

  const modal = document.getElementById('checkout-modal');
  const form = document.getElementById('checkout-form');
  const successState = document.getElementById('order-success-screen');
  
  if (form) form.classList.remove('hidden');
  if (successState) successState.classList.add('hidden');

  // Populate checkout summary
  const subtotal = calculateSubtotal();
  const delivery = calculateDeliveryFee(subtotal);
  const discount = calculateDiscount(subtotal);
  const total = Math.max(0, subtotal + delivery - discount);

  document.getElementById('checkout-subtotal').innerText = formatCurrency(subtotal);
  document.getElementById('checkout-delivery').innerText = delivery === 0 ? 'FREE' : formatCurrency(delivery);
  
  const discountRow = document.getElementById('checkout-discount-row');
  if (discount > 0) {
    discountRow.classList.remove('hidden');
    document.getElementById('checkout-discount').innerText = `-${formatCurrency(discount)}`;
  } else {
    discountRow.classList.add('hidden');
  }

  document.getElementById('checkout-total').innerText = formatCurrency(total);
  document.getElementById('checkout-address-input').value = State.deliveryAddress;

  if (modal) modal.classList.remove('hidden');
}

function closeCheckoutModal() {
  const modal = document.getElementById('checkout-modal');
  if (modal) modal.classList.add('hidden');
}

function handleCheckoutSubmit(e) {
  e.preventDefault();

  const name = document.getElementById('cust-name').value.trim();
  const phone = document.getElementById('cust-phone').value.trim();
  const address = document.getElementById('checkout-address-input').value.trim();
  const paymentMethod = document.querySelector('input[name="payment_method"]:checked')?.value || 'Cash on Delivery';

  if (!name || !phone || !address) {
    showToast('Please fill in all delivery details', 'error');
    return;
  }

  // Update saved address
  State.deliveryAddress = address;
  localStorage.setItem('freshmart_address', address);
  renderAddress();

  const subtotal = calculateSubtotal();
  const delivery = calculateDeliveryFee(subtotal);
  const discount = calculateDiscount(subtotal);
  const total = Math.max(0, subtotal + delivery - discount);

  const orderId = 'FM-' + Math.floor(100000 + Math.random() * 900000);
  const orderData = {
    id: orderId,
    timestamp: new Date().toISOString(),
    customer: { name, phone, address },
    paymentMethod,
    items: State.cart.map(c => {
      const prod = PRODUCTS.find(p => p.id === c.id);
      return {
        id: c.id,
        name: prod ? prod.name : 'Unknown Item',
        price: prod ? prod.price : 0,
        quantity: c.quantity
      };
    }),
    subtotal,
    delivery,
    discount,
    total,
    status: 'Confirmed'
  };

  // Add to order history
  State.orders.unshift(orderData);
  saveOrders();

  // Clear cart
  State.cart = [];
  State.appliedPromo = null;
  saveCart();

  // Show Success Screen
  const form = document.getElementById('checkout-form');
  const successState = document.getElementById('order-success-screen');
  
  if (form) form.classList.add('hidden');
  if (successState) {
    successState.classList.remove('hidden');
    document.getElementById('success-order-id').innerText = orderId;
    document.getElementById('success-order-total').innerText = formatCurrency(total);
    document.getElementById('success-order-eta').innerText = '20-30 mins';
  }

  triggerConfetti();
}

// Confetti Effect
function triggerConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const pieces = [];
  const colors = ['#10b981', '#059669', '#34d399', '#f59e0b', '#3b82f6', '#ec4899'];

  for (let i = 0; i < 70; i++) {
    pieces.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      speed: Math.random() * 4 + 2,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 8
    });
  }

  let animationFrame;
  let ticks = 0;

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => {
      p.y += p.speed;
      p.rotation += p.rotSpeed;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    });

    ticks++;
    if (ticks < 140) {
      animationFrame = requestAnimationFrame(render);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      cancelAnimationFrame(animationFrame);
    }
  }

  render();
}

// Order History Modal
function openOrdersModal() {
  const modal = document.getElementById('orders-modal');
  const container = document.getElementById('orders-list');
  const empty = document.getElementById('orders-empty');
  if (!modal || !container) return;

  if (State.orders.length === 0) {
    container.innerHTML = '';
    if (empty) empty.classList.remove('hidden');
  } else {
    if (empty) empty.classList.add('hidden');
    container.innerHTML = State.orders.map(o => {
      const date = new Date(o.timestamp).toLocaleDateString('en-IN', { 
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
      });

      return `
        <div class="border border-slate-200 rounded-xl p-4 bg-slate-50 hover:bg-white transition shadow-sm mb-3">
          <div class="flex items-center justify-between mb-2">
            <div>
              <span class="font-mono text-xs font-bold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded">
                ${o.id}
              </span>
              <span class="text-xs text-slate-400 ml-2">${date}</span>
            </div>
            <span class="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> ${o.status}
            </span>
          </div>

          <div class="text-xs text-slate-600 mb-2 divide-y divide-slate-100">
            ${o.items.map(it => `
              <div class="flex justify-between py-1">
                <span>${it.quantity}x ${it.name}</span>
                <span class="font-medium">${formatCurrency(it.price * it.quantity)}</span>
              </div>
            `).join('')}
          </div>

          <div class="pt-2 border-t border-slate-200 flex items-center justify-between font-bold text-sm text-slate-900">
            <span>Total Paid</span>
            <span class="text-emerald-700">${formatCurrency(o.total)}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  modal.classList.remove('hidden');
  if (window.lucide) window.lucide.createIcons();
}

function closeOrdersModal() {
  const modal = document.getElementById('orders-modal');
  if (modal) modal.classList.add('hidden');
}

// Toast Notifications
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast animate-fade-in flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold max-w-sm mb-2 text-white ${
    type === 'success' ? 'bg-emerald-600' :
    type === 'error' ? 'bg-rose-600' : 'bg-slate-800'
  }`;

  const iconName = type === 'success' ? 'check-circle-2' : type === 'error' ? 'alert-triangle' : 'info';

  toast.innerHTML = `
    <i data-lucide="${iconName}" class="w-4 h-4 flex-shrink-0"></i>
    <span class="flex-grow">${message}</span>
  `;

  container.appendChild(toast);
  if (window.lucide) window.lucide.createIcons();

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 2800);
}

// Event Listeners Setup
function setupEventListeners() {
  // Search bar input
  const searchInput = document.getElementById('search-input');
  const clearBtn = document.getElementById('clear-search-btn');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      State.searchQuery = e.target.value;
      if (clearBtn) {
        clearBtn.classList.toggle('hidden', !e.target.value);
      }
      renderProducts();
    });
  }

  // Sort dropdown
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      State.sortBy = e.target.value;
      renderProducts();
    });
  }

  // Organic filter checkbox
  const organicToggle = document.getElementById('filter-organic');
  if (organicToggle) {
    organicToggle.addEventListener('change', (e) => {
      State.filterOrganic = e.target.checked;
      renderProducts();
    });
  }

  // Discounted filter checkbox
  const discountToggle = document.getElementById('filter-discount');
  if (discountToggle) {
    discountToggle.addEventListener('change', (e) => {
      State.filterDiscounted = e.target.checked;
      renderProducts();
    });
  }

  // Close modals on Escape key
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeQuickView();
      closeCheckoutModal();
      closeAddressModal();
      closeOrdersModal();
      const wishlistModal = document.getElementById('wishlist-modal');
      if (wishlistModal) wishlistModal.classList.add('hidden');
      const drawer = document.getElementById('cart-drawer');
      const backdrop = document.getElementById('cart-backdrop');
      if (drawer && !drawer.classList.contains('translate-x-full')) {
        drawer.classList.add('translate-x-full');
        if (backdrop) backdrop.classList.add('hidden');
      }
    }
  });
}

function resetFilters() {
  State.category = 'all';
  State.searchQuery = '';
  State.sortBy = 'featured';
  State.filterOrganic = false;
  State.filterDiscounted = false;

  const searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.value = '';

  const clearBtn = document.getElementById('clear-search-btn');
  if (clearBtn) clearBtn.classList.add('hidden');

  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) sortSelect.value = 'featured';

  const organicToggle = document.getElementById('filter-organic');
  if (organicToggle) organicToggle.checked = false;

  const discountToggle = document.getElementById('filter-discount');
  if (discountToggle) discountToggle.checked = false;

  initCategories();
  renderProducts();
}
