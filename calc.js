// Hesap mantığı (ekrandan bağımsız). Siparişler USD; her siparişin kendi günlük kuruyla TL'ye çevrilir.
window.Calc = (function () {
  const K = ['sale', 'ship', 'disc', 'listing', 'tx', 'proc', 'ads', 'shipCost', 'pack', 'prod', 'salesTax'];
  function order(o, costs) {
    const pc = costs[o.product], hasCost = typeof pc === 'number';
    const revenue = o.sale + o.shipCharged - o.discount;
    const fees = o.listingFee + o.transactionFee + o.processingFee + o.adsFee;
    const out = o.shipCost + o.packaging + (hasCost ? pc : 0);
    const profit = revenue - fees - out;
    return { revenue, fees, out, hasCost, productCost: hasCost ? pc : 0, profit, profitTL: profit * o.rate, revenueTL: revenue * o.rate };
  }
  function summarize(orders, costs, expenses, taxRate) {
    const u = {}, t = {}; K.forEach(k => { u[k] = 0; t[k] = 0; });
    let missing = 0;
    orders.forEach(o => {
      const c = order(o, costs); if (!c.hasCost) missing++;
      const v = { sale: o.sale, ship: o.shipCharged, disc: o.discount, listing: o.listingFee, tx: o.transactionFee, proc: o.processingFee, ads: o.adsFee, shipCost: o.shipCost, pack: o.packaging, prod: c.productCost, salesTax: o.salesTax };
      K.forEach(k => { u[k] += v[k]; t[k] += v[k] * o.rate; });
    });
    const sum = (x, ks) => ks.reduce((a, k) => a + x[k], 0);
    const rev = { u: u.sale + u.ship - u.disc, t: t.sale + t.ship - t.disc };
    const fee = { u: sum(u, ['listing', 'tx', 'proc', 'ads']), t: sum(t, ['listing', 'tx', 'proc', 'ads']) };
    const expTL = expenses.reduce((a, e) => a + e.amountTL, 0);
    const preTax = rev.t - fee.t - t.shipCost - t.pack - t.prod - expTL;
    const tax = Math.max(0, preTax) * taxRate / 100;
    const net = preTax - tax;
    return { u, t, rev, fee, expTL, avgRate: rev.u ? rev.t / rev.u : 0, preTax, tax, net, margin: rev.t ? net / rev.t * 100 : 0, missing, count: orders.length };
  }
  // Başa baş satış fiyatı (reklamsız): Etsy %6,5 işlem + %3 ödeme + 0,25$ sabit + 0,20$ listeleme
  function breakEven(p, cost) {
    const k = 1 - 0.095;
    return (cost + p.pack + p.shipCost + 0.45 - p.ship * k) / k;
  }
  return { order, summarize, breakEven };
})();
