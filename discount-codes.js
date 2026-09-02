/* ---------- Discount codes ----------
   Edit this file whenever a code is added, changed, or retired — nothing
   else needs to change. Each entry:

     'code': { type: 'percent', rate: 0.9 }
       — X 折 off, applied per book (existing behavior).

     'code': { type: 'flat', amount: 200 }
       — flat NT$ off the books subtotal, once per order.

   Add startDate / endDate ('YYYY-MM-DD', both inclusive) to limit a code to
   a date range — leave them out for a permanent code. For a cutoff at an
   exact time of day (not just end of day), use endDateTime instead of
   endDate, e.g. '2026-09-02T12:59:00'. There is no way to automatically
   limit a code to a single use (this is a static site with no order
   database) — for a one-time code, just delete or comment out its line here
   once it's been redeemed. */
const DISCOUNT_CODES = {
  'peter.design': { type: 'percent', rate: 0.9 },
  'peterchao': { type: 'percent', rate: 0.9 },
  'allkstudio': { type: 'percent', rate: 0.9 },
  'allenwl': { type: 'percent', rate: 0.9 },
  'zozocheng': { type: 'percent', rate: 0.9 },
  'ourtime': { type: 'percent', rate: 0.9, startDate: '2026-08-25', endDateTime: '2026-09-02T12:59:00' },
  'bellechao200': { type: 'flat', amount: 200 }, // 單次碼 — 客戶使用後請刪除或註解掉這一行
};

function isDiscountCodeActive(entry) {
  const now = new Date();

  if (entry.startDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (today < new Date(`${entry.startDate}T00:00:00`)) return false;
  }

  // endDateTime is an exact cutoff moment; endDate alone stays inclusive
  // through the end of that whole day.
  if (entry.endDateTime) {
    if (now > new Date(entry.endDateTime)) return false;
  } else if (entry.endDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (today > new Date(`${entry.endDate}T00:00:00`)) return false;
  }

  return true;
}
