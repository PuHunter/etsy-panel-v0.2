// ÖRNEK VERİ (Etsy bağlantısı gelince gerçek siparişlerle değişecek). Tutarlar USD.
(function () {
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const r2 = n => Math.round(n * 100) / 100;
  const P = [
    { name: 'Seramik kupa', price: 28, ship: 6, shipCost: 7.5, pack: 1, cost: 8 },
    { name: 'Deri cüzdan', price: 55, ship: 0, shipCost: 9, pack: 1.5, cost: 21 },
    { name: 'El yapımı kolye', price: 42, ship: 4, shipCost: 6, pack: 0.8, cost: 15 },
    { name: 'Dekoratif tabak', price: 36, ship: 8, shipCost: 12, pack: 2, cost: 14 }
  ];
  const C = ['ABD', 'Almanya', 'Birleşik Krallık', 'Kanada', 'Fransa', 'Avustralya'];
  const VAT = { 'Almanya': 0.19, 'Fransa': 0.2, 'Birleşik Krallık': 0.2 };
  const base = new Date('2026-09-01'), today = new Date('2026-10-16');
  const orders = [];
  for (let i = 0; i < 30; i++) {
    const day = Math.floor(i * 1.5), d = new Date(base.getTime() + day * 864e5);
    const p = P[Math.floor(rnd() * P.length)], c = C[Math.floor(rnd() * C.length)];
    const disc = rnd() < 0.2 ? 3 : 0, gross = p.price + p.ship - disc, age = Math.floor((today - d) / 864e5);
    const status = age > 10 ? 'teslim' : age > 4 ? 'kargoda' : 'bekliyor';
    orders.push({
      id: 'E-' + (1001 + i), date: d.toISOString().slice(0, 10), country: c, product: p.name,
      sale: p.price, shipCharged: p.ship, discount: disc,
      listingFee: 0.2, transactionFee: r2(gross * 0.065), processingFee: r2(gross * 0.03 + 0.25),
      adsFee: rnd() < 0.5 ? r2(rnd() * 1.5) : 0, salesTax: r2(gross * (VAT[c] || 0)),
      shipCost: p.shipCost, packaging: p.pack, rate: r2(33.4 + day * 0.02),
      status, tracking: status === 'bekliyor' ? '' : 'TR' + Math.floor(rnd() * 9e8 + 1e8)
    });
  }
  window.SAMPLE_ORDERS = orders;
  window.SAMPLE_PRODUCTS = P;
  window.SAMPLE_COSTS = Object.fromEntries(P.map(p => [p.name, p.cost]));
})();
