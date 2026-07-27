/* Google Apps Script Web App URL — deploy apps-script/ProductionCode-Serenity.gs against
   your "me'seum製作表單 - Serenity款" spreadsheet, then paste the /exec URL here.
   Left empty until deployed; submit shows a clear "not connected yet" message. */
const PRODUCTION_API_URL = 'https://script.google.com/macros/s/AKfycbwcjWlU7WfdKie9WB8BopeUKqHjyGxnDW1hSb5zhuSFaMeYFyWarENfGCUXS4KNa-a2yA/exec';
const STYLE_NAME = 'Serenity';

/* ---------- Shared "only one panel open at a time" behaviour ---------- */
function closeOtherPanels(except) {
  document.querySelectorAll('.field.is-open').forEach((f) => {
    if (f !== except) f.classList.remove('is-open');
  });
}

/* ---------- Accordion fields (書籍封面顏色 / 頁數 / 封面文字顏色 / 添加內容段落文字 / 指定照片順序 / 照片備註文字需求) ---------- */
function setupAccordions() {
  document.querySelectorAll('.field--accordion').forEach((field) => {
    const row = field.querySelector('.field__row');
    row.addEventListener('click', () => {
      const isOpen = field.classList.contains('is-open');
      closeOtherPanels(field);
      field.classList.toggle('is-open', !isOpen);
    });
  });

  document.querySelectorAll('.field--accordion .option').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const field = btn.closest('.field--accordion');
      field.querySelectorAll('.option').forEach((o) => o.classList.remove('is-selected'));
      btn.classList.add('is-selected');
      field.querySelector('.field__value').textContent = btn.dataset.value;
      field.classList.remove('is-open');
      updateHint(field, btn.dataset.value);
    });
  });
}

function updateHint(field, value) {
  const key = field.dataset.field;

  if (key === 'extraContent') {
    const hint = document.getElementById('extraContentHint');
    hint.textContent = value === '有' ? '請私訊官方line帳號提供文字內容及詳細說明' : '';
  } else if (key === 'photoOrder') {
    const hint = document.getElementById('photoOrderHint');
    hint.textContent =
      value === '指定順序'
        ? '依照順序更改照片檔案名稱後上傳照片（建議）或於相簿照片備註編號順序'
        : '';
  } else if (key === 'photoNote') {
    const hint = document.getElementById('photoNoteHint');
    hint.textContent = value === '有備註文字' ? '於相簿照片下方點擊「寫點東西」備註文字說明' : '';
  }
}

/* ---------- Reveal fields (書籍名稱/標題 / 副標題 / 標題頁下方文字 / 第三頁文字文案) ---------- */
function setupRevealFields() {
  document.querySelectorAll('.field--reveal').forEach((field) => {
    const row = field.querySelector('.field__row');
    const input = field.querySelector('.field__input');

    row.addEventListener('click', () => {
      closeOtherPanels(field);
      field.classList.add('is-open');
      input.classList.remove('is-flashing');
      // restart the animation even if it was just played
      void input.offsetWidth;
      input.classList.add('is-flashing');
    });

    input.addEventListener('animationend', () => {
      input.classList.remove('is-flashing');
    });
  });
}

/* ---------- Photo-uploaded checkbox + info hint ---------- */
function setupPhotoUploadedField() {
  const field = document.querySelector('[data-field="photoUploaded"]');
  const check = document.getElementById('photoUploadedCheck');
  const hint = document.getElementById('photoUploadInfoHint');
  let checked = false;

  document.getElementById('openPhotoUploadInfo').addEventListener('click', () => {
    checked = !checked;
    check.classList.toggle('is-checked', checked);
    hint.classList.add('is-visible');
    field.dataset.checked = checked ? 'true' : 'false';
  });
}

/* ---------- Submit ---------- */
function setupSubmit() {
  const form = document.getElementById('productionForm');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const missing = [];
    const coverColor = document.querySelector('[data-field="coverColor"] .option.is-selected');
    const pages = document.querySelector('[data-field="pages"] .option.is-selected');
    const coverTextColor = document.querySelector('[data-field="coverTextColor"] .option.is-selected');
    const extraContent = document.querySelector('[data-field="extraContent"] .option.is-selected');
    const photoOrder = document.querySelector('[data-field="photoOrder"] .option.is-selected');
    const photoNote = document.querySelector('[data-field="photoNote"] .option.is-selected');
    const photoUploaded = document.querySelector('[data-field="photoUploaded"]').dataset.checked === 'true';

    if (!coverColor) missing.push('書籍封面顏色');
    if (!pages) missing.push('頁數');
    if (!document.getElementById('titleInput').value.trim()) missing.push('書籍名稱/標題');
    if (!coverTextColor) missing.push('封面文字顏色');
    if (!extraContent) missing.push('添加內容段落文字等其他特別需求');
    if (!photoOrder) missing.push('指定照片順序');
    if (!photoNote) missing.push('照片備註文字需求');
    if (!photoUploaded) missing.push('照片已上傳至專屬連結');
    if (!document.getElementById('remitInput').value.trim()) missing.push('匯款帳號後五碼');
    if (!document.getElementById('lineNameInput').value.trim()) missing.push('Line名稱');
    if (!document.getElementById('emailInput').value.trim()) missing.push('Email');

    if (missing.length) {
      alert(`請完成以下必填欄位：\n${missing.join('、')}`);
      return;
    }

    if (!PRODUCTION_API_URL) {
      alert('尚未連接製作表單後端（PRODUCTION_API_URL 未設定），暫時無法送出，請聯繫網站管理者完成部署設定。');
      return;
    }

    const btn = document.getElementById('submitProductionBtn');
    btn.disabled = true;
    btn.textContent = '送出中…';

    try {
      const payload = {
        styleName: STYLE_NAME,
        coverColor: coverColor.dataset.value,
        pages: pages.dataset.value,
        title: document.getElementById('titleInput').value.trim(),
        subtitle: document.getElementById('subtitleInput').value.trim(),
        bottomText: document.getElementById('bottomTextInput').value.trim(),
        coverTextColor: coverTextColor.dataset.value,
        page3: document.getElementById('page3Input').value.trim(),
        extraContent: extraContent.dataset.value,
        photoOrder: photoOrder.dataset.value,
        photoNote: photoNote.dataset.value,
        photoUploaded,
        remit: document.getElementById('remitInput').value.trim(),
        lineName: document.getElementById('lineNameInput').value.trim(),
        email: document.getElementById('emailInput').value.trim(),
      };

      const res = await fetch(PRODUCTION_API_URL, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!result.ok) throw new Error(result.error || '送出失敗');

      btn.textContent = '製作表單已送出，感謝您的提供！';
    } catch (err) {
      alert(`送出失敗，請稍後再試一次，或直接透過 LINE 與我們聯繫。（${err.message}）`);
      btn.disabled = false;
      btn.textContent = '提交製作';
    }
  });
}

setupAccordions();
setupRevealFields();
setupPhotoUploadedField();
setupSubmit();
