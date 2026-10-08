/* Rental Property Calculator Pro demo: shows the precomputed results in pro-demo-data.js for the 3 sample deals.
   No calculator code here; the full app is the paid download. Renders with textContent only. */
(function () {
  var D = window.SF_PRO_DEMO; if (!D) return;
  var $ = function (id) { return document.getElementById(id); };
  var el = function (tag, text, cls) { var e = document.createElement(tag); if (text != null) e.textContent = text; if (cls) e.className = cls; return e; };
  function table(host, head, rows) {
    host.textContent = ''; var t = el('table'), th = el('thead'), tr = el('tr');
    head.forEach(function (h) { tr.appendChild(el('th', h)); }); th.appendChild(tr); t.appendChild(th);
    var tb = el('tbody'); rows.forEach(function (r) { var row = el('tr'); r.forEach(function (c, i) { row.appendChild(el(i ? 'td' : 'th', c)); }); tb.appendChild(row); });
    t.appendChild(tb); host.appendChild(t);
  }
  function show(i) {
    var d = D.deals[i];
    table($('demo-inputs'), ['Input', 'Value'], d.inputs.map(function (x) { return [x[1], x[2]]; }));
    var k = $('demo-kpis'); k.textContent = '';
    d.kpis.forEach(function (x) { var c = el('div', null, 'kpi' + (x[2] == null ? '' : (x[2] ? ' good' : ' bad'))); c.appendChild(el('b', x[1])); c.appendChild(el('span', x[0])); k.appendChild(c); });
    table($('demo-proj'), d.proj.head, d.proj.rows);
    $('demo-offer').textContent = d.offer;
  }
  var s = $('demo-deal');
  D.deals.forEach(function (d, i) { var o = el('option', d.name); o.value = i; s.appendChild(o); });
  s.addEventListener('change', function () { show(Number(this.value)); });
  $('demo-targets').textContent = 'Example targets for the samples: ' + D.targets + '. In Pro you set your own targets for your own deals.';
  table($('demo-compare'), D.compare.head, D.compare.rows);
  show(0);
})();
