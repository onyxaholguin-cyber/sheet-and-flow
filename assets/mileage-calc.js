/* IRS standard mileage deduction math. Pure functions; unit-tested with node. */
(function (root) {
  // Official IRS rates (cents per mile). Business/medical changed mid-2026.
  // Sources: Notice 2026-10 (Jan 1–Jun 30); Announcement 2026-11 / IR-2026-29 (Jul 1–Dec 31).
  var RATES = {
    business: [
      { from: '2026-01-01', to: '2026-06-30', cents: 72.5 },
      { from: '2026-07-01', to: '2026-12-31', cents: 76 }
    ],
    medical: [
      { from: '2026-01-01', to: '2026-06-30', cents: 20.5 },
      { from: '2026-07-01', to: '2026-12-31', cents: 23.5 }
    ],
    charity: [
      { from: '2026-01-01', to: '2026-12-31', cents: 14 }
    ]
  };

  function parseYMD(s) {
    var p = String(s).split('-');
    return { y: +p[0], m: +p[1], d: +p[2] };
  }
  function cmp(a, b) {
    if (a.y !== b.y) return a.y - b.y;
    if (a.m !== b.m) return a.m - b.m;
    return a.d - b.d;
  }
  function rateFor(purpose, ymd) {
    var rows = RATES[purpose];
    if (!rows) return null;
    var day = parseYMD(ymd);
    for (var i = 0; i < rows.length; i++) {
      var from = parseYMD(rows[i].from), to = parseYMD(rows[i].to);
      if (cmp(day, from) >= 0 && cmp(day, to) <= 0) return rows[i].cents;
    }
    return null;
  }
  function deductionForTrip(purpose, ymd, miles) {
    var cents = rateFor(purpose, ymd);
    if (cents == null || !(miles >= 0) || !isFinite(miles)) return null;
    return { cents: cents, dollars: miles * cents / 100, miles: miles };
  }
  /** Monthly logging: year, month 1–12, purpose, miles. Uses the 15th as the rate day (safe for 2026: Jul 1 starts H2). */
  function deductionForMonth(purpose, year, month, miles) {
    var ymd = year + '-' + String(month).padStart(2, '0') + '-15';
    var cents = rateFor(purpose, ymd);
    if (cents == null || !(miles >= 0) || !isFinite(miles)) return null;
    return { cents: cents, dollars: miles * cents / 100, miles: miles, ymd: ymd };
  }
  function yearTotals(purpose, year, monthlyMiles) {
    var sumMiles = 0, sumDollars = 0, months = [];
    for (var m = 1; m <= 12; m++) {
      var miles = Number(monthlyMiles[m - 1] || 0);
      var r = deductionForMonth(purpose, year, m, miles);
      if (!r) return null;
      sumMiles += miles;
      sumDollars += r.dollars;
      months.push(r);
    }
    return { miles: sumMiles, dollars: sumDollars, months: months };
  }
  var api = { RATES: RATES, rateFor: rateFor, deductionForTrip: deductionForTrip, deductionForMonth: deductionForMonth, yearTotals: yearTotals };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.MileageCalc = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
