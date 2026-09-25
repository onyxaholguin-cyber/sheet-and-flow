(function () {
  var f = document.getElementById('deal'), out = document.getElementById('deal-out'), err = document.getElementById('deal-err');
  var pct = ['downPct', 'rate', 'vacancyPct', 'repairsPct', 'capexPct', 'mgmtPct'];
  var usd = function (n) { return (n < 0 ? '-$' : '$') + Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 }); };
  var p = function (n, d) { return (n * 100).toFixed(d === undefined ? 2 : d) + '%'; };
  function run() {
    var i = {}, bad = [];
    Array.prototype.forEach.call(f.elements, function (el) {
      var v = el.value === '' ? 0 : Number(el.value);
      if (!isFinite(v) || v < 0) bad.push(el.parentNode.firstChild.textContent.trim());
      i[el.name] = pct.indexOf(el.name) >= 0 ? v / 100 : v;
    });
    if (!i.price || !i.years || !i.units) bad.push('Price, term and units must be above 0');
    if (i.downPct > 1) bad.push('Down payment can\'t exceed 100%');
    if (bad.length) { err.textContent = 'Check: ' + bad.join(', '); out.innerHTML = ''; return; }
    err.textContent = '';
    var r = DealCalc.analyze(i);
    var k = [
      ['Monthly cash flow', usd(r.monthlyCashFlow), r.monthlyCashFlow >= 0],
      ['Annual cash flow', usd(r.annualCashFlow), r.annualCashFlow >= 0],
      ['Cash-on-cash return', p(r.cashOnCash), r.cashOnCash >= 0.08],
      ['Cap rate', p(r.capRate), r.capRate >= 0.06],
      ['DSCR', isFinite(r.dscr) ? r.dscr.toFixed(2) : 'n/a (no loan)', !isFinite(r.dscr) || r.dscr >= 1.2],
      ['NOI (annual)', usd(r.noi)],
      ['Mortgage payment / mo', usd(r.monthlyPayment)],
      ['Cash invested', usd(r.cash)],
      ['Operating expenses / yr', usd(r.opex)],
      ['Expense ratio', p(r.expenseRatio, 1)],
      ['Break-even occupancy', p(r.breakEvenOccupancy, 1), r.breakEvenOccupancy <= 0.85],
      ['Rent-to-price (1% rule)', p(r.rentToPrice), r.rentToPrice >= 0.01],
      ['Gross rent multiplier', r.grm.toFixed(1)],
    ];
    out.innerHTML = '';
    k.forEach(function (x) {
      var d = document.createElement('div'); d.className = 'kpi' + (x.length > 2 ? (x[2] ? ' good' : ' bad') : '');
      var b = document.createElement('b'); b.textContent = x[1]; var s = document.createElement('span'); s.textContent = x[0];
      d.appendChild(b); d.appendChild(s); out.appendChild(d);
    });
  }
  f.addEventListener('input', run); run();
})();
