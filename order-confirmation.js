const orderId = new URLSearchParams(location.search).get('orderId') || '';

function formatMoney(n) {
  return `$${Number(n || 0).toLocaleString()}`;
}

function showLoading(isLoading) {
  document.getElementById('confirmLoading').hidden = !isLoading;
}

function showError(message) {
  const errorEl = document.getElementById('confirmError');
  errorEl.textContent = message;
  errorEl.hidden = false;
}

function renderItems(order) {
  document.getElementById('confirmItems').innerHTML = order.items
    .map((item) => {
      const product = PRODUCTS[item.styleKey];
      const image = product ? product.images[0] : '';
      const subtotal = item.bookTotal + item.addonPrice;
      return `
        <div class="cart-item">
          <div class="cart-item__media"><img src="${image}" alt="${item.styleName}"></div>
          <div class="cart-item__body">
            <div class="cart-item__heading">
              <span class="cart-item__name">${item.styleName}</span>
            </div>
            <div class="cart-item__specs">
              <div class="spec-row"><span class="spec-label">頁數</span><span class="spec-value">${item.pages}</span></div>
              <div class="spec-row"><span class="spec-label">數量</span><span class="spec-value">${item.quantity}本</span></div>
              <div class="spec-row"><span class="spec-label">加值服務</span><span class="spec-value">${item.addonLabel}</span></div>
            </div>
            <div class="cart-item__subtotal cart-item__subtotal--amount-only"><span>$${subtotal}</span></div>
          </div>
        </div>
      `;
    })
    .join('');
}

function renderRecipientInfo(order) {
  const rows = [
    ['Line名稱', order.lineName],
    ['收件人姓名', order.recipientName],
    ['收件人電話', order.recipientPhone],
    ['配送方式', `${order.shippingLabel || ''}｜${order.shippingDetail || ''}`],
  ];
  if (order.remark) rows.push(['備註', order.remark]);

  document.getElementById('confirmRecipientInfo').innerHTML = rows
    .map(
      ([label, value]) => `
        <div class="field__row">
          <span class="field__label">${label}</span>
          <span class="field__value">${value}</span>
        </div>
      `
    )
    .join('');
}

function renderAmounts(order) {
  document.getElementById('confirmBooksTotal').textContent = formatMoney(order.booksTotal);
  document.getElementById('confirmShippingFee').textContent = formatMoney(order.shippingTotal);
  document.getElementById('confirmGrandTotal').textContent = formatMoney(order.grandTotal);
}

function renderRemittance(order) {
  document.getElementById('confirmBankName').textContent = BANK_INFO.bankName;
  document.getElementById('confirmBankAccount').textContent = BANK_INFO.bankAccount;
  document.getElementById('confirmDeadline').textContent = order.paymentDeadline || '';
}

function renderProduction(order) {
  document.getElementById('confirmProduction').innerHTML = order.items
    .map((item) => {
      const productionHref = `production-${item.styleKey}.html`;
      const albumLinks = item.albumLinks || [];
      const albumRows = albumLinks.length
        ? albumLinks
            .map((url, i) => {
              const label = albumLinks.length > 1 ? `專屬雲端相簿${String.fromCharCode(65 + i)}` : '專屬雲端相簿';
              const isPending = /^（/.test(url);
              return isPending
                ? `<span class="production-block__link production-block__link--pending">${label}｜付款完成後即建立專屬相簿連結</span>`
                : `<a class="production-block__link" href="${url}" target="_blank" rel="noopener">${label} →</a>`;
            })
            .join('')
        : '';
      return `
        <div class="production-block">
          <div class="production-block__heading">${item.styleName} 款</div>
          <a class="production-block__link" href="${productionHref}">製作表單 →</a>
          ${albumRows}
        </div>
      `;
    })
    .join('');
}

/* ---------- 匯款回報（放在匯款資訊下面）---------- */
function renderPaymentConfirm(order) {
  const form = document.getElementById('paymentConfirmForm');
  const confirmed = document.getElementById('paymentConfirmed');

  if (order.paymentReported) {
    form.hidden = true;
    confirmed.hidden = false;
    document.getElementById('confirmedLast5').textContent = order.remitLast5 || '';
    document.getElementById('confirmedLast5Wrap').hidden = !order.remitLast5;
  } else {
    form.hidden = false;
    confirmed.hidden = true;
  }
}

/* ---------- 海外客戶：信用卡付款連結（放在匯款資訊下面）---------- */
function renderOverseasPayment(order) {
  const section = document.getElementById('confirmOverseasPayment');

  if (order.shippingType !== 'oversea') {
    section.hidden = true;
    return;
  }
  section.hidden = false;

  const raw = (order.overseasPaymentLink || '').trim();
  const isPending = !raw || /^（/.test(raw);

  document.getElementById('confirmOverseasPaymentLink').innerHTML = isPending
    ? `<span class="production-block__link production-block__link--pending">海外專屬信用卡付款連結將於24小時內自動生成顯示，並請於三日內完成付款</span>`
    : `<a class="production-block__link" href="${raw}" target="_blank" rel="noopener">信用卡付款連結 →</a>`;
}

function setupPaymentConfirm(orderId, isOverseas) {
  const form = document.getElementById('paymentConfirmForm');
  const errorEl = document.getElementById('paymentConfirmError');
  const last5Field = document.querySelector('[data-field="remitLast5"]');

  // Overseas customers may pay by credit card instead of bank transfer, so
  // they have no bank account to give a last-5 for — make the field
  // optional for them instead of a hard requirement.
  if (isOverseas) {
    last5Field.dataset.required = 'false';
    last5Field.querySelector('.field__label').textContent = '匯款帳號後五碼（如以信用卡付款可不填）';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.hidden = true;

    const last5 = document.getElementById('remitLast5Input').value.trim();
    const last5Required = last5Field.dataset.required !== 'false';
    if ((last5Required || last5) && !/^\d{5}$/.test(last5)) {
      errorEl.textContent = '請輸入正確的匯款帳號後五碼（5 碼數字）';
      errorEl.hidden = false;
      return;
    }

    const btn = document.getElementById('paymentConfirmBtn');
    btn.disabled = true;
    btn.textContent = '送出中…';

    try {
      const res = await fetch(ORDER_API_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'confirmPayment', orderId, remitLast5: last5 }),
      });
      const result = await res.json();
      if (!result.ok) throw new Error(result.error || '送出失敗');

      form.hidden = true;
      document.getElementById('paymentConfirmed').hidden = false;
      document.getElementById('confirmedLast5').textContent = last5;
      document.getElementById('confirmedLast5Wrap').hidden = !last5;
    } catch (err) {
      errorEl.textContent = `送出失敗，請稍後再試一次。（${err.message}）`;
      errorEl.hidden = false;
      btn.disabled = false;
      btn.textContent = '我已完成付款';
    }
  });
}

function renderOrder(order) {
  document.getElementById('confirmGreeting').textContent = `${order.recipientName} 您好，已收到您的訂購 🤍`;
  document.getElementById('confirmOrderId').textContent = `訂單編號：${order.orderId}`;

  renderItems(order);
  renderRecipientInfo(order);
  renderAmounts(order);
  renderRemittance(order);
  renderPaymentConfirm(order);
  renderOverseasPayment(order);
  renderProduction(order);
  setupPaymentConfirm(order.orderId, order.shippingType === 'oversea');

  document.getElementById('confirmContent').hidden = false;
}

async function loadOrder() {
  if (!orderId) {
    showLoading(false);
    showError('缺少訂單編號，請確認信件或網址連結是否完整。');
    return;
  }

  if (!ORDER_API_URL) {
    showLoading(false);
    showError('訂單查詢功能尚未連接後端（ORDER_API_URL 未設定），請聯繫網站管理者完成部署設定。');
    return;
  }

  try {
    const res = await fetch(`${ORDER_API_URL}?action=order&orderId=${encodeURIComponent(orderId)}`);
    const result = await res.json();
    if (!result.ok) throw new Error(result.error || '查詢失敗');
    renderOrder(result.order);
  } catch (err) {
    showError(`訂單資料讀取失敗，請稍後再試一次，或直接透過 LINE 與我們聯繫。（${err.message}）`);
  } finally {
    showLoading(false);
  }
}

loadOrder();
