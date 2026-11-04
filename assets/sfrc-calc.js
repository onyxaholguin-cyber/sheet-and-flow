/*
 * Sheet & Flow Rental Property Calculator - math only (no DOM, no network).
 * Percentages are fractions (0.25 = 25%). Same formulas as the Sheet & Flow
 * Landlord Math MCP server (MIT) and the free calculators on the Sheet & Flow site.
 * License: GPLv2 or later.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.SheetFlowCalc = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function pmt(rateAnnual, years, principal) {
    var r = rateAnnual / 12, n = years * 12;
    if (n <= 0 || principal <= 0) { return 0; }
    return r === 0 ? principal / n : principal * r / (1 - Math.pow(1 + r, -n));
  }

  /* Year-one long-term rental analysis. */
  function analyzeRental(i) {
    var loan = i.price * (1 - i.downPct);
    var down = i.price * i.downPct;
    var points = loan * (i.pointsPct || 0);
    var cash = down + (i.closing || 0) + (i.repairs || 0) + points;
    var pm = pmt(i.rate, i.years, loan);
    var gsi = (i.units * i.rent + (i.otherIncome || 0)) * 12;
    var vacancy = gsi * (i.vacancyPct || 0);
    var egi = gsi - vacancy;
    var rentBase = i.units * i.rent * 12;
    var fixed = (i.taxes || 0) + (i.insurance || 0) + ((i.hoa || 0) + (i.utilities || 0) + (i.otherExp || 0)) * 12;
    var variable = rentBase * ((i.repairsPct || 0) + (i.capexPct || 0)) + egi * (i.mgmtPct || 0);
    var opex = fixed + variable;
    var noi = egi - opex;
    var ds = pm * 12;
    var cf = noi - ds;
    return {
      loanAmount: loan, downPayment: down, loanPoints: points, totalCashInvested: cash,
      monthlyPayment: pm, grossScheduledIncome: gsi, vacancyLoss: vacancy, effectiveGrossIncome: egi,
      operatingExpenses: opex, noi: noi, annualDebtService: ds,
      annualCashFlow: cf, monthlyCashFlow: cf / 12,
      capRate: i.price ? noi / i.price : 0,
      cashOnCash: cash ? cf / cash : 0,
      dscr: ds ? noi / ds : null,
      grossRentMultiplier: gsi ? i.price / gsi : 0,
      rentToPrice: i.price ? (i.units * i.rent + (i.otherIncome || 0)) / i.price : 0,
      breakEvenOccupancy: gsi ? (opex + ds) / gsi : 0,
      expenseRatio: egi ? opex / egi : 0
    };
  }

  /* Short-term rental (vacation rental) year-one analysis. */
  function analyzeStr(p) {
    var avail = 365 - (p.blockedNights || 0);
    var booked = avail * p.occupancy;
    var stays = p.avgStayNights > 0 ? booked / p.avgStayNights : 0;
    var pctFees = (p.hostFeePct || 0) + (p.mgmtPct || 0) + (p.maintCapexPct || 0);
    var gross = booked * p.adr + stays * (p.cleaningFee || 0);
    var opex = gross * pctFees + stays * (p.cleaningCost || 0) + 12 * (p.fixedMonthly || 0);
    var noi = gross - opex;
    var pi = pmt(p.rate, p.years, p.price * (1 - p.downPct));
    var cf = noi - 12 * pi;
    var invested = p.price * p.downPct + (p.closing || 0) + (p.furnishing || 0);
    var perStay = p.avgStayNights > 0 ? 1 / p.avgStayNights : 0;
    var kept = (p.adr + (p.cleaningFee || 0) * perStay) * (1 - pctFees) - (p.cleaningCost || 0) * perStay;
    var yearlyFixed = 12 * ((p.fixedMonthly || 0) + pi);
    var beOcc = (kept <= 0 || avail === 0) ? null : yearlyFixed / (avail * kept);
    var beAdr = (booked === 0 || pctFees >= 1) ? null :
      (yearlyFixed + stays * (p.cleaningCost || 0)) / (booked * (1 - pctFees)) - (p.cleaningFee || 0) * perStay;
    return {
      availableNights: avail, bookedNights: booked, stays: stays, grossRevenue: gross, operatingExpenses: opex, noi: noi,
      monthlyPayment: pi, annualCashFlow: cf, monthlyCashFlow: cf / 12, totalCashInvested: invested,
      cashOnCash: invested ? cf / invested : null, capRate: p.price ? noi / p.price : null,
      dscr: pi ? noi / (12 * pi) : null, revpar: avail ? booked * p.adr / avail : 0,
      keptPerBookedNight: kept, breakEvenOccupancy: beOcc, breakEvenNightlyRate: beAdr
    };
  }

  return { pmt: pmt, analyzeRental: analyzeRental, analyzeStr: analyzeStr };
}));
