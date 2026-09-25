(function () {
  'use strict';
  var A = window.N8nAudit, $ = function (id) { return document.getElementById(id); }, ta = $('na-json');
  var SAMPLE = '{"name":"Example: risky lead intake","nodes":[{"parameters":{"httpMethod":"POST","path":"new-lead"},"name":"Webhook","type":"n8n-nodes-base.webhook","typeVersion":2,"position":[0,0]},{"parameters":{"method":"POST","url":"http://crm.example.com/api/leads","sendHeaders":true,"headerParameters":{"parameters":[{"name":"X-API-Key","value":"demo-key-not-real-000111"}]}},"name":"Create lead","type":"n8n-nodes-base.httpRequest","typeVersion":4.2,"position":[220,0],"onError":"continueRegularOutput"},{"parameters":{},"name":"Old step","type":"n8n-nodes-base.noOp","typeVersion":1,"position":[440,200],"disabled":true}],"connections":{"Webhook":{"main":[[{"node":"Create lead","type":"main","index":0}]]}},"pinData":{"Webhook":[{"json":{"email":"someone@example.com"}}]},"settings":{}}';
  function el(tag, text, cls) { var e = document.createElement(tag); if (text != null) e.textContent = text; if (cls) e.className = cls; return e; }
  function run() {
    var out = $('na-out'), err = $('na-err'); out.textContent = ''; err.textContent = '';
    if (!ta.value.trim()) return;
    var json; try { json = JSON.parse(ta.value); } catch (e) { err.textContent = 'Not valid JSON: ' + e.message; return; }
    var wfs = A.extractWorkflows(json);
    if (!wfs.length) { err.textContent = 'No n8n workflow found. Paste the JSON from the n8n editor (select all nodes, copy) or a downloaded workflow file.'; return; }
    var total = { error: 0, warn: 0, info: 0 };
    wfs.forEach(function (wf) {
      var f = A.auditWorkflow(wf); f.forEach(function (x) { total[x.level]++; });
      out.appendChild(el('h3', (wf.name || 'Workflow') + (f.length ? '' : ': no issues found')));
      if (!f.length) return;
      var ul = el('ul', null, 'list');
      f.forEach(function (x) {
        var li = el('li'); var b = el('strong', '[' + x.level + '] ' + x.title + (x.node ? ' (node: ' + x.node + ')' : ''));
        b.style.color = x.level === 'error' ? '#b91c1c' : (x.level === 'warn' ? '#b45309' : '#0f766e');
        li.appendChild(b); if (x.detail) li.appendChild(el('p', x.detail)); li.appendChild(el('p', 'Fix: ' + x.fix)); ul.appendChild(li);
      });
      out.appendChild(ul);
    });
    out.insertBefore(el('p', wfs.length + ' workflow(s): ' + total.error + ' error(s), ' + total.warn + ' warning(s), ' + total.info + ' info. Rule ids and CI usage are in the open-source CLI.'), out.firstChild);
  }
  $('na-file').addEventListener('change', function (e) { var f = e.target.files[0]; if (!f) return; var r = new FileReader(); r.onload = function () { ta.value = r.result; run(); }; r.readAsText(f); });
  $('na-sample').addEventListener('click', function () { ta.value = JSON.stringify(JSON.parse(SAMPLE), null, 1); run(); });
  var t; ta.addEventListener('input', function () { clearTimeout(t); t = setTimeout(run, 250); });
})();
