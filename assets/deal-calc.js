/* Rental deal math. Pure functions; used by the calculator page and unit-tested with node. */
(function (root) {
  function pmt(rateAnnual, years, principal) {
    const r = rateAnnual / 12, n = years * 12;
    if (n <= 0 || principal <= 0) return 0;
    return r === 0 ? principal / n : principal * r / (1 - Math.pow(1 + r, -n));
  }
  function analyze(i) {
    const loan = i.price * (1 - i.downPct);
    const down = i.price * i.downPct;
    const points = loan * (i.pointsPct || 0);
    const cash = down + (i.closing || 0) + (i.repairs || 0) + points;
    const pm = pmt(i.rate, i.years, loan);
    const gsi = (i.units * i.rent + (i.otherIncome || 0)) * 12;
    const vacancy = gsi * (i.vacancyPct || 0);
    const egi = gsi - vacancy;
    const rentBase = i.units * i.rent * 12;                  // repairs + CapEx: % of scheduled rent
    const fixed = (i.taxes || 0) + (i.insurance || 0) + ((i.hoa || 0) + (i.utilities || 0) + (i.otherExp || 0)) * 12;
    const variable = rentBase * ((i.repairsPct || 0) + (i.capexPct || 0)) + egi * (i.mgmtPct || 0); // management: % of collected income
    const opex = fixed + variable;
    const noi = egi - opex;
    const ds = pm * 12;
    const cf = noi - ds;
    return {
      loan, down, points, cash, monthlyPayment: pm, gsi, vacancy, egi, opex, noi, debtService: ds,
      annualCashFlow: cf, monthlyCashFlow: cf / 12,
      capRate: i.price ? noi / i.price : 0,
      cashOnCash: cash ? cf / cash : 0,
      dscr: ds ? noi / ds : Infinity,
      grm: gsi ? i.price / gsi : 0,
      rentToPrice: i.price ? (i.units * i.rent + (i.otherIncome || 0)) / i.price : 0,
      breakEvenOccupancy: gsi ? (opex + ds) / gsi : 0,
      expenseRatio: egi ? opex / egi : 0,
    };
  }
  const api = { pmt, analyze };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DealCalc = api;
})(this);
