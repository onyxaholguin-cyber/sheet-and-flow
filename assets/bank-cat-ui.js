(function () {
  'use strict';
  var B = window.BankCat, $ = function (id) { return document.getElementById(id); };
  var form = $('bc'), csvEl = $('bc-csv'), rulesEl = $('bc-rules'), last = null;
  var SAMPLE = {
    landlord: 'Date,Description,Amount\n09/01/2026,ZELLE PAYMENT FROM J RIVERA,1450.00\n09/03/2026,TURBOTENANT RENT PMT CHEN,1400.00\n09/04/2026,THE HOME DEPOT #1234 DENVER CO,-86.43\n09/05/2026,ROCKET MORTGAGE LOAN PMT,-1612.22\n09/08/2026,XCEL ENERGY PAYMENT,-142.10\n09/10/2026,ABC PLUMBING & HEATING,-325.00\n09/12/2026,STATE FARM INSURANCE,-98.00\n09/15/2026,MAPLE RIDGE HOA DUES,-210.00\n09/22/2026,KWIK MART 0042,-12.50\n',
    freelancer: 'Date,Description,Amount\n09/02/2026,ADOBE *CREATIVE CLOUD,-59.99\n09/03/2026,CLIENT PAYMENT ACME,1600.00\n09/05/2026,STARBUCKS 12345,-6.45\n09/08/2026,VERIZON WIRELESS,-85.00\n09/10/2026,UPWORK -FEE 998877,-42.00\n09/15/2026,IRS USATAXPYMT,-1400.00\n09/18/2026,DELTA AIR 0062,-312.40\n09/20/2026,GROCERY OUTLET,-54.10\n'
  };
  function mode() { return form.mode.value; }
  function key() { return 'bankcat-rules-' + mode(); }
  function loadRules() {
    var saved = null; try { saved = localStorage.getItem(key()); } catch (e) {}
    rulesEl.value = saved || B.rulesToText(B.PRESETS[mode()].rules);
  }
  function money(v) { return '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function cell(tr, text, tag) { var c = document.createElement(tag || 'td'); c.textContent = text; tr.appendChild(c); return c; }
  function table(el, head, rows) {
    el.textContent = ''; var tr = document.createElement('tr'); head.forEach(function (h) { cell(tr, h, 'th'); }); el.appendChild(tr);
    rows.forEach(function (r) { var t = document.createElement('tr'); r.forEach(function (v) { cell(t, v); }); el.appendChild(t); });
  }
  function kpi(label, value, cls) {
    var d = document.createElement('div'); d.className = 'kpi' + (cls ? ' ' + cls : '');
    var b = document.createElement('b'); b.textContent = value; var s = document.createElement('span'); s.textContent = label;
    d.appendChild(b); d.appendChild(s); return d;
  }
  function run() {
    $('bc-err').textContent = ''; $('bc-rule-err').textContent = ''; $('bc-copied').textContent = '';
    var parsed = B.parseRulesText(rulesEl.value, mode());
    if (parsed.errors.length) $('bc-rule-err').textContent = parsed.errors.slice(0, 3).join(' · ');
    try { localStorage.setItem(key(), rulesEl.value); } catch (e) {}
    if (!csvEl.value.trim()) { $('bc-out').hidden = true; return; }
    try {
      last = B.categorize(csvEl.value, { mode: mode(), property: form.property.value.trim(), dateOrder: form.dateOrder.value, flipSign: !!form.flipSign.value, rules: parsed.rules });
    } catch (e) { $('bc-err').textContent = e.message; $('bc-out').hidden = true; return; }
    var k = $('bc-kpis'); k.textContent = '';
    k.appendChild(kpi('rows categorized', String(last.rows.length - last.uncategorized) + ' / ' + last.rows.length, 'good'));
    k.appendChild(kpi('need a category', String(last.uncategorized), last.uncategorized ? 'bad' : ''));
    if (last.mode === 'freelancer') k.appendChild(kpi('money-in rows left out', String(last.incomeSkipped)));
    k.appendChild(kpi('lines skipped (no date/amount)', String(last.skipped)));
    $('bc-hint').textContent = B.PRESETS[last.mode].pasteHint;
    table($('bc-sum'), ['Category', 'Tax line', 'Rows', 'Total'], last.summary.map(function (s) { return [s.category, s.line || '-', String(s.count), money(s.total)]; }));
    table($('bc-rows'), last.columns.concat(['Note']), last.rows.map(function (r) { return r.row.map(function (v, i) { return typeof v === 'number' ? v.toFixed(2) : v; }).concat([r.note]); }));
    $('bc-out').hidden = false;
  }
  $('bc-file').addEventListener('change', function (e) {
    var f = e.target.files[0]; if (!f) return;
    var rd = new FileReader(); rd.onload = function () { csvEl.value = rd.result; run(); }; rd.readAsText(f);
  });
  $('bc-sample').addEventListener('click', function () { csvEl.value = SAMPLE[mode()]; run(); });
  $('bc-reset').addEventListener('click', function () { try { localStorage.removeItem(key()); } catch (e) {} loadRules(); run(); });
  $('bc-copy').addEventListener('click', function () {
    if (!last) return; var text = B.toTSV(last, false);
    (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(function () { $('bc-copied').textContent = 'Copied ' + last.rows.length + ' rows. Paste into the first empty row, column A.'; },
      function () { var ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); $('bc-copied').textContent = 'Copied.'; });
  });
  $('bc-dl').addEventListener('click', function () {
    if (!last) return; var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([B.toCSV(last)], { type: 'text/csv' })); a.download = 'categorized-' + last.mode + '.csv'; a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  });
  form.mode.addEventListener('change', function () { loadRules(); run(); });
  ['property', 'dateOrder', 'flipSign'].forEach(function (n) { form[n].addEventListener('change', run); });
  form.property.addEventListener('input', run);
  csvEl.addEventListener('input', run);
  var t; rulesEl.addEventListener('input', function () { clearTimeout(t); t = setTimeout(run, 300); });
  loadRules();
})();
