/* ---------- Discount codes ----------
   Edit this file whenever a code is added, changed, or retired — nothing
   else needs to change. Each entry:

     'code': { type: 'percent', rate: 0.9 }
       — X 折 off, applied per book (existing behavior).

     'code': { type: 'flat', amount: 200 }
       — flat NT$ off the books subtotal, once per order.

   Add startDate / endDate ('YYYY-MM-DD', both inclusive) to limit a code to
   a date range — leave them out for a permanent code. There is no way to
   automatically limit a code to a single use (this is a static site with
   no order database) — for a one-time code, just delete or comment out its
   line here once it's been redeemed. */
const DISCOUNT_CODES = {
  'peter.design': { type: 'percent', rate: 0.9 },
  'peterchao': { type: 'percent', rate: 0.9 },
  'allkstudio': { type: 'percent', rate: 0.9 },
  'hellomeseum': { type: 'flat', amount: 200, startDate: '2026-08-01', endDate: '2026-08-07' },
  'bellechao200': { type: 'flat', amount: 200 }, // 單次碼 — 客戶使用後請刪除或註解掉這一行
};

function isDiscountCodeActive(entry) {
  if (entry.startDate || entry.endDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (entry.startDate && today < new Date(`${entry.startDate}T00:00:00`)) return false;
    if (entry.endDate && today > new Date(`${entry.endDate}T00:00:00`)) return false;
  }
  return true;
}
