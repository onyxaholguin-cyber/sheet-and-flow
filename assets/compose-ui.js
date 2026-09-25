(function () {
  var f = document.getElementById('gen'), err = document.getElementById('gen-err'), out = document.getElementById('gen-out');
  document.getElementById('gen-go').addEventListener('click', function () {
    var o = {
      domain: f.domain.value.trim().toLowerCase(), email: f.email.value.trim(), timezone: f.timezone.value.trim(),
      version: f.version.value.trim(), pruneHours: parseInt(f.pruneHours.value, 10) || 336, allowTls: !!f.allowTls.value
    };
    var errs = ComposeGen.validate(o);
    if (errs.length) { err.textContent = errs.join('. '); out.hidden = true; return; }
    err.textContent = '';
    var g = ComposeGen.generate(o);
    document.getElementById('out-env').value = g.env;
    document.getElementById('out-compose').value = g.compose;
    document.getElementById('out-caddy').value = g.caddyfile;
    document.getElementById('gen-fp').textContent = g.keyFingerprintHint;
    out.hidden = false;
  });
  out.addEventListener('click', function (e) {
    var t = e.target, id = t.getAttribute('data-copy') || t.getAttribute('data-dl'); if (!id) return;
    var text = document.getElementById(id).value;
    if (t.hasAttribute('data-copy')) {
      var done = function () { var o = t.textContent; t.textContent = 'Copied'; setTimeout(function () { t.textContent = o; }, 1200); };
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, function () { document.getElementById(id).select(); });
      else { document.getElementById(id).select(); document.execCommand('copy'); done(); }
    } else {
      var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
      a.download = t.getAttribute('data-name'); document.body.appendChild(a); a.click(); a.remove();
    }
  });
})();
