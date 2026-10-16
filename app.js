const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const DEF_REPLIES = [
  { t: 'Kargo ne zaman gelir?', b: 'Hi! Thank you for your order. Your item is handmade and ships within 1-3 business days. Delivery usually takes 7-14 business days depending on your country. I will send the tracking number as soon as it ships.' },
  { t: 'Takip numarası', b: 'Hi! Your order has shipped. Your tracking number is [TRACKING]. Please note that tracking updates can take 2-3 days to appear. Let me know if you need anything else!' },
  { t: 'Hasarlı / yanlış ürün', b: "I'm so sorry about that! Could you please send a photo of the item and the packaging? As soon as I see it, I will arrange a replacement or refund, whichever you prefer." },
  { t: 'İade politikası', b: 'Hi! I accept returns within 14 days of delivery for unused items in their original condition. Please message me before sending anything back and I will help with the steps.' },
  { t: 'Kişiye özel istek', b: 'Hi! Thank you for your interest. Yes, I can personalize this item. Please tell me the details you would like (text, size, colors) and I will confirm the price and production time.' },
  { t: 'İndirim talebi', b: 'Hi! Thank you for asking. I keep my prices as low as possible for handmade quality, but I can offer a small discount on orders of 2 or more items. Let me know what you would like!' },
  { t: 'Toplu sipariş', b: 'Hi! Yes, I can prepare a bulk order. Please tell me the quantity and your country, and I will send you a custom quote and delivery estimate.' },
  { t: 'Teşekkür + yorum isteği', b: 'Hi! Your order should have arrived. I hope you love it! If you are happy, a short review would mean a lot to my small shop. Thank you so much!' }
];
function load() {
  let s = {}; try { s = JSON.parse(localStorage.getItem('etsyPanel') || '{}'); } catch (e) {}
  return Object.assign({ costs: Object.assign({}, SAMPLE_COSTS), expenses: [], tracking: {}, status: {}, replies: DEF_REPLIES, taxRate: 20 }, s);
}
let store = load();
const save = () => { try { localStorage.setItem('etsyPanel', JSON.stringify(store)); } catch (e) {} };
const st = { tab: 'ozet', month: 'all', filter: 'hepsi', open: null };
const usd = n => (n < 0 ? '-$' : '$') + Math.abs(n).toFixed(2);
const tl = n => n.toLocaleString('tr-TR', { maximumFractionDigits: 0 }) + ' ₺';
const cls = n => (n >= 0 ? 'gain' : 'loss');
const months = [...new Set(SAMPLE_ORDERS.map(o => o.date.slice(0, 7)))].sort();
const inM = d => st.month === 'all' || d.startsWith(st.month);
const orders = () => SAMPLE_ORDERS.filter(o => inM(o.date));
const exps = () => store.expenses.filter(e => inM(e.date));
const statusOf = o => store.status[o.id] || o.status;
const trackOf = o => (store.tracking[o.id] !== undefined ? store.tracking[o.id] : o.tracking);
const age = o => Math.floor((new Date('2026-10-16') - new Date(o.date)) / 864e5);

function vOzet() {
  const s = Calc.summarize(orders(), store.costs, exps(), store.taxRate), u = s.u, t = s.t, r = s.avgRate || 1;
  const row = (l, a, b, c = '') => `<tr class="${c}"><td>${l}</td><td>${usd(a)}</td><td>${tl(b)}</td></tr>`;
  const warn = s.missing ? `<p class="warn">${s.missing} siparişin ürün maliyeti girilmemiş. Kâr olduğundan yüksek görünüyor. Ürünler sekmesinden maliyetleri gir.</p>` : '';
  const mrow = m => {
    const x = Calc.summarize(SAMPLE_ORDERS.filter(o => o.date.startsWith(m)), store.costs, store.expenses.filter(e => e.date.startsWith(m)), store.taxRate);
    return `<tr><td>${m}</td><td>${x.count}</td><td>${tl(x.rev.t)}</td><td>${tl(x.fee.t)}</td><td>${tl(x.expTL)}</td><td>${tl(x.preTax)}</td><td class="${cls(x.net)}">${tl(x.net)}</td><td>%${x.margin.toFixed(1)}</td></tr>`;
  };
  const by = {};
  orders().forEach(o => { const c = Calc.order(o, store.costs), p = by[o.product] || (by[o.product] = { n: 0, rev: 0, pr: 0 }); p.n++; p.rev += c.revenueTL; p.pr += c.profitTL; });
  const prow = Object.entries(by).sort((a, b) => b[1].pr - a[1].pr).map(([n, p]) => `<tr><td>${esc(n)}</td><td>${p.n}</td><td>${tl(p.rev)}</td><td class="${cls(p.pr)}">${tl(p.pr)}</td><td>%${(p.rev ? p.pr / p.rev * 100 : 0).toFixed(1)}</td></tr>`).join('');
  return `${warn}
  <div class="net">
    <div><span>Net kâr (vergi sonrası)</span><strong class="${cls(s.net)}">${tl(s.net)}</strong></div>
    <div><span>Kâr marjı</span><strong class="${cls(s.margin)}">%${s.margin.toFixed(1)}</strong></div>
    <div><span>Brüt ciro</span><strong>${tl(s.rev.t)}</strong></div>
    <div><span>Sipariş / ort. kur</span><strong>${s.count} / ${r.toFixed(2)}</strong></div>
  </div>
  <table><tr><th>Kalem (kurlar sipariş gününe göre)</th><th>USD</th><th>TL</th></tr>
    ${row('Ürün satışları', u.sale, t.sale, 'sub')}${row('Müşteriden alınan kargo', u.ship, t.ship, 'sub')}${row('İndirimler', -u.disc, -t.disc, 'sub')}
    ${row('Brüt ciro', s.rev.u, s.rev.t, 'total')}
    ${row('Listeleme ücreti', -u.listing, -t.listing, 'sub')}${row('İşlem ücreti', -u.tx, -t.tx, 'sub')}${row('Ödeme işleme ücreti', -u.proc, -t.proc, 'sub')}${row('Etsy reklam ücreti', -u.ads, -t.ads, 'sub')}
    ${row('Etsy kesintileri toplamı', -s.fee.u, -s.fee.t, 'total')}
    ${row('Kargo firmasına ödenen', -u.shipCost, -t.shipCost, 'sub')}${row('Ürün maliyeti', -u.prod, -t.prod, 'sub')}${row('Paketleme', -u.pack, -t.pack, 'sub')}${row('Diğer giderler (Giderler sekmesi)', -s.expTL / r, -s.expTL, 'sub')}
    ${row('Vergi öncesi kâr', s.preTax / r, s.preTax, 'total')}
    ${row('Vergi (%' + store.taxRate + ')', -s.tax / r, -s.tax, 'sub')}
    ${row('Net kâr', s.net / r, s.net, 'total')}
    ${row('Bilgi: Etsy’nin tahsil edip ödediği satış vergisi (ciroya dahil değil)', u.salesTax, t.salesTax, 'memo')}
  </table>
  <h2>Aylara göre</h2>
  <table><tr><th>Ay</th><th>Sipariş</th><th>Ciro</th><th>Etsy kesinti</th><th>Diğer gider</th><th>Vergi öncesi</th><th>Net kâr</th><th>Marj</th></tr>${months.map(mrow).join('')}</table>
  <h2>Ürün kârlılığı (vergi öncesi)</h2>
  <table><tr><th>Ürün</th><th>Adet</th><th>Ciro</th><th>Kâr</th><th>Marj</th></tr>${prow}</table>`;
}

function vSiparis() {
  const all = orders(), cnt = k => all.filter(o => statusOf(o) === k).length;
  const list = all.filter(o => st.filter === 'hepsi' || statusOf(o) === st.filter).reverse();
  const lab = { bekliyor: 'Kargolanacak', kargoda: 'Kargoda', teslim: 'Teslim edildi' };
  const f = [['hepsi', 'Hepsi', all.length], ['bekliyor', 'Kargolanacak', cnt('bekliyor')], ['kargoda', 'Kargoda', cnt('kargoda')], ['teslim', 'Teslim', cnt('teslim')]];
  const late = all.filter(o => statusOf(o) === 'bekliyor' && age(o) >= 3).length;
  const rows = list.map(o => {
    const c = Calc.order(o, store.costs), s = statusOf(o), late = s === 'bekliyor' && age(o) >= 3;
    const d = st.open === o.id ? `<tr class="detail"><td colspan="9">Satış ${usd(o.sale)} + kargo ${usd(o.shipCharged)} − indirim ${usd(o.discount)} | Etsy: listeleme ${usd(o.listingFee)}, işlem ${usd(o.transactionFee)}, ödeme ${usd(o.processingFee)}, reklam ${usd(o.adsFee)} | Kargo gideri ${usd(o.shipCost)}, ürün ${c.hasCost ? usd(c.productCost) : 'MALİYET YOK'}, paket ${usd(o.packaging)} | Satış vergisi (bilgi) ${usd(o.salesTax)} | Kur ${o.rate}</td></tr>` : '';
    return `<tr class="click" data-act="open" data-id="${o.id}"><td class="l">${o.id}</td><td class="l">${o.date}</td><td class="l">${esc(o.country)}</td><td class="l">${esc(o.product)}</td>
      <td class="l"><span class="tag ${s}">${lab[s]}</span>${late ? ' <span class="warn">Gecikiyor</span>' : ''}</td>
      <td><input data-track="${o.id}" value="${esc(trackOf(o))}" placeholder="Takip no"></td><td>${usd(c.revenue)}</td><td class="${cls(c.profit)}">${usd(c.profit)}</td><td class="${cls(c.profit)}">${tl(c.profitTL)}</td></tr>${d}`;
  }).join('');
  return `${late ? `<p class="warn">${late} sipariş 3 günden uzun süredir kargolanmayı bekliyor.</p>` : ''}
  <div class="tools">${f.map(x => `<button class="btn ${st.filter === x[0] ? 'on' : ''}" data-act="filter" data-id="${x[0]}">${x[1]} (${x[2]})</button>`).join('')}</div>
  <table><tr><th class="l">Sipariş</th><th class="l">Tarih</th><th class="l">Ülke</th><th class="l">Ürün</th><th class="l">Durum</th><th>Takip no</th><th>Ciro</th><th>Kâr USD</th><th>Kâr TL</th></tr>${rows}</table>
  <p class="notice">Satıra tıkla: Etsy kesintilerinin tüm kalemleri açılır. Takip numarası girince sipariş "Kargoda" olur.</p>`;
}

function vUrun() {
  const rows = SAMPLE_PRODUCTS.map(p => {
    const c = store.costs[p.name], has = typeof c === 'number';
    return `<tr><td class="l">${esc(p.name)}</td><td><input type="number" step="0.01" data-cost="${esc(p.name)}" value="${has ? c : ''}" placeholder="Maliyet $"></td><td>${usd(p.price)}</td>
      <td>${has ? usd(Calc.breakEven(p, c)) : '<span class="warn">Maliyet gir</span>'}</td><td class="${has ? cls(p.price - Calc.breakEven(p, c)) : ''}">${has ? usd(p.price - Calc.breakEven(p, c)) : '-'}</td></tr>`;
  }).join('');
  return `<table><tr><th class="l">Ürün</th><th>Birim maliyet (USD)</th><th>Satış fiyatı</th><th>Başa baş fiyat</th><th>Fiyat payı</th></tr>${rows}</table>
  <p class="notice">Başa baş fiyat: Etsy kesintileri (%6,5 işlem, %3 + 0,25$ ödeme, 0,20$ listeleme), kargo ve paketleme dahil, reklamsız hesaplanır. Fiyat payı bunun üstündeki kazanç alanıdır.</p>`;
}

function vGider() {
  const cats = ['Reklam dışı pazarlama', 'Paketleme malzemesi', 'Abonelik/yazılım', 'Muhasebe', 'Kargo farkı', 'Diğer'];
  const list = exps(), tot = list.reduce((a, e) => a + e.amountTL, 0);
  const rows = list.map(e => `<tr><td class="l">${e.date}</td><td class="l">${esc(e.cat)}</td><td class="l">${esc(e.desc)}</td><td>${tl(e.amountTL)}</td><td><button class="btn ghost" data-act="delexp" data-id="${e.id}">Sil</button></td></tr>`).join('');
  return `<div class="form"><input id="eDate" type="date" value="2026-10-15"><select id="eCat">${cats.map(c => `<option>${c}</option>`).join('')}</select>
    <input id="eDesc" placeholder="Açıklama"><input id="eAmt" type="number" placeholder="Tutar (₺)"><button class="btn" data-act="addexp">Gider ekle</button></div>
  <table><tr><th class="l">Tarih</th><th class="l">Kategori</th><th class="l">Açıklama</th><th>Tutar</th><th></th></tr>${rows}<tr class="total"><td class="l" colspan="3">Toplam (seçili dönem)</td><td>${tl(tot)}</td><td></td></tr></table>`;
}

function vCevap() {
  return `<div class="form"><input id="rT" placeholder="Başlık"><input id="rB" placeholder="Cevap metni (İngilizce)" size="50"><button class="btn" data-act="addrep">Ekle</button></div>
  <div class="cards">${store.replies.map((r, i) => `<div class="card"><h3>${esc(r.t)}</h3><textarea data-rep="${i}">${esc(r.b)}</textarea>
    <div class="row"><button class="btn" data-act="copy" data-id="${i}">Kopyala</button><button class="btn ghost" data-act="delrep" data-id="${i}">Sil</button></div></div>`).join('')}</div>
  <p class="notice">Kopyala'ya bas, Etsy mesaj kutusuna yapıştır. Metinleri düzenleyince otomatik kaydedilir.</p>`;
}

function render() {
  $('#view').innerHTML = { ozet: vOzet, siparisler: vSiparis, urunler: vUrun, giderler: vGider, cevaplar: vCevap }[st.tab]();
  document.querySelectorAll('nav button').forEach(b => b.classList.toggle('on', b.dataset.tab === st.tab));
}

function exportCsv() {
  const n = v => v.toFixed(2).replace('.', ','), q = v => '"' + String(v).replace(/"/g, '""') + '"';
  const head = ['Sipariş', 'Tarih', 'Ülke', 'Ürün', 'Durum', 'Takip', 'Kur', 'Satış$', 'Kargo geliri$', 'İndirim$', 'Listeleme$', 'İşlem$', 'Ödeme işleme$', 'Reklam$', 'Kargo gideri$', 'Ürün maliyeti$', 'Paketleme$', 'Kâr$', 'Kâr₺', 'Satış vergisi (bilgi)$'];
  const rows = orders().map(o => { const c = Calc.order(o, store.costs); return [o.id, o.date, o.country, o.product, statusOf(o), trackOf(o), n(o.rate), n(o.sale), n(o.shipCharged), n(o.discount), n(o.listingFee), n(o.transactionFee), n(o.processingFee), n(o.adsFee), n(o.shipCost), n(c.productCost), n(o.packaging), n(c.profit), n(c.profitTL), n(o.salesTax)].map(q).join(';'); });
  const s = Calc.summarize(orders(), store.costs, exps(), store.taxRate);
  const tail = ['', 'GİDERLER', 'Tarih;Kategori;Açıklama;Tutar₺', ...exps().map(e => [e.date, e.cat, e.desc, n(e.amountTL)].map(q).join(';')), '', 'ÖZET', 'Brüt ciro ₺;' + n(s.rev.t), 'Vergi öncesi kâr ₺;' + n(s.preTax), 'Vergi ₺;' + n(s.tax), 'Net kâr ₺;' + n(s.net)];
  const blob = new Blob(['\ufeff' + [head.map(q).join(';'), ...rows, ...tail].join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'etsy-rapor-' + st.month + '.csv'; a.click();
}

function copyText(txt) {
  const ta = document.createElement('textarea'); ta.value = txt; document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); } catch (e) {} ta.remove();
}

document.addEventListener('click', e => {
  const b = e.target.closest('[data-act],[data-tab]'); if (!b || e.target.tagName === 'INPUT') return;
  if (b.dataset.tab) { st.tab = b.dataset.tab; return render(); }
  const a = b.dataset.act, id = b.dataset.id;
  if (a === 'open') st.open = st.open === id ? null : id;
  else if (a === 'filter') st.filter = id;
  else if (a === 'delexp') store.expenses = store.expenses.filter(x => String(x.id) !== id);
  else if (a === 'delrep') store.replies.splice(+id, 1);
  else if (a === 'copy') { copyText(store.replies[+id].b); b.textContent = 'Kopyalandı'; return; }
  else if (a === 'addexp') {
    const amt = +$('#eAmt').value; if (!amt) return;
    store.expenses.push({ id: Date.now(), date: $('#eDate').value || '2026-10-15', cat: $('#eCat').value, desc: $('#eDesc').value, amountTL: amt });
  } else if (a === 'addrep') {
    if (!$('#rT').value || !$('#rB').value) return; store.replies.push({ t: $('#rT').value, b: $('#rB').value });
  }
  save(); render();
});
document.addEventListener('change', e => {
  const d = e.target.dataset;
  if (d.cost !== undefined) { store.costs[d.cost] = e.target.value === '' ? undefined : +e.target.value; save(); render(); }
  else if (d.track !== undefined) { store.tracking[d.track] = e.target.value.trim(); if (e.target.value.trim()) { const o = SAMPLE_ORDERS.find(x => x.id === d.track); if (statusOf(o) === 'bekliyor') store.status[d.track] = 'kargoda'; } save(); render(); }
  else if (d.rep !== undefined) { store.replies[+d.rep].b = e.target.value; save(); }
});
$('#month').innerHTML = '<option value="all">Tüm dönem</option>' + months.map(m => `<option>${m}</option>`).join('');
$('#month').onchange = e => { st.month = e.target.value; render(); };
$('#taxRate').value = store.taxRate;
$('#taxRate').oninput = e => { store.taxRate = +e.target.value || 0; save(); render(); };
$('#export').onclick = exportCsv;
render();
