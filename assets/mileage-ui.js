(function () {
  var f = document.getElementById('mileage'), out = document.getElementById('mileage-out'), err = document.getElementById('mileage-err');
  var modeTrip = document.getElementById('mode-trip'), modeYear = document.getElementById('mode-year');
  var tripBlock = document.getElementById('trip-fields'), yearBlock = document.getElementById('year-fields');
  var usd = function (n) { return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  function setMode() {
    var trip = modeTrip.checked;
    tripBlock.hidden = !trip; yearBlock.hidden = trip;
    run();
  }
  function kpi(label, value, good) {
    var d = document.createElement('div');
    d.className = 'kpi' + (good === undefined ? '' : (good ? ' good' : ''));
    var b = document.createElement('b'); b.textContent = value;
    var s = document.createElement('span'); s.textContent = label;
    d.appendChild(b); d.appendChild(s); return d;
  }
  function run() {
    err.textContent = ''; out.innerHTML = '';
    document.querySelectorAll('.july-note').forEach(function (n) { n.remove(); });
    var purpose = f.purpose.value;
    if (modeTrip.checked) {
      var ymd = f.date.value, miles = Number(f.miles.value);
      if (!ymd) { err.textContent = 'Pick a trip date.'; return; }
      if (!(miles >= 0) || !isFinite(miles)) { err.textContent = 'Miles must be a number ≥ 0.'; return; }
      var r = MileageCalc.deductionForTrip(purpose, ymd, miles);
      if (!r) { err.textContent = 'No IRS rate found for that date/purpose (this tool covers calendar 2026).'; return; }
      out.appendChild(kpi('Estimated deduction', usd(r.dollars), r.dollars > 0));
      out.appendChild(kpi('Rate used', r.cents + '¢ / mile'));
      out.appendChild(kpi('Miles', miles.toLocaleString('en-US')));
      out.appendChild(kpi('Purpose', purpose.charAt(0).toUpperCase() + purpose.slice(1)));
    } else {
      var year = Number(f.year.value) || 2026;
      var monthly = [];
      for (var m = 1; m <= 12; m++) {
        var el = f['m' + m];
        monthly.push(el && el.value !== '' ? Number(el.value) : 0);
      }
      if (monthly.some(function (x) { return !isFinite(x) || x < 0; })) { err.textContent = 'Each month must be a number ≥ 0.'; return; }
      var y = MileageCalc.yearTotals(purpose, year, monthly);
      if (!y) { err.textContent = 'Could not compute year totals.'; return; }
      out.appendChild(kpi('2026 estimated deduction', usd(y.dollars), y.dollars > 0));
      out.appendChild(kpi('Total miles', y.miles.toLocaleString('en-US')));
      if (purpose === 'business' || purpose === 'medical') {
        var h1 = 0, h2 = 0, m1 = 0, m2 = 0;
        for (var i = 0; i < 6; i++) { h1 += y.months[i].dollars; m1 += monthly[i]; }
        for (var j = 6; j < 12; j++) { h2 += y.months[j].dollars; m2 += monthly[j]; }
        out.appendChild(kpi('Jan–Jun @ ' + y.months[0].cents + '¢', usd(h1) + ' · ' + m1.toLocaleString() + ' mi'));
        out.appendChild(kpi('Jul–Dec @ ' + y.months[6].cents + '¢', usd(h2) + ' · ' + m2.toLocaleString() + ' mi'));
      } else {
        out.appendChild(kpi('Rate used', y.months[0].cents + '¢ / mile'));
      }
    }
  }
  modeTrip.addEventListener('change', setMode);
  modeYear.addEventListener('change', setMode);
  f.addEventListener('input', run);
  setMode();
})();
