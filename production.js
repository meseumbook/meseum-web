/* Google Apps Script Web App URL — deploy apps-script/ProductionCode.gs against
   your "me'seum製作表單 - Ethereal款" spreadsheet, then paste the /exec URL here.
   Left empty until deployed; submit shows a clear "not connected yet" message. */
const PRODUCTION_API_URL = 'https://script.google.com/macros/s/AKfycbzKEuwsTBkkwfk1M6NRlh5b2PN0PCC-izHB_2YM-8t0KSecr9Zp5vghhDc858B6_T61/exec';
const STYLE_NAME = 'Ethereal';
const MAX_FILE_MB = 1024; // photos upload straight to Drive now, not through this script — this just guards against picking the wrong file by mistake
const MIN_COVER_FILES = 3;
const MAX_COVER_FILES = 5;

/* ---------- Shared "only one panel open at a time" behaviour ---------- */
function closeOtherPanels(except) {
  document.querySelectorAll('.field.is-open').forEach((f) => {
    if (f !== except) f.classList.remove('is-open');
  });
}

/* ---------- Accordion fields (書籍封面顏色 / 頁數 / 添加內容段落文字 / 指定照片順序 / 照片備註文字需求) ---------- */
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

/* ---------- Cover sticker upload ---------- */
function setupCoverStickerUpload() {
  const btn = document.getElementById('coverStickerUpload');
  const input = document.getElementById('coverStickerInput');
  const status = document.getElementById('coverStickerStatus');

  btn.addEventListener('click', () => input.click());

  input.addEventListener('change', () => {
    const count = input.files.length;
    if (count > MAX_COVER_FILES) {
      alert(`最多只能上傳 ${MAX_COVER_FILES} 張照片，請重新選擇。`);
      input.value = '';
      status.textContent = '';
      return;
    }
    if (count > 0 && count < MIN_COVER_FILES) {
      alert(`至少需上傳 ${MIN_COVER_FILES} 張照片，請重新選擇。`);
      input.value = '';
      status.textContent = '';
      return;
    }
    const oversized = Array.from(input.files).find((f) => f.size > MAX_FILE_MB * 1024 * 1024);
    if (oversized) {
      alert(`「${oversized.name}」超過 ${MAX_FILE_MB}MB，請選擇較小的檔案。`);
      input.value = '';
      status.textContent = '';
      return;
    }
    status.textContent = count ? `已選擇 ${count} 張照片` : '';
  });
}

/* ---------- Upload straight to Drive ----------
   The browser never reads the whole file into memory as base64 and never
   sends it through PRODUCTION_API_URL's own request body — that request-size
   ceiling (~30-40MB) is what caused the old "undefined" read failures on
   large phone photos. Instead: ask Apps Script (running as the shop owner,
   so the customer never has to sign into Google) for a one-time Drive
   upload URL, then PUT the raw file straight to Google's own servers. */
async function uploadFileToDrive(file) {
  const startRes = await fetch(PRODUCTION_API_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'startUpload', fileName: file.name, mimeType: file.type, styleName: STYLE_NAME, origin: location.origin }),
  });
  const startResult = await startRes.json();
  if (!startResult.ok) throw new Error(startResult.error || `「${file.name}」建立上傳通道失敗`);

  const putRes = await fetch(startResult.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  if (!putRes.ok) throw new Error(`「${file.name}」上傳失敗（${putRes.status}）`);
  const uploaded = await putRes.json();

  return { name: file.name, driveViewUrl: `https://drive.google.com/file/d/${uploaded.id}/view` };
}

/* ---------- Submit ---------- */
function setupSubmit() {
  const form = document.getElementById('productionForm');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const missing = [];
    const coverColor = document.querySelector('[data-field="coverColor"] .option.is-selected');
    const pages = document.querySelector('[data-field="pages"] .option.is-selected');
    const extraContent = document.querySelector('[data-field="extraContent"] .option.is-selected');
    const photoOrder = document.querySelector('[data-field="photoOrder"] .option.is-selected');
    const photoNote = document.querySelector('[data-field="photoNote"] .option.is-selected');
    const photoUploaded = document.querySelector('[data-field="photoUploaded"]').dataset.checked === 'true';
    const coverCount = document.getElementById('coverStickerInput').files.length;

    if (!coverColor) missing.push('書籍封面顏色');
    if (!pages) missing.push('頁數');
    if (coverCount < MIN_COVER_FILES || coverCount > MAX_COVER_FILES) {
      missing.push(`封面貼紙 3 張照片（需上傳 ${MIN_COVER_FILES}~${MAX_COVER_FILES} 張）`);
    }
    if (!document.getElementById('titleInput').value.trim()) missing.push('書籍名稱/標題');
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
    btn.textContent = '上傳照片中…';

    try {
      const fileInput = document.getElementById('coverStickerInput');
      // Upload photos to Drive one at a time (not concurrently) so the
      // status text and any failure can point at exactly which file.
      const coverStickers = [];
      for (const file of Array.from(fileInput.files)) {
        coverStickers.push(await uploadFileToDrive(file));
      }

      btn.textContent = '送出中…';

      const payload = {
        styleName: STYLE_NAME,
        coverColor: coverColor.dataset.value,
        pages: pages.dataset.value,
        title: document.getElementById('titleInput').value.trim(),
        subtitle: document.getElementById('subtitleInput').value.trim(),
        bottomText: document.getElementById('bottomTextInput').value.trim(),
        page3: document.getElementById('page3Input').value.trim(),
        extraContent: extraContent.dataset.value,
        photoOrder: photoOrder.dataset.value,
        photoNote: photoNote.dataset.value,
        photoUploaded,
        remit: document.getElementById('remitInput').value.trim(),
        lineName: document.getElementById('lineNameInput').value.trim(),
        email: document.getElementById('emailInput').value.trim(),
        coverStickers,
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
setupCoverStickerUpload();
setupSubmit();
