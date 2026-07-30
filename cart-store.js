/* Shared cart + checkout-info storage (localStorage, no backend). */
const CART_KEY = 'meseum_cart';
const CHECKOUT_INFO_KEY = 'meseum_checkout_info';

/* Google Apps Script Web App URL — deploy apps-script/Code.gs against your
   order spreadsheet, then paste the /exec URL here. Used by cart.js (submit
   order → sheet + emails) and lookup.js (order history lookup). Left empty
   until deployed; both pages fall back to a clear "not connected yet" state. */
const ORDER_API_URL = 'https://script.google.com/macros/s/AKfycbzHOCvmFAsNcsrUdiqJIfkNJ_gX6baBDcx-v3s1JgODdtHULQ-FPOsO4Sl0J--0zjLKDA/exec';

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch (err) {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function addCartItem(item) {
  const cart = getCart();
  cart.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, ...item });
  saveCart(cart);
  return cart;
}

function removeCartItem(id) {
  const cart = getCart().filter((item) => item.id !== id);
  saveCart(cart);
  return cart;
}

function getCartCount() {
  return getCart().length;
}

function getCheckoutInfo() {
  try {
    return JSON.parse(localStorage.getItem(CHECKOUT_INFO_KEY)) || null;
  } catch (err) {
    return null;
  }
}

function saveCheckoutInfo(info) {
  localStorage.setItem(CHECKOUT_INFO_KEY, JSON.stringify(info));
}

/* First copy of a given book is full price; every additional copy of that
   same line item is 85% off. A cart-wide discount code (if valid) applies
   9折 on top of both tiers. A flat-amount code instead deducts a fixed
   NT$ amount from the books subtotal once, after the per-book math. */
function calcBookTotal(price, quantity, discountRate, discountValid) {
  if (!quantity) return 0;
  const unitFirst = discountValid ? Math.round(price * discountRate) : price;
  const unitRest = discountValid ? Math.round(price * discountRate * 0.85) : Math.round(price * 0.85);
  return unitFirst + (quantity - 1) * unitRest;
}

function computeCartTotals(cart, { discountRate = 1, discountCodeValid = false, discountFlatAmount = 0, shippingFee = 0 } = {}) {
  let booksTotal = 0;
  const itemTotals = cart.map((item) => {
    const bookTotal = calcBookTotal(item.price, item.quantity, discountRate, discountCodeValid);
    const subtotal = bookTotal + item.addonPrice;
    booksTotal += subtotal;
    return { id: item.id, bookTotal, subtotal };
  });

  booksTotal = Math.max(0, booksTotal - discountFlatAmount);

  return {
    itemTotals,
    booksTotal,
    shippingFee,
    grandTotal: booksTotal + shippingFee,
  };
}

function updateCartBadge() {
  document.querySelectorAll('[data-cart-count]').forEach((el) => {
    const count = getCartCount();
    el.textContent = ` (${count})`;
    el.hidden = count === 0;
  });
}

document.addEventListener('DOMContentLoaded', updateCartBadge);
