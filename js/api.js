const API = 'http://localhost:5000/api';
const IMG = 'http://localhost:5000';

function getToken()   { return localStorage.getItem('token'); }
function saveToken(t) { localStorage.setItem('token', t); }
function saveUser(u)  { localStorage.setItem('user', JSON.stringify(u)); }
function getUser()    { return JSON.parse(localStorage.getItem('user') || 'null'); }
function clearAuth()  { localStorage.removeItem('token'); localStorage.removeItem('user'); }
function isLoggedIn() { return !!getToken(); }

async function apiFetch(endpoint, method = 'GET', body = null, auth = false) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) headers['Authorization'] = 'Bearer ' + getToken();
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API + endpoint, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

async function apiRegister(name, email, phone, password) {
  const data = await apiFetch('/auth/register', 'POST', { name, email, phone, password });
  saveToken(data.token); saveUser(data.user); return data;
}

async function apiLogin(email, password) {
  const data = await apiFetch('/auth/login', 'POST', { email, password });
  saveToken(data.token); saveUser(data.user); return data;
}

function apiLogout() { clearAuth(); window.location.href = 'auth.html'; }

async function apiGetProducts(params = {}) {
  const q = new URLSearchParams(params).toString();
  return apiFetch('/products?' + q);
}

async function apiGetProduct(id) { return apiFetch('/products/' + id); }

async function apiGetCart()                    { return apiFetch('/cart', 'GET', null, true); }
async function apiAddToCart(productId, qty, size, color) { return apiFetch('/cart', 'POST', { productId, qty, size, color }, true); }
async function apiUpdateCartItem(itemId, qty)  { return apiFetch('/cart/' + itemId, 'PUT', { qty }, true); }
async function apiRemoveCartItem(itemId)       { return apiFetch('/cart/' + itemId, 'DELETE', null, true); }
async function apiClearCart()                  { return apiFetch('/cart', 'DELETE', null, true); }

async function apiPlaceOrder(shippingAddress, paymentMethod, couponCode) {
  return apiFetch('/orders', 'POST', { shippingAddress, paymentMethod, couponCode }, true);
}
async function apiGetMyOrders() { return apiFetch('/orders/my', 'GET', null, true); }

async function adminAddProduct(formData) {
  const res = await fetch(API + '/products', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + getToken() },
    body: formData
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
}

async function adminDeleteProduct(id)              { return apiFetch('/products/' + id, 'DELETE', null, true); }
async function adminGetOrders()                    { return apiFetch('/orders', 'GET', null, true); }
async function adminUpdateOrderStatus(id, status)  { return apiFetch('/orders/' + id + '/status', 'PUT', { status }, true); }

async function adminGetStats() {
  const [userStats, products, orders] = await Promise.all([
    apiFetch('/users/stats', 'GET', null, true),
    apiFetch('/products?limit=1'),
    apiFetch('/orders', 'GET', null, true)
  ]);
  const revenue = orders.reduce((s, o) => s + o.total, 0);
  return {
    totalProducts:  products.total,
    totalOrders:    orders.length,
    totalCustomers: userStats.total,
    totalRevenue:   revenue.toFixed(2)
  };
}

function getImageUrl(imagePath) {
  if (!imagePath) return 'https://placehold.co/300x300/eee/999?text=No+Image';
  if (imagePath.startsWith('http')) return imagePath;
  return IMG + imagePath;
}