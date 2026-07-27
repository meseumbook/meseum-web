function renderOrderList() {
  const list = document.getElementById('orderList');
  if (!list) return;

  PRODUCT_ORDER.forEach((key) => {
    const p = PRODUCTS[key];

    const row = document.createElement('a');
    row.href = `order-detail.html?style=${key}`;
    row.className = 'product-row';

    const media = document.createElement('div');
    media.className = 'product-row__media carousel';
    p.images.forEach((src, i) => {
      const img = document.createElement('img');
      img.src = src;
      img.alt = p.name;
      img.loading = 'lazy';
      if (i === 0) img.classList.add('is-active');
      media.appendChild(img);
    });

    const info = document.createElement('div');
    info.className = 'product-row__info';

    const heading = document.createElement('div');
    heading.className = 'product-row__heading';
    heading.innerHTML = `<span class="product-row__name">${p.name}</span><span class="product-row__price">$${p.price}</span>`;

    const features = document.createElement('div');
    features.className = 'product-row__features';
    features.innerHTML = p.featuresEn.map((f) => `<p>${f}</p>`).join('');

    const specs = document.createElement('div');
    specs.className = 'product-row__specs';
    specs.innerHTML = p.specsEn
      .map(([label, value]) => `<div class="spec-row"><span class="spec-label">${label}</span><span class="spec-value">${value}</span></div>`)
      .join('');

    info.appendChild(heading);
    info.appendChild(features);
    info.appendChild(specs);

    row.appendChild(media);
    row.appendChild(info);
    list.appendChild(row);

    if (p.images.length > 1) startCarousel(media);
  });
}

function startCarousel(media) {
  const imgs = media.querySelectorAll('img');
  let index = 0;
  setInterval(() => {
    imgs[index].classList.remove('is-active');
    index = (index + 1) % imgs.length;
    imgs[index].classList.add('is-active');
  }, 3000);
}

renderOrderList();
