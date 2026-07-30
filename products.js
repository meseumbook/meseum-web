const PRODUCTS = {
  ethereal: {
    name: 'Ethereal',
    price: 3880,
    pageOptions: ['120頁'],
    images: ['images/product-ethereal.jpg'],
    featuresEn: ['Debossed Hardcover', 'Custom Cover Sticker', 'Square Spine Case Binding'],
    featuresZh: ['精緻立體打凹', '自訂封面貼紙'],
    specsEn: [
      ['Size:', '15.3x21.6cm (A5)'],
      ['Cover:', 'German Materica Paper'],
      ['Pages:', 'Muguang Paper'],
    ],
    specsZh: [
      ['尺寸：', '15.3x21.6cm (A5)'],
      ['封面材質：', '德國馬諦斯紙'],
      ['內頁材質：', '沐光紙'],
      ['裝訂方式：', '方背精裝'],
    ],
  },
  moment: {
    name: 'Moment',
    price: 3580,
    pageOptions: ['80頁', '120頁'],
    images: ['images/product-moment.jpg'],
    featuresEn: ['Custom Cover Image', 'Square Spine Case Binding'],
    featuresZh: ['自訂封面6張照片'],
    specsEn: [
      ['Size:', '15.3x21.6cm (A5)'],
      ['Cover:', 'Japanese Dandy Paper'],
      ['Pages:', 'Muguang Paper'],
    ],
    specsZh: [
      ['尺寸：', '15.3x21.6cm (A5)'],
      ['封面材質：', '日本丹迪紙'],
      ['內頁材質：', '沐光紙'],
      ['裝訂方式：', '方背精裝'],
    ],
  },
  harmony: {
    name: 'Harmony',
    price: 3580,
    pageOptions: ['80頁', '120頁'],
    images: ['images/product-harmony.jpg'],
    featuresEn: ['Custom Cover Image', 'Square Spine Case Binding'],
    featuresZh: ['自訂封面照片'],
    specsEn: [
      ['Size:', '15.3x21.6cm (A5)'],
      ['Cover:', 'Japanese Dandy Paper'],
      ['Pages:', 'Muguang Paper'],
    ],
    specsZh: [
      ['尺寸：', '15.3x21.6cm (A5)'],
      ['封面材質：', '日本丹迪紙'],
      ['內頁材質：', '沐光紙'],
      ['裝訂方式：', '方背精裝'],
    ],
  },
  serenity: {
    name: 'Serenity',
    price: 3580,
    pageOptions: ['80頁', '120頁'],
    images: ['images/product-serenity.jpg'],
    featuresEn: ['Custom Cover Image', 'Square Spine Case Binding'],
    featuresZh: ['自訂封面文字'],
    specsEn: [
      ['Size:', '15.3x21.6cm (A5)'],
      ['Cover:', 'Japanese Dandy Paper'],
      ['Pages:', 'Muguang Paper'],
    ],
    specsZh: [
      ['尺寸：', '15.3x21.6cm (A5)'],
      ['封面材質：', '日本丹迪紙'],
      ['內頁材質：', '沐光紙'],
      ['裝訂方式：', '方背精裝'],
    ],
  },
};

const PRODUCT_ORDER = ['ethereal', 'moment', 'harmony', 'serenity'];

/* Shown on order-confirmation.html. Keep in sync with the matching
   constants (BANK_NAME / BANK_ACCOUNT / PAYMENT_DEADLINE_DAYS) at the top
   of apps-script/Code.gs — that copy is what actually goes out in the
   customer confirmation email. */
const BANK_INFO = {
  bankName: '013國泰世華銀行',
  bankAccount: '0747-000-35674',
};
const PAYMENT_DEADLINE_DAYS = 3;
