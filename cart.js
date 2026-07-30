const checkoutState = {
  discountRate: 1,
  discountFlatAmount: 0,
  discountCodeValid: false,
  shippingType: '',
  shippingLabel: '',
  shippingFee: 0,
  termsAgreed: false,
};

/* Codes themselves live in discount-codes.js (loaded before this file) —
   edit that file to add, change, or retire a code. */

function renderCart() {
  const cart = getCart();
  const itemsEl = document.getElementById('cartItems');
  const emptyEl = document.getElementById('cartEmpty');
  const form = document.getElementById('checkoutForm');
  const summaryEl = document.getElementById('cartSummary');
  const checkoutBtn = document.getElementById('checkoutBtn');

  itemsEl.innerHTML = '';

  if (!cart.length) {
    emptyEl.hidden = false;
    form.hidden = true;
    summaryEl.hidden = true;
    checkoutBtn.hidden = true;
    return;
  }

  emptyEl.hidden = true;
  form.hidden = false;
  summaryEl.hidden = false;
  checkoutBtn.hidden = false;

  const { itemTotals } = computeCartTotals(cart, checkoutState);
  const totalById = Object.fromEntries(itemTotals.map((t) => [t.id, t]));

  cart.forEach((item) => {
    const subtotal = totalById[item.id] ? totalById[item.id].subtotal : 0;
    const row = document.createElement('div');
    row.className = 'cart-item';
    row.innerHTML = `
      <div class="cart-item__media">
        <img src="${item.image}" alt="${item.styleName}">
      </div>
      <div class="cart-item__body">
        <div class="cart-item__heading">
          <span class="cart-item__name">${item.styleName}</span>
          <button type="button" class="cart-item__remove" data-id="${item.id}">移除</button>
        </div>
        <div class="cart-item__specs">
          <div class="spec-row"><span class="spec-label">頁數</span><span class="spec-value">${item.pages}</span></div>
          <div class="spec-row"><span class="spec-label">數量</span><span class="spec-value">${item.quantity}本</span></div>
          <div class="spec-row"><span class="spec-label">加值服務</span><span class="spec-value">${item.addonLabel}</span></div>
        </div>
        <div class="cart-item__subtotal cart-item__subtotal--amount-only">
          <span>$${subtotal}</span>
        </div>
      </div>
    `;
    itemsEl.appendChild(row);
  });

  itemsEl.querySelectorAll('.cart-item__remove').forEach((btn) => {
    btn.addEventListener('click', () => {
      removeCartItem(btn.dataset.id);
      updateCartBadge();
      renderCart();
    });
  });

  renderSummary();
}

function renderSummary() {
  const cart = getCart();
  const { booksTotal, shippingFee, grandTotal } = computeCartTotals(cart, checkoutState);

  document.getElementById('summaryBooks').textContent = `$${booksTotal}`;

  const shippingListEl = document.getElementById('summaryShippingList');
  shippingListEl.innerHTML = checkoutState.shippingType
    ? `<div class="cart-summary__row cart-summary__row--sub">
        <span>運費（${checkoutState.shippingLabel}）</span>
        <span>$${shippingFee}</span>
      </div>`
    : '';

  document.getElementById('summaryTotal').textContent = `NT$${grandTotal}`;
}

/* ---------- Discount code (applies once, to the whole cart) ---------- */
function setupDiscountCode() {
  const input = document.getElementById('discountCode');
  const hint = document.getElementById('discountHint');
  input.addEventListener('input', () => {
    const code = input.value.trim().toLowerCase();
    const entry = code ? DISCOUNT_CODES[code] : undefined;

    checkoutState.discountRate = 1;
    checkoutState.discountFlatAmount = 0;
    checkoutState.discountCodeValid = false;

    if (!code) {
      hint.textContent = '';
    } else if (entry && isDiscountCodeActive(entry)) {
      checkoutState.discountCodeValid = true;
      if (entry.type === 'flat') {
        checkoutState.discountFlatAmount = entry.amount;
        hint.textContent = `折扣碼已套用（現折 NT$${entry.amount}）`;
      } else {
        checkoutState.discountRate = entry.rate;
        hint.textContent = `折扣碼已套用（${Math.round(entry.rate * 10)}折優惠）`;
      }
      hint.style.color = '#3b7a3b';
    } else {
      hint.textContent = '折扣碼無效';
      hint.style.color = '#b23b3b';
    }
    renderSummary();
  });
}

/* ---------- Shipping accordion + conditional detail field ---------- */

/* Overseas home-delivery fee is auto-estimated from keywords typed into the
   address field (no country field exists to read instead). Checked in order;
   first match wins. Fee may need a top-up later if the post office's actual
   rate for that address comes in higher than this estimate. */
const OVERSEAS_FEE_RULES = [
  { test: /香港|hong\s*kong|\bhk\b/i, fee: 150, note: '*香港宅配費用為$150' },
  { test: /美國|美国|united states|\busa\b|\bu\.s\.a?\.?\b/i, fee: 1000, note: '*美國宅配費用先收$1000，實際運費依郵局公告金額計算，如有差額將另行通知補足運費' },
  { test: /日本|japan/i, fee: 500, note: '*日本宅配費用先收$500，實際運費依郵局公告金額計算，如有差額將另行通知補足運費' },
  { test: /韓國|韩国|korea/i, fee: 500, note: '*韓國宅配費用先收$500，實際運費依郵局公告金額計算，如有差額將另行通知補足運費' },
];
const OVERSEAS_FEE_FALLBACK = { fee: 350, note: '*海外宅配費用先收$350，實際運費依郵局公告金額計算，如有差額將另行通知補足運費' };

function detectOverseasFee(address) {
  const rule = OVERSEAS_FEE_RULES.find((r) => r.test.test(address));
  return rule || OVERSEAS_FEE_FALLBACK;
}

function setupShipping() {
  const field = document.querySelector('[data-field="shipping"]');
  const row = field.querySelector('.field__row');

  row.addEventListener('click', () => {
    field.classList.toggle('is-open');
  });

  field.querySelectorAll('.option').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      field.querySelectorAll('.option').forEach((o) => o.classList.remove('is-selected'));
      btn.classList.add('is-selected');

      checkoutState.shippingType = btn.dataset.type;
      checkoutState.shippingLabel = btn.dataset.label;
      checkoutState.shippingFee = Number(btn.dataset.fee);

      updateShippingFieldValue(field);
      field.classList.remove('is-open');
      updateShippingDetailField();
      renderSummary();
    });
  });

  document.getElementById('shippingDetail').addEventListener('input', (e) => {
    if (checkoutState.shippingType !== 'oversea') return;

    const note = document.getElementById('shippingFeeNote');
    const address = e.target.value.trim();

    if (!address) {
      checkoutState.shippingFee = 0;
      note.textContent = '';
    } else {
      const { fee, note: noteText } = detectOverseasFee(address);
      checkoutState.shippingFee = fee;
      note.textContent = noteText;
    }

    updateShippingFieldValue(field);
    renderSummary();
  });
}

function updateShippingFieldValue(field) {
  field.querySelector('.field__value').textContent = checkoutState.shippingFee > 0
    ? `${checkoutState.shippingLabel}  $${checkoutState.shippingFee}`
    : checkoutState.shippingLabel;
}

function updateShippingDetailField() {
  const detailField = document.getElementById('shippingDetailField');
  const label = document.getElementById('shippingDetailLabel');
  const input = document.getElementById('shippingDetail');
  const note = document.getElementById('shippingFeeNote');

  detailField.hidden = false;

  if (checkoutState.shippingType === 'home') {
    label.textContent = '收件地址';
    input.placeholder = '請輸入完整收件地址';
    note.textContent = '';
  } else if (checkoutState.shippingType === '711') {
    label.textContent = '711店名+店號';
    input.placeholder = '例：恩太門市 123456';
    note.textContent = '';
  } else if (checkoutState.shippingType === 'family') {
    label.textContent = '全家店名+店號';
    input.placeholder = '例：恩太門市 123456';
    note.textContent = '';
  } else if (checkoutState.shippingType === 'oversea') {
    label.textContent = '海外收件地址';
    input.placeholder = '請輸入完整海外收件地址（含國家）';
    note.textContent = input.value.trim() ? note.textContent : '';
  }
}

/* ---------- Terms modal ---------- */
function setupTermsModal() {
  const modal = document.getElementById('termsModal');
  const openBtn = document.getElementById('openTerms');
  const closeBtn = document.getElementById('closeTerms');
  const overlay = document.getElementById('termsOverlay');
  const body = document.getElementById('modalBody');
  const agreeRow = document.getElementById('modalAgreeRow');
  const modalCheckbox = document.getElementById('modalAgreeCheckbox');
  const mainCheckLabel = document.querySelector('.terms-check');

  const checkScrollComplete = () => {
    if (body.scrollTop + body.clientHeight >= body.scrollHeight - 4) {
      agreeRow.classList.add('is-visible');
    }
  };

  openBtn.addEventListener('click', () => {
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(checkScrollComplete);
  });

  const close = () => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
  };
  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', close);

  body.addEventListener('scroll', checkScrollComplete);

  agreeRow.addEventListener('click', () => {
    modalCheckbox.checked = !modalCheckbox.checked;
    checkoutState.termsAgreed = modalCheckbox.checked;
    agreeRow.classList.toggle('is-checked', checkoutState.termsAgreed);
    mainCheckLabel.classList.toggle('is-checked', checkoutState.termsAgreed);
    if (checkoutState.termsAgreed) {
      setTimeout(close, 250);
    }
  });
}

/* ---------- Prefill from last checkout (convenience only) ---------- */
function prefillCheckoutInfo() {
  const info = getCheckoutInfo();
  if (!info) return;

  document.getElementById('lineName').value = info.lineName || '';
  document.getElementById('recipientName').value = info.recipientName || '';
  document.getElementById('recipientPhone').value = info.recipientPhone || '';
  document.getElementById('email').value = info.email || '';

  if (info.shippingType) {
    const btn = document.querySelector(`[data-field="shipping"] .option[data-type="${info.shippingType}"]`);
    if (btn) btn.click();

    if (info.shippingDetail) {
      const input = document.getElementById('shippingDetail');
      input.value = info.shippingDetail;
      input.dispatchEvent(new Event('input'));
    }
  }
}

/* ---------- Checkout submit ---------- */
function buildOrderPayload(cart) {
  const { itemTotals, booksTotal, shippingFee, grandTotal } = computeCartTotals(cart, checkoutState);
  const totalById = Object.fromEntries(itemTotals.map((t) => [t.id, t]));

  return {
    orderId: `M${Date.now()}`,
    lineName: document.getElementById('lineName').value.trim(),
    recipientName: document.getElementById('recipientName').value.trim(),
    recipientPhone: document.getElementById('recipientPhone').value.trim(),
    shippingType: checkoutState.shippingType,
    shippingLabel: checkoutState.shippingLabel,
    shippingFee,
    shippingDetail: document.getElementById('shippingDetail').value.trim(),
    email: document.getElementById('email').value.trim(),
    remark: document.getElementById('remark').value.trim(),
    discountCode: document.getElementById('discountCode').value.trim(),
    discountApplied: checkoutState.discountCodeValid,
    items: cart.map((item) => ({
      styleKey: item.styleKey,
      styleName: item.styleName,
      price: item.price,
      pages: item.pages,
      quantity: item.quantity,
      addonLabel: item.addonLabel,
      addonPrice: item.addonPrice,
      bookTotal: totalById[item.id].bookTotal,
    })),
    booksTotal,
    shippingTotal: shippingFee,
    grandTotal,
  };
}

function setupCheckout() {
  const form = document.getElementById('checkoutForm');
  const errorEl = document.getElementById('checkoutError');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.hidden = true;

    const cart = getCart();
    if (!cart.length) return;

    const missing = [];
    if (!document.getElementById('lineName').value.trim()) missing.push('Line名稱');
    if (!document.getElementById('recipientName').value.trim()) missing.push('收件人姓名');
    if (!document.getElementById('recipientPhone').value.trim()) missing.push('收件人電話');
    if (!checkoutState.shippingType) missing.push('配送方式');
    if (checkoutState.shippingType && !document.getElementById('shippingDetail').value.trim()) missing.push('收件地址/店名店號');
    if (!document.getElementById('email').value.trim()) missing.push('Email');
    if (!checkoutState.termsAgreed) missing.push('同意訂購須知規範');

    if (missing.length) {
      alert(`請完成以下必填欄位：\n${missing.join('、')}`);
      return;
    }

    if (!ORDER_API_URL) {
      alert('尚未連接訂單後端（ORDER_API_URL 未設定），暫時無法送出訂單，請聯繫網站管理者完成部署設定。');
      return;
    }

    const btn = document.getElementById('checkoutBtn');
    const payload = buildOrderPayload(cart);

    btn.disabled = true;
    btn.textContent = '送出中…';

    try {
      const res = await fetch(ORDER_API_URL, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!result.ok) throw new Error(result.error || '送出失敗');

      saveCheckoutInfo({
        lineName: payload.lineName,
        recipientName: payload.recipientName,
        recipientPhone: payload.recipientPhone,
        shippingType: payload.shippingType,
        shippingDetail: payload.shippingDetail,
        email: payload.email,
      });

      saveCart([]);
      updateCartBadge();

      location.href = `order-confirmation.html?orderId=${encodeURIComponent(payload.orderId)}`;
    } catch (err) {
      errorEl.textContent = `訂單送出失敗，請稍後再試一次，或直接透過 LINE 與我們聯繫。（${err.message}）`;
      errorEl.hidden = false;
      btn.disabled = false;
      btn.textContent = '送出訂單';
    }
  });
}

renderCart();
setupDiscountCode();
setupShipping();
setupTermsModal();
prefillCheckoutInfo();
setupCheckout();
