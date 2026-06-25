document.addEventListener('DOMContentLoaded', async function () {

  /* ── Auth Header ───────────────────────────── */
  const user = getUser();
  if (user) {
    document.querySelectorAll('.action-btn span:last-child').forEach(el => {
      if (el.textContent === 'My profile') el.textContent = user.name.split(' ')[0];
    });
    document.querySelectorAll('a[href="auth.html"]').forEach(a => {
      if (a.textContent.trim() === 'Log in' || a.textContent.trim() === 'Login') {
        a.textContent = 'Logout';
        a.href = '#';
        a.addEventListener('click', e => { e.preventDefault(); apiLogout(); });
      }
    });
  }

  /* ── Cart Count ────────────────────────────── */
  async function refreshCartCount() {
    try {
      if (isLoggedIn()) {
        const cart = await apiGetCart();
        const count = (cart.items || []).reduce((s, i) => s + i.qty, 0);
        document.querySelectorAll('.cart-count-badge').forEach(b => {
          b.textContent = count;
          b.style.display = count > 0 ? 'flex' : 'none';
        });
      }
    } catch {}
  }
  await refreshCartCount();

  /* ── Login Form ────────────────────────────── */
  const loginForm = document.querySelector('.login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const email    = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      const btn      = loginForm.querySelector('button[type="submit"]');
      btn.textContent = 'Logging in...'; btn.disabled = true;
      try {
        const data = await apiLogin(email, password);
        alert('Welcome, ' + data.user.name + '!');
        window.location.href = data.user.role === 'admin' ? 'admin-dashboard.html' : 'index.html';
      } catch (err) {
        alert(err.message);
        btn.textContent = 'Login'; btn.disabled = false;
      }
    });
  }

  /* ── Signup Form ───────────────────────────── */
  const signupForm = document.querySelector('.signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const name     = document.getElementById('signup-name').value.trim();
      const email    = document.getElementById('signup-email').value.trim();
      const phone    = document.getElementById('signup-phone').value.trim();
      const password = document.getElementById('signup-password').value;
      const btn      = signupForm.querySelector('button[type="submit"]');
      btn.textContent = 'Creating...'; btn.disabled = true;
      try {
        await apiRegister(name, email, phone, password);
        alert('Account created! Welcome, ' + name + '!');
        window.location.href = 'index.html';
      } catch (err) {
        alert(err.message);
        btn.textContent = 'Create Account'; btn.disabled = false;
      }
    });
  }

  /* ── Products Page ─────────────────────────── */
  const productsContainer = document.getElementById('productsContainer');
  if (productsContainer) {
    const urlParams = new URLSearchParams(window.location.search);
    const params = {};
    if (urlParams.get('category')) params.category = urlParams.get('category');
    if (urlParams.get('search'))   params.search   = urlParams.get('search');
    try {
      const data = await apiGetProducts(params);
      if (!data.products || data.products.length === 0) {
        productsContainer.innerHTML = '<p style="padding:40px;text-align:center">No products found.</p>';
      } else {
        productsContainer.innerHTML = data.products.map(p => `
          <article class="product-card">
            <a href="product-details.html?id=${p._id}">
              <div class="product-image">
                <img src="${getImageUrl(p.image)}" alt="${p.name}" style="width:100%;height:200px;object-fit:cover;">
              </div>
              <div class="product-details">
                <h3>${p.name}</h3>
                <p class="product-price">$${p.price.toFixed(2)}</p>
              </div>
            </a>
            <button class="add-to-cart-btn" data-id="${p._id}">Add to cart</button>
          </article>
        `).join('');
        attachAddToCartButtons();
      }
    } catch (err) {
      productsContainer.innerHTML = '<p style="padding:40px;color:red">' + err.message + '</p>';
    }
  }

  /* ── Product Details Page ──────────────────── */
  if (window.location.pathname.includes('product-details')) {
    const id = new URLSearchParams(window.location.search).get('id');
    if (id) {
      try {
        const p = await apiGetProduct(id);
        const titleEl = document.querySelector('.product-information h1');
        const priceEl = document.querySelector('.price-main');
        const descEl  = document.querySelector('.product-description p');
        const mainImg = document.querySelector('.main-product-image img');
        if (titleEl) titleEl.textContent = p.name;
        if (priceEl) priceEl.textContent = '$' + p.price.toFixed(2);
        if (descEl)  descEl.textContent  = p.description;
        if (mainImg) mainImg.src = getImageUrl(p.image);
        document.querySelectorAll('.btn-cart').forEach(btn => btn.dataset.id = p._id);
      } catch (err) { console.error('Product load error:', err.message); }
    }
  }

  /* ── Add To Cart Buttons ───────────────────── */
  function attachAddToCartButtons() {
    document.querySelectorAll('.add-to-cart-btn, .btn-cart').forEach(btn => {
      btn.addEventListener('click', async function () {
        if (!isLoggedIn()) {
          alert('Please login to add items to cart.');
          return window.location.href = 'auth.html';
        }
        const productId = this.dataset.id;
        const size  = document.querySelector('.size-btn.active')?.textContent || '';
        const color = document.querySelector('.color-btn.active')?.style.background || '';
        const qty   = parseInt(document.querySelector('.quantity-controls input')?.value || 1);
        try {
          await apiAddToCart(productId, qty, size, color);
          await refreshCartCount();
          alert('Added to cart!');
        } catch (err) { alert(err.message); }
      });
    });
  }
  attachAddToCartButtons();

  /* ── Cart Page ─────────────────────────────── */
  const cartItemsSection = document.querySelector('.cart-items-section');
  if (cartItemsSection && isLoggedIn()) {
    try {
      const cart = await apiGetCart();
      if (cart.items && cart.items.length > 0) {
        document.querySelectorAll('.cart-item').forEach(el => el.remove());
        cart.items.forEach(item => {
          const el = document.createElement('article');
          el.className = 'cart-item';
          el.innerHTML = `
            <input type="checkbox" checked>
            <div class="cart-item-image">
              <img src="${getImageUrl(item.product?.image)}" alt="${item.product?.name}" style="width:80px;height:80px;object-fit:cover;">
            </div>
            <div class="cart-item-details">
              <h2>${item.product?.name}</h2>
              <p class="cart-item-meta">Size: ${item.size || '-'} | Color: ${item.color || '-'}</p>
            </div>
            <div class="cart-item-quantity">
              <button type="button" class="qty-minus">-</button>
              <input type="number" value="${item.qty}" min="1">
              <button type="button" class="qty-plus">+</button>
            </div>
            <div class="cart-item-price"><p>$${(item.price * item.qty).toFixed(2)}</p></div>
            <div class="cart-item-remove"><button type="button">✕</button></div>
          `;
          const saveLater = document.querySelector('.save-later-bar');
          cartItemsSection.insertBefore(el, saveLater);

          el.querySelector('.qty-minus').addEventListener('click', async () => {
            const inp = el.querySelector('input[type=number]');
            let v = parseInt(inp.value);
            if (v > 1) { inp.value = --v; await apiUpdateCartItem(item._id, v); await refreshCartCount(); }
          });
          el.querySelector('.qty-plus').addEventListener('click', async () => {
            const inp = el.querySelector('input[type=number]');
            let v = parseInt(inp.value) + 1; inp.value = v;
            await apiUpdateCartItem(item._id, v); await refreshCartCount();
          });
          el.querySelector('.cart-item-remove button').addEventListener('click', async () => {
            await apiRemoveCartItem(item._id);
            el.style.opacity = '0'; setTimeout(() => el.remove(), 300);
            await refreshCartCount();
          });
        });
        const subtotal = cart.items.reduce((s, i) => s + i.price * i.qty, 0);
        const subtotalEl = document.querySelectorAll('.summary-item span:last-child')[0];
        if (subtotalEl) subtotalEl.textContent = '$' + subtotal.toFixed(2);
      }
    } catch (err) { console.error('Cart error:', err.message); }
  }

  /* ── Checkout ──────────────────────────────── */
  const checkoutBtn = document.querySelector('.checkout-page .checkout-btn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', async () => {
      if (!isLoggedIn()) { alert('Please login first.'); return window.location.href = 'auth.html'; }
      const inputs = document.querySelectorAll('.checkout-form-section input[type=text]');
      const shippingAddress = {
        firstName: inputs[0]?.value, lastName: inputs[1]?.value,
        email:     document.querySelector('.checkout-form-section input[type=email]')?.value,
        phone:     document.querySelector('.checkout-form-section input[type=tel]')?.value,
        address:   inputs[2]?.value, city: inputs[3]?.value,
        zipCode:   inputs[4]?.value,
        country:   document.querySelector('.checkout-form-section select')?.value
      };
      const paymentMethod = document.querySelector('input[name="payment"]:checked')
        ?.closest('.payment-option')?.querySelector('span')?.textContent || 'Card';
      const couponCode = document.querySelector('.coupon-input input')?.value || '';
      try {
        checkoutBtn.textContent = 'Placing order...'; checkoutBtn.disabled = true;
        const order = await apiPlaceOrder(shippingAddress, paymentMethod, couponCode);
        alert('Order placed! Order ID: ' + order._id);
        await refreshCartCount();
        window.location.href = 'index.html';
      } catch (err) {
        alert(err.message);
        checkoutBtn.textContent = 'Place Order'; checkoutBtn.disabled = false;
      }
    });
  }

  /* ── Admin Dashboard ───────────────────────── */
  const statsGrid = document.querySelector('.stats-grid');
  if (statsGrid && isLoggedIn()) {
    try {
      const stats = await adminGetStats();
      const cards = statsGrid.querySelectorAll('.stat-value');
      if (cards[0]) cards[0].textContent = stats.totalProducts;
      if (cards[1]) cards[1].textContent = stats.totalOrders;
      if (cards[2]) cards[2].textContent = stats.totalCustomers;
      if (cards[3]) cards[3].textContent = '$' + stats.totalRevenue;
    } catch {}

    try {
      const orders = await adminGetOrders();
      const tbody = document.querySelector('.recent-orders-section tbody');
      if (tbody && orders.length) {
        tbody.innerHTML = orders.slice(0, 10).map(o => `
          <tr>
            <td>#${o._id.slice(-6).toUpperCase()}</td>
            <td>${o.user?.name || 'N/A'}</td>
            <td>$${o.total.toFixed(2)}</td>
            <td><span class="status-badge ${o.status === 'Delivered' ? 'active' : o.status === 'Pending' ? 'pending' : 'inactive'}">${o.status}</span></td>
            <td>${new Date(o.createdAt).toLocaleDateString()}</td>
          </tr>`).join('');
      }
    } catch {}

    try {
      const { products } = await apiGetProducts({ limit: 20 });
      const tbody = document.querySelector('.products-management-section tbody');
      if (tbody && products.length) {
        tbody.innerHTML = products.map(p => `
          <tr>
            <td><img src="${getImageUrl(p.image)}" alt="${p.name}" style="width:60px;height:60px;object-fit:cover;border-radius:4px"></td>
            <td>${p.name}</td>
            <td>$${p.price.toFixed(2)}</td>
            <td>${p.stock}</td>
            <td><span class="status-badge ${p.status === 'active' ? 'active' : 'inactive'}">${p.status}</span></td>
            <td>
              <button type="button" class="btn-edit">Edit</button>
              <button type="button" class="btn-delete" data-id="${p._id}">Delete</button>
            </td>
          </tr>`).join('');
        tbody.querySelectorAll('.btn-delete').forEach(btn => {
          btn.addEventListener('click', async () => {
            if (!confirm('Delete this product?')) return;
            try { await adminDeleteProduct(btn.dataset.id); btn.closest('tr').remove(); }
            catch (err) { alert(err.message); }
          });
        });
      }
    } catch {}
  }

  /* ── Admin Add Product Form ────────────────── */
  const addProductForm = document.querySelector('.add-product-form');
  if (addProductForm) {
    addProductForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const formData = new FormData();
      formData.append('name',        document.getElementById('product-name').value);
      formData.append('price',       document.getElementById('product-price').value);
      formData.append('category',    document.getElementById('product-category').value);
      formData.append('stock',       document.getElementById('product-stock').value);
      formData.append('description', document.getElementById('product-desc').value);
      const imgFile = document.getElementById('product-image').files[0];
      if (imgFile) formData.append('image', imgFile);
      const btn = addProductForm.querySelector('button[type="submit"]');
      btn.textContent = 'Adding...'; btn.disabled = true;
      try {
        await adminAddProduct(formData);
        alert('Product added!');
        addProductForm.reset();
        window.location.reload();
      } catch (err) {
        alert(err.message);
        btn.textContent = 'Add Product'; btn.disabled = false;
      }
    });
  }

  /* ── Search Bar ────────────────────────────── */
  const searchBtn = document.querySelector('.search-bar button');
  const searchInput = document.querySelector('.search-bar input');
  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      const q = searchInput?.value.trim();
      if (q) window.location.href = 'products.html?search=' + q;
    });
    searchInput?.addEventListener('keypress', e => { if (e.key === 'Enter') searchBtn.click(); });
  }

  /* ── Size / Color / Qty Controls ──────────── */
  document.querySelectorAll('.size-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
  document.querySelectorAll('.color-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
  document.querySelectorAll('.quantity-controls, .cart-item-quantity').forEach(control => {
    const [minusBtn, plusBtn] = control.querySelectorAll('button');
    const input = control.querySelector('input');
    if (minusBtn && plusBtn && input) {
      minusBtn.addEventListener('click', () => { let v = parseInt(input.value)||1; if(v>1) input.value=v-1; });
      plusBtn.addEventListener('click',  () => { input.value=(parseInt(input.value)||1)+1; });
    }
  });

  /* ── Product Tabs ──────────────────────────── */
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  /* ── Newsletter ────────────────────────────── */
  document.querySelectorAll('.newsletter-form').forEach(form => {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const input = form.querySelector('input[type="email"]');
      if (input?.value.trim()) { alert('Subscribed!'); input.value = ''; }
    });
  });

  /* ── Scroll Fade-in ────────────────────────── */
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in-view'); });
  }, { threshold: 0.1 });
  document.querySelectorAll('.product-card,.category-card,.deal-card,.testimonial-card,.service-card,.region-item')
    .forEach(el => observer.observe(el));

  /* ── Hamburger Menu ────────────────────────── */
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const navbar = document.querySelector('.navbar');
  if (navbar && hamburgerBtn) {
    const overlay = document.createElement('div');
    overlay.className = 'mobile-menu-overlay';
    const mobileMenu = document.createElement('div');
    mobileMenu.className = 'mobile-menu';
    mobileMenu.innerHTML = `
      <button class="mobile-menu-close" id="mobileMenuClose">✕</button>
      <ul>
        <li><a href="index.html">🏠 Home</a></li>
        <li><a href="products.html">📦 Products</a></li>
        <li><a href="auth.html">🔑 ${isLoggedIn() ? 'Logout' : 'Login'}</a></li>
        <li><a href="cart.html">🛒 My Cart</a></li>
      </ul>`;
    document.body.appendChild(overlay);
    document.body.appendChild(mobileMenu);
    const openMenu  = () => { mobileMenu.classList.add('open'); overlay.style.display='block'; document.body.style.overflow='hidden'; };
    const closeMenu = () => { mobileMenu.classList.remove('open'); overlay.style.display='none'; document.body.style.overflow=''; };
    hamburgerBtn.addEventListener('click', openMenu);
    overlay.addEventListener('click', closeMenu);
    document.getElementById('mobileMenuClose').addEventListener('click', closeMenu);
  }

  /* ── Countdown Timer ───────────────────────── */
  const timerBlocks = document.querySelectorAll('.timer-block span');
  if (timerBlocks.length === 3) {
    let total = 4*3600 + 13*60 + 56;
    setInterval(() => {
      if (total <= 0) return; total--;
      timerBlocks[0].textContent = String(Math.floor(total/3600)).padStart(2,'0');
      timerBlocks[1].textContent = String(Math.floor((total%3600)/60)).padStart(2,'0');
      timerBlocks[2].textContent = String(total%60).padStart(2,'0');
    }, 1000);
  }

  /* ── Checkout Payment Toggle ───────────────── */
  const cardFields = document.querySelector('.card-fields');
  document.querySelectorAll('input[name="payment"]').forEach(radio => {
    radio.addEventListener('change', function () {
      if (!cardFields) return;
      const label = this.closest('.payment-option')?.querySelector('span')?.textContent;
      cardFields.style.display = label?.includes('Card') ? 'block' : 'none';
    });
  });

});