const params = new URLSearchParams(location.search);
const styleKey = PRODUCTS[params.get('style')] ? params.get('style') : 'ethereal';
const product = PRODUCTS[styleKey];

const state = {
  pages: '',
  quantity: 0,
  addonLabel: '',
  addonPrice: 0,
};

function renderProductInfo() {
  const el = document.getElementById('productInfo');
  el.innerHTML = `
    <div class="product-info__media">
      <img src="${product.images[0]}" alt="${product.name}">
    </div>
    <div class="product-info__body">
      <div class="product-info__heading">
        <span class="product-info__name">${product.name}</span>
        <span class="product-info__price">$${product.price}</span>
      </div>
      <div class="product-info__features">
        ${product.featuresZh.map((f) => `<p>${f}</p>`).join('')}
      </div>
      <div class="product-info__specs">
        ${product.specsZh
          .map(([label, value]) => `<div class="spec-row"><span class="spec-label">${label}</span><span class="spec-value">${value}</span></div>`)
          .join('')}
      </div>
    </div>
  `;
}

function buildPageOptions() {
  const wrap = document.getElementById('pageOptions');
  wrap.innerHTML = product.pageOptions
    .map((value) => `<button type="button" class="option" data-value="${value}">${value}</button>`)
    .join('');
}

function buildQuantityOptions() {
  const wrap = document.getElementById('quantityOptions');
  let html = '';
  for (let i = 1; i <= 9; i++) {
    html += `<button type="button" class="option" data-value="${i}">${i}本</button>`;
    if (i === 2) {
      html += `<p class="field__hint field__hint--note field__hint--inline">此為同一份內容的加印本數，第2本起85折</p>`;
    }
  }
  html += `<button type="button" class="option" data-value="custom">10本以上</button>`;
  html += `
    <div class="qty-custom" id="qtyCustomRow" hidden>
      <input type="number" id="qtyCustomInput" min="10" step="1" placeholder="請輸入">
      <span>本</span>
    </div>
  `;
  wrap.innerHTML = html;
}

/* ---------- Accordion open/close ---------- */
function setupAccordions() {
  document.querySelectorAll('.field--accordion').forEach((field) => {
    const row = field.querySelector('.field__row');
    row.addEventListener('click', () => {
      const isOpen = field.classList.contains('is-open');
      document.querySelectorAll('.field--accordion.is-open').forEach((f) => {
        if (f !== field) f.classList.remove('is-open');
      });
      field.classList.toggle('is-open', !isOpen);
    });
  });

  document.querySelectorAll('.field--accordion .option').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const field = btn.closest('.field--accordion');
      const key = field.dataset.field;

      if (key === 'quantity') {
        handleQuantitySelect(btn, field);
        return;
      }

      field.querySelectorAll('.option').forEach((o) => o.classList.remove('is-selected'));
      btn.classList.add('is-selected');

      if (key === 'pages') {
        state.pages = btn.dataset.value;
        setFieldValue(field, state.pages);
        closeField(field);
      } else if (key === 'addon') {
        state.addonLabel = btn.dataset.value;
        state.addonPrice = Number(btn.dataset.price);
        setFieldValue(field, state.addonLabel);
        closeField(field);
      }

      updateTotal();
    });
  });
}

function handleQuantitySelect(btn, field) {
  const customRow = document.getElementById('qtyCustomRow');
  if (btn.dataset.value === 'custom') {
    field.querySelectorAll('.option').forEach((o) => o.classList.remove('is-selected'));
    btn.classList.add('is-selected');
    customRow.hidden = false;
    document.getElementById('qtyCustomInput').focus();
    return;
  }
  customRow.hidden = true;
  field.querySelectorAll('.option').forEach((o) => o.classList.remove('is-selected'));
  btn.classList.add('is-selected');
  state.quantity = Number(btn.dataset.value);
  setFieldValue(field, `${state.quantity}本`);
  updateQuantityDiscountNote();
  closeField(field);
  updateTotal();
}

function updateQuantityDiscountNote() {
  document.getElementById('quantityDiscountNote').hidden = state.quantity < 2;
}

function setupCustomQuantity() {
  const input = document.getElementById('qtyCustomInput');
  const field = input.closest('.field--accordion');
  const commit = () => {
    const val = Math.max(10, Math.floor(Number(input.value) || 0));
    if (val >= 10) {
      state.quantity = val;
      input.value = val;
      setFieldValue(field, `${val}本`);
      updateQuantityDiscountNote();
      closeField(field);
      updateTotal();
    }
  };
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commit();
    }
  });
  input.addEventListener('blur', commit);
  input.addEventListener('click', (e) => e.stopPropagation());
}

function setFieldValue(field, text) {
  const value = field.querySelector('.field__value');
  value.textContent = text;
}

function closeField(field) {
  field.classList.remove('is-open');
}

/* ---------- Pricing preview (page count / quantity / addon only — no
   discount code or shipping here, those are applied once at checkout) ---------- */
function updateTotal() {
  const subtotal = calcBookTotal(product.price, state.quantity, 1, false) + state.addonPrice;
  document.getElementById('totalAmount').textContent = `NT$${subtotal}`;
}

/* ---------- Build cart item from current form state ---------- */
function buildCartItem() {
  return {
    styleKey,
    styleName: product.name,
    image: product.images[0],
    price: product.price,
    pages: state.pages,
    quantity: state.quantity,
    addonLabel: state.addonLabel,
    addonPrice: state.addonPrice,
  };
}

function resetItemFields() {
  state.pages = '';
  state.quantity = 0;
  state.addonLabel = '';
  state.addonPrice = 0;

  document.querySelectorAll(
    '[data-field="pages"] .option, [data-field="quantity"] .option, [data-field="addon"] .option'
  ).forEach((o) => o.classList.remove('is-selected'));

  ['pages', 'quantity', 'addon'].forEach((key) => {
    document.querySelector(`[data-field="${key}"] .field__value`).textContent = '';
  });

  updateQuantityDiscountNote();

  document.getElementById('qtyCustomRow').hidden = true;

  updateTotal();
}

/* ---------- Add to cart ---------- */
function setupSubmit() {
  const form = document.getElementById('orderForm');
  const feedback = document.getElementById('cartFeedback');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    feedback.classList.remove('is-visible');

    const missing = [];
    if (!state.pages) missing.push('頁數');
    if (!state.quantity) missing.push('訂購數量');
    if (!state.addonLabel) missing.push('加值服務');

    if (missing.length) {
      alert(`請完成以下必填欄位：\n${missing.join('、')}`);
      return;
    }

    addCartItem(buildCartItem());
    updateCartBadge();

    feedback.classList.add('is-visible');
    resetItemFields();
  });
}

renderProductInfo();
buildPageOptions();
buildQuantityOptions();
setupAccordions();
setupCustomQuantity();
setupSubmit();
updateTotal();
