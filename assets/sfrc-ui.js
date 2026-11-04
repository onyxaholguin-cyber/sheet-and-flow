/* Sheet & Flow Rental Property Calculator - form + results. Runs in the browser only; sends nothing anywhere. GPLv2 or later. */
(function () {
  'use strict';
  var C = window.SheetFlowCalc;
  var money = function (v) { return (v < 0 ? '-$' : '$') + Math.abs(v).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }); };
  var money2 = function (v) { return (v < 0 ? '-$' : '$') + Math.abs(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  var pct = function (v) { return v === null ? 'n/a' : (v * 100).toFixed(2) + '%'; };
  var num = function (v, d) { return v === null ? 'n/a (no loan)' : v.toFixed(d); };

  var LTR = [
    ['price', 'Purchase price ($)', 'money'], ['downPct', 'Down payment (%)', 'pct'], ['rate', 'Interest rate (%)', 'pct'],
    ['years', 'Loan term (years)', 'int'], ['closing', 'Closing costs ($)', 'money'], ['repairs', 'Up-front repairs ($)', 'money'],
    ['units', 'Units', 'int'], ['rent', 'Rent per unit / month ($)', 'money'], ['otherIncome', 'Other income / month ($)', 'money'],
    ['vacancyPct', 'Vacancy (% of income)', 'pct'], ['taxes', 'Property taxes / year ($)', 'money'], ['insurance', 'Insurance / year ($)', 'money'],
    ['hoa', 'HOA / month ($)', 'money'], ['utilities', 'Owner-paid utilities / month ($)', 'money'],
    ['repairsPct', 'Repairs (% of rent)', 'pct'], ['capexPct', 'CapEx reserve (% of rent)', 'pct'], ['mgmtPct', 'Management (% of collected)', 'pct']
  ];
  var STR = [
    ['price', 'Purchase price ($)', 'money'], ['downPct', 'Down payment (%)', 'pct'], ['rate', 'Interest rate (%)', 'pct'],
    ['years', 'Loan term (years)', 'int'], ['closing', 'Closing costs ($)', 'money'], ['furnishing', 'Furnishing ($)', 'money'],
    ['adr', 'Average nightly rate ($)', 'money'], ['occupancy', 'Occupancy (%)', 'pct'], ['avgStayNights', 'Average stay (nights)', 'dec'],
    ['blockedNights', 'Owner-blocked nights / year', 'int'], ['cleaningFee', 'Cleaning fee charged per stay ($)', 'money'],
    ['cleaningCost', 'Cleaning cost per stay ($)', 'money'], ['hostFeePct', 'Platform host fee (% of revenue)', 'pct'],
    ['mgmtPct', 'Management (% of revenue)', 'pct'], ['maintCapexPct', 'Maintenance + CapEx (% of revenue)', 'pct'],
    ['fixedMonthly', 'Fixed costs / month ($): tax, insurance, utilities, internet', 'money']
  ];

  function read(form, fields) {
    var o = {};
    fields.forEach(function (f) {
      var v = parseFloat(form.elements[f[0]].value);
      if (!isFinite(v)) { v = 0; }
      o[f[0]] = f[2] === 'pct' ? v / 100 : v;
    });
    return o;
  }
  function row(label, value, cls) {
    var tr = document.createElement('tr');
    var th = document.createElement('th'); th.textContent = label;
    var td = document.createElement('td'); td.textContent = value; if (cls) { td.className = cls; }
    tr.appendChild(th); tr.appendChild(td); return tr;
  }
  function render(box, kind, fields) {
    var form = box.querySelector('form');
    var out = box.querySelector('tbody');
    var input = read(form, fields);
    var r, rows;
    if (kind === 'str') {
      r = C.analyzeStr(input);
      rows = [
        ['Monthly cash flow', money(r.monthlyCashFlow), r.monthlyCashFlow < 0 ? 'sfrc-neg' : 'sfrc-pos'],
        ['Annual cash flow', money(r.annualCashFlow)], ['Gross revenue / year', money(r.grossRevenue)],
        ['Operating expenses / year', money(r.operatingExpenses)], ['NOI', money(r.noi)],
        ['Loan payment (P&I) / month', money2(r.monthlyPayment)], ['Cash-on-cash return', pct(r.cashOnCash)],
        ['Cap rate', pct(r.capRate)], ['DSCR', num(r.dscr, 2)], ['RevPAR', money2(r.revpar)],
        ['Break-even occupancy', r.breakEvenOccupancy === null ? 'never at this rate' : pct(r.breakEvenOccupancy)],
        ['Break-even nightly rate', r.breakEvenNightlyRate === null ? 'n/a' : money2(r.breakEvenNightlyRate)]
      ];
    } else {
      r = C.analyzeRental(input);
      rows = [
        ['Monthly cash flow', money(r.monthlyCashFlow), r.monthlyCashFlow < 0 ? 'sfrc-neg' : 'sfrc-pos'],
        ['Annual cash flow', money(r.annualCashFlow)], ['Cash-on-cash return', pct(r.cashOnCash)],
        ['Cap rate', pct(r.capRate)], ['NOI', money(r.noi)], ['DSCR', num(r.dscr, 2)],
        ['Loan payment (P&I) / month', money2(r.monthlyPayment)], ['Total cash invested', money(r.totalCashInvested)],
        ['Operating expenses / year', money(r.operatingExpenses)], ['Expense ratio', pct(r.expenseRatio)],
        ['Gross rent multiplier', r.grossRentMultiplier.toFixed(2)], ['Rent-to-price (1% rule)', pct(r.rentToPrice)],
        ['Break-even occupancy', pct(r.breakEvenOccupancy)]
      ];
    }
    while (out.firstChild) { out.removeChild(out.firstChild); }
    rows.forEach(function (x) { out.appendChild(row(x[0], x[1], x[2])); });
  }
  function init(box) {
    var kind = box.getAttribute('data-kind') === 'str' ? 'str' : 'ltr';
    var fields = kind === 'str' ? STR : LTR;
    var form = box.querySelector('form');
    form.addEventListener('input', function () { render(box, kind, fields); });
    form.addEventListener('submit', function (e) { e.preventDefault(); render(box, kind, fields); });
    render(box, kind, fields);
  }
  function boot() { Array.prototype.forEach.call(document.querySelectorAll('.sfrc-calculator'), init); }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', boot); } else { boot(); }
  window.SheetFlowCalcFields = { ltr: LTR, str: STR };
}());
