function groupByOrderId(rows) {
  const groups = new Map();
  rows.forEach((row) => {
    const id = row['訂單編號'] || row['時間戳記'];
    if (!groups.has(id)) groups.set(id, []);
    groups.get(id).push(row);
  });
  return Array.from(groups.values());
}

function formatDate(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function renderResults(rows) {
  const resultsEl = document.getElementById('lookupResults');
  const emptyEl = document.getElementById('lookupEmpty');
  resultsEl.innerHTML = '';

  if (!rows.length) {
    emptyEl.hidden = false;
    return;
  }
  emptyEl.hidden = true;

  const orders = groupByOrderId(rows).sort(
    (a, b) => new Date(b[0]['時間戳記']) - new Date(a[0]['時間戳記'])
  );

  orders.forEach((items) => {
    const total = items.reduce((sum, row) => sum + (Number(row['訂單金額']) || 0), 0);
    const card = document.createElement('div');
    card.className = 'cart-item lookup-order';
    card.innerHTML = `
      <div class="cart-item__body">
        <div class="cart-item__heading">
          <span class="cart-item__name">${formatDate(items[0]['時間戳記'])}</span>
          <span class="lookup-order__id">${items[0]['訂單編號'] || ''}</span>
        </div>
        <div class="cart-item__specs">
          ${items
            .map(
              (row) => `
            <div class="lookup-order__item">
              <div class="spec-row"><span class="spec-label">款式</span><span class="spec-value">${row['選擇款式']}</span></div>
              <div class="spec-row"><span class="spec-label">頁數</span><span class="spec-value">${row['頁數']}</span></div>
              <div class="spec-row"><span class="spec-label">數量</span><span class="spec-value">${row['訂購數量']}本</span></div>
              <div class="spec-row"><span class="spec-label">加值服務</span><span class="spec-value">${row['加值服務'] || '無'}</span></div>
              <div class="spec-row"><span class="spec-label">配送方式</span><span class="spec-value">${row['配送方式']}｜${row['收件地址 或 711/全家 店名+店號']}</span></div>
            </div>`
            )
            .join('<hr class="lookup-order__divider">')}
        </div>
        <div class="cart-item__subtotal">
          <span>訂單總額</span>
          <span>$${total}</span>
        </div>
        <a class="lookup-order__link" href="order-confirmation.html?orderId=${encodeURIComponent(items[0]['訂單編號'] || '')}">查看完整訂單、匯款與製作表單連結 →</a>
      </div>
    `;
    resultsEl.appendChild(card);
  });
}

function setupLookupByIdForm() {
  const form = document.getElementById('lookupByIdForm');
  const errorEl = document.getElementById('lookupError');

  /* An order ID is a unique match, so skip the summary-card list and go
     straight to the full order-confirmation page (recipient info, remittance,
     production form links) instead of duplicating that content here.
     order-confirmation.js already handles the "not found" case on its own. */
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    errorEl.hidden = true;

    const orderId = document.getElementById('lookupOrderId').value.trim();
    if (!orderId) return;

    location.href = `order-confirmation.html?orderId=${encodeURIComponent(orderId)}`;
  });
}

function setupLookupForm() {
  const form = document.getElementById('lookupForm');
  const btn = document.getElementById('lookupBtn');
  const errorEl = document.getElementById('lookupError');
  const emptyEl = document.getElementById('lookupEmpty');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.hidden = true;
    emptyEl.hidden = true;
    document.getElementById('lookupResults').innerHTML = '';

    if (!ORDER_API_URL) {
      errorEl.textContent = '訂單查詢功能尚未連接後端（ORDER_API_URL 未設定），請聯繫網站管理者完成部署設定。';
      errorEl.hidden = false;
      return;
    }

    const email = document.getElementById('lookupEmail').value.trim();
    const phone = document.getElementById('lookupPhone').value.trim();

    btn.disabled = true;
    btn.textContent = '查詢中…';

    try {
      const url = `${ORDER_API_URL}?action=lookup&email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}`;
      const res = await fetch(url);
      const result = await res.json();
      if (!result.ok) throw new Error(result.error || '查詢失敗');
      renderResults(result.results);
    } catch (err) {
      errorEl.textContent = `查詢失敗，請稍後再試一次。（${err.message}）`;
      errorEl.hidden = false;
    } finally {
      btn.disabled = false;
      btn.textContent = '查詢';
    }
  });
}

setupLookupForm();
setupLookupByIdForm();
