/* bank-csv-categorizer: turn a bank/card CSV export into categorized rows for
   landlord (Schedule E) or freelancer (Schedule C) spreadsheets. Runs locally, zero dependencies.
   Works in the browser (window.BankCat) and in Node (require). MIT license. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.BankCat = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ---------- presets (categories match the Sheet & Flow trackers' Setup tabs) ----------
  const PRESETS = {
    landlord: {
      label: 'Landlord (Schedule E)',
      categories: {
        'Rent': 'Line 3', 'Late fee': 'Line 3', 'Pet / other tenant fees': 'Line 3', 'Kept security deposit': 'Line 3', 'Other rental income': 'Line 3',
        'Advertising': 'Line 5', 'Auto & travel': 'Line 6', 'Cleaning & maintenance': 'Line 7', 'Commissions': 'Line 8', 'Insurance': 'Line 9',
        'Legal & professional fees': 'Line 10', 'Management fees': 'Line 11', 'Mortgage interest': 'Line 12', 'Other interest': 'Line 13',
        'Repairs': 'Line 14', 'Supplies': 'Line 15', 'Property taxes': 'Line 16', 'Utilities': 'Line 17', 'Depreciation': 'Line 18',
        'HOA dues': 'Line 19', 'Pest control': 'Line 19', 'Landscaping / snow': 'Line 19', 'Other expense': 'Line 19',
        'Mortgage principal': 'None', 'Capital improvement': 'None', 'Owner draw / transfer': 'None',
      },
      rules: [
        ['in', 'late fee', 'Late fee'],
        ['in', 'security deposit', 'Other rental income'],
        ['in', 'rent|zelle|venmo|cash app|cashapp|paypal|turbotenant|avail|cozy|rentredi|apartments\\.com|baselane|buildium|appfolio', 'Rent'],
        ['any', 'transfer|xfer|to savings|from savings', 'Owner draw / transfer'],
        ['out', 'property tax|county treas|tax collector|assessor', 'Property taxes'],
        ['out', 'hoa|homeowners assoc|owners association|condo assoc', 'HOA dues'],
        ['out', 'pest|terminix|orkin|rollins', 'Pest control'],
        ['out', 'lawn|landscap|snow removal|snow plow|tree service', 'Landscaping / snow'],
        ['out', 'property management|prop mgmt|management fee', 'Management fees'],
        ['out', 'plumb|electrician|hvac|heating|handyman|roofing|roofer|appliance repair|locksmith|garage door', 'Repairs'],
        ['out', 'home depot|lowe\'?s|menards|ace hardware|harbor freight|true value', 'Supplies'],
        ['out', 'clean|maid|janitorial|carpet|junk removal', 'Cleaning & maintenance'],
        ['out', 'insurance|state farm|allstate|geico|progressive|farmers ins|nationwide|lemonade|obie|steadily|travelers', 'Insurance'],
        ['out', 'water|sewer|electric|energy|power co|utility|utilities|xcel|pg&e|duke|con ed|dominion|waste|trash|republic services|natural gas', 'Utilities'],
        ['out', 'zillow|apartments\\.com|craigslist|rentler|hotpads|facebook ads|meta ads', 'Advertising'],
        ['out', 'attorney|law office|legal|cpa|accountant|bookkeep|tax prep|turbotax|h&r block', 'Legal & professional fees'],
        ['out', 'realtor|brokerage|leasing fee|tenant placement', 'Commissions'],
        ['out', 'mileage|parking|toll|uber|lyft', 'Auto & travel'],
      ],
      notes: { 'mortgage|home loan|loan pmt|loan payment|rocket|mr\\.? cooper|servicing': 'Mortgage payment: split it into Mortgage interest, Mortgage principal and escrow (taxes/insurance) using your lender statement.' },
      columns: ['Date', 'Property', 'Unit', 'Category', 'Payee / payer', 'Description', 'Amount'],
      pasteHint: 'Paste into the Transactions tab, cell A (first empty row). Columns: Date, Property, Unit, Category, Payee / payer, Description, Amount.',
    },
    freelancer: {
      label: 'Freelancer (Schedule C)',
      categories: {
        'Advertising & marketing': 'Line 8', 'Car & truck': 'Line 9', 'Platform & payment fees': 'Line 10', 'Contractors': 'Line 11',
        'Equipment (depreciation / 179)': 'Line 13', 'Business insurance': 'Line 15', 'Interest (business)': 'Line 16b', 'Legal & accounting': 'Line 17',
        'Office expense & postage': 'Line 18', 'Equipment rental': 'Line 20a', 'Coworking / office rent': 'Line 20b', 'Repairs & maintenance': 'Line 21',
        'Supplies & materials': 'Line 22', 'Licenses & business taxes': 'Line 23', 'Travel': 'Line 24a', 'Business meals': 'Line 24b',
        'Phone & internet': 'Line 25', 'Software & subscriptions': 'Line 27a', 'Education & training': 'Line 27a', 'Bank fees': 'Line 27a',
        'Other business expense': 'Line 27a', 'Home office': 'Line 30', 'Not on Schedule C (personal / owner draw / tax payments)': 'None',
      },
      rules: [
        ['out', 'irs|us treasury|u\\.s\\. treasury|eftps|state tax|dept of revenue|department of revenue|franchise tax bd|transfer|xfer', 'Not on Schedule C (personal / owner draw / tax payments)'],
        ['out', 'google ads|facebook ads|meta ads|fb ads|linkedin ads|mailchimp|convertkit|kit\\.com|beehiiv|squarespace|wix|godaddy|namecheap', 'Advertising & marketing'],
        ['out', 'stripe fee|paypal fee|square fee|upwork|fiverr|etsy fee|gumroad fee|payoneer fee', 'Platform & payment fees'],
        ['out', 'monthly service fee|service charge|overdraft|wire fee|atm fee|bank fee|maintenance fee', 'Bank fees'],
        ['out', 'adobe|figma|notion|slack|zoom|google \\*?workspace|gsuite|g suite|microsoft|msft|dropbox|github|atlassian|canva|openai|chatgpt|anthropic|aws|amazon web services|digitalocean|heroku|vercel|netlify|quickbooks|freshbooks|1password|calendly|loom', 'Software & subscriptions'],
        ['out', 'verizon|at&t|att\\*|t-mobile|tmobile|comcast|xfinity|spectrum|cox comm|google fi|mint mobile', 'Phone & internet'],
        ['out', 'wework|regus|coworking|industrious', 'Coworking / office rent'],
        ['out', 'staples|office depot|officemax|usps|ups store|fedex|stamps\\.com', 'Office expense & postage'],
        ['out', 'udemy|coursera|skillshare|oreilly|o\'reilly|masterclass|egghead|frontend masters', 'Education & training'],
        ['out', 'airline|delta air|united air|american air|southwest|jetblue|alaska air|hotel|marriott|hilton|hyatt|airbnb|expedia|booking\\.com|amtrak', 'Travel'],
        ['out', 'restaurant|cafe|coffee|starbucks|doordash|grubhub|ubereats|uber eats|chipotle|panera', 'Business meals'],
        ['out', 'uber|lyft|shell|chevron|exxon|mobil|bp#|valero|parking|toll', 'Car & truck'],
        ['out', 'hiscox|next insurance|business insurance|liability ins', 'Business insurance'],
        ['out', 'attorney|law office|legal|cpa|accountant|bookkeep|turbotax|h&r block', 'Legal & accounting'],
        ['out', 'apple\\.com|apple store|best buy|dell|b&h photo|lenovo', 'Equipment (depreciation / 179)'],
        ['out', 'business license|secretary of state|registered agent|llc fee', 'Licenses & business taxes'],
      ],
      notes: {},
      columns: ['Date', 'Vendor', 'Category', 'Description', 'Amount', 'Business-use %'],
      pasteHint: 'Paste into the Expenses tab, cell A (first empty row). Columns: Date, Vendor, Category, Description, Amount, Business-use %. Money coming in is left out: log client payments on the Payments tab.',
    },
  };

  // ---------- CSV ----------
  function detectDelimiter(text) {
    const first = text.split(/\r?\n/).find((l) => l.trim()) || '';
    const counts = [',', ';', '\t'].map((d) => [d, splitLine(first, d).length]);
    counts.sort((a, b) => b[1] - a[1]);
    return counts[0][1] > 1 ? counts[0][0] : ',';
  }
  function splitLine(line, d) { return parseCSV(line, d)[0] || []; }
  function parseCSV(text, delim) {
    text = String(text).replace(/^\uFEFF/, '');
    const d = delim || detectDelimiter(text);
    const rows = []; let row = [], field = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) {
        if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; }
        else field += c;
      } else if (c === '"') q = true;
      else if (c === d) { row.push(field); field = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(field); field = '';
        if (row.some((x) => x.trim() !== '')) rows.push(row);
        row = [];
      } else field += c;
    }
    row.push(field); if (row.some((x) => x.trim() !== '')) rows.push(row);
    return rows;
  }

  // ---------- values ----------
  function parseAmount(s) {
    if (s == null) return null;
    let t = String(s).trim();
    if (!t) return null;
    let neg = false;
    if (/^\(.*\)$/.test(t)) { neg = true; t = t.slice(1, -1); }
    if (/-$/.test(t)) { neg = true; t = t.slice(0, -1); }
    if (/^(CR|DR)\b|\b(CR|DR)$/i.test(t)) { if (/DR/i.test(t)) neg = true; t = t.replace(/\b(CR|DR)\b/ig, ''); }
    t = t.replace(/[\s$€£¥]|USD|EUR|GBP/gi, '');
    if (t.startsWith('-')) { neg = !neg; t = t.slice(1); }
    if (t.startsWith('+')) t = t.slice(1);
    if (/^\d{1,3}(\.\d{3})*,\d{1,2}$/.test(t) || /^\d+,\d{1,2}$/.test(t)) t = t.replace(/\./g, '').replace(',', '.'); // 1.234,56
    else t = t.replace(/,/g, '');
    if (!/^\d*\.?\d+$/.test(t)) return null;
    const v = Math.round(parseFloat(t) * 100) / 100;
    return neg ? -v : v;
  }
  function pad(n) { return String(n).padStart(2, '0'); }
  function parseDate(s, order) {
    const t = String(s || '').trim();
    let m;
    if ((m = t.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/))) return `${m[1]}-${pad(m[2])}-${pad(m[3])}`;
    if ((m = t.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/))) {
      let [a, b, y] = [+m[1], +m[2], +m[3]]; if (y < 100) y += 2000;
      let mo = a, da = b;
      if (order === 'dmy' || (a > 12 && b <= 12)) { mo = b; da = a; }
      if (mo < 1 || mo > 12 || da < 1 || da > 31) return null;
      return `${y}-${pad(mo)}-${pad(da)}`;
    }
    const months = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
    if ((m = t.match(/^(\d{1,2})[ -]([A-Za-z]{3})[a-z]*[ -,]*(\d{4})/)) && months[m[2].toLowerCase()]) return `${m[3]}-${pad(months[m[2].toLowerCase()])}-${pad(m[1])}`;
    if ((m = t.match(/^([A-Za-z]{3})[a-z]*\.? (\d{1,2}),? (\d{4})/)) && months[m[1].toLowerCase()]) return `${m[3]}-${pad(months[m[1].toLowerCase()])}-${pad(m[2])}`;
    return null;
  }

  // ---------- columns ----------
  function detectColumns(header) {
    const h = header.map((x) => String(x).trim().toLowerCase());
    const find = (res, not) => { for (const r of res) { const i = h.findIndex((x) => r.test(x) && !(not && not.test(x))); if (i >= 0) return i; } return -1; };
    const cols = {
      date: find([/^(transaction |trans\.? |posting |posted |post )?date$/, /date/]),
      description: find([/^description$/, /desc/, /payee|merchant|name|memo|narrative|details$|transaction$/], /date|amount|balance|type|category|#/),
      amount: find([/^amount$/, /amount/], /balance|debit|credit/),
      debit: find([/debit|withdrawal|money out|paid out|^out$/]),
      credit: find([/credit|deposit|money in|paid in|^in$/], /card/),
    };
    if (cols.description < 0) cols.description = find([/details|memo/]);
    return cols;
  }

  function cleanVendor(desc) {
    let t = String(desc || '')
      .replace(/^(pos |debit card |dbt crd |purchase |checkcard |check card |recurring |ach |online |card )+(purchase|payment|debit|pmt|withdrawal)?\s*/i, '')
      .replace(/\b(sq|tst|pp|py|sp)\s*\*\s*/i, '')
      .replace(/\b\d{2}\/\d{2}(\/\d{2,4})?\b/g, '')
      .replace(/#?\d{4,}|x{2,}\d+|\*+\d+/gi, '')
      .replace(/\s{2,}/g, ' ').trim();
    t = t.split(/\s+(?=[A-Z]{2}$)/)[0];                 // trailing state code
    const words = t.split(' ').filter(Boolean).slice(0, 4).join(' ');
    return words.replace(/\w\S*/g, (w) => (w.length > 3 || /[a-z]/.test(w) ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w)).trim();
  }

  function compileRules(rules) {
    return rules.map(([dir, pattern, category]) => ({ dir, category, re: new RegExp('(^|[^a-z0-9])(' + pattern + ')', 'i') }));
  }
  function parseRulesText(text, preset) {
    const out = [], errors = [];
    String(text).split(/\r?\n/).forEach((line, i) => {
      const t = line.trim(); if (!t || t.startsWith('#')) return;
      const m = t.match(/^(?:(in|out|any):\s*)?(.+?)\s*=>\s*(.+)$/i);
      if (!m) { errors.push(`Line ${i + 1}: expected "keyword|keyword => Category"`); return; }
      const cat = m[3].trim();
      if (preset && !(cat in PRESETS[preset].categories)) { errors.push(`Line ${i + 1}: unknown category "${cat}"`); return; }
      try { new RegExp(m[2]); } catch (e) { errors.push(`Line ${i + 1}: bad pattern`); return; }
      out.push([(m[1] || 'any').toLowerCase(), m[2].trim(), cat]);
    });
    return { rules: out, errors };
  }
  function rulesToText(rules) { return rules.map(([d, p, c]) => `${d}: ${p} => ${c}`).join('\n'); }

  function categorize(csvText, opts) {
    opts = opts || {};
    const mode = opts.mode || 'landlord'; const P = PRESETS[mode];
    const rules = compileRules(opts.rules || P.rules);
    const notes = Object.entries(P.notes || {}).map(([p, n]) => [new RegExp(p, 'i'), n]);
    const rows = parseCSV(csvText);
    // header = first row with a date-like column name and >= 3 cells (some banks put account info above)
    const hi = rows.findIndex((r) => r.length >= 2 && r.some((c) => /date/i.test(c)));
    if (hi < 0) throw new Error('Could not find a header row with a "Date" column.');
    const cols = detectColumns(rows[hi]);
    if (cols.date < 0 || cols.description < 0 || (cols.amount < 0 && cols.debit < 0 && cols.credit < 0))
      throw new Error('Could not find Date, Description and Amount (or Debit/Credit) columns.');
    const flip = !!opts.flipSign;
    const out = [], skipped = [], summary = {}; let uncategorized = 0, incomeSkipped = 0;
    for (const r of rows.slice(hi + 1)) {
      const date = parseDate(r[cols.date], opts.dateOrder);
      let amt = null;
      if (cols.amount >= 0 && String(r[cols.amount] || '').trim()) amt = parseAmount(r[cols.amount]);
      else {
        const de = cols.debit >= 0 ? parseAmount(r[cols.debit]) : null, cr = cols.credit >= 0 ? parseAmount(r[cols.credit]) : null;
        if (de) amt = -Math.abs(de); else if (cr) amt = Math.abs(cr);
      }
      if (!date || amt == null || amt === 0) { skipped.push(r); continue; }
      if (flip) amt = -amt;
      const desc = String(r[cols.description] || '').replace(/\s+/g, ' ').trim();
      const dir = amt > 0 ? 'in' : 'out';
      if (mode === 'freelancer' && dir === 'in') { incomeSkipped++; continue; }
      const rule = rules.find((x) => (x.dir === 'any' || x.dir === dir) && x.re.test(desc));
      const category = rule ? rule.category : '';
      const note = !category ? (notes.find(([re]) => re.test(desc)) || [])[1] || '' : '';
      if (!category) uncategorized++;
      const line = category ? P.categories[category] : '';
      const key = category || '(uncategorized)';
      summary[key] = summary[key] || { category: key, line: line || '', count: 0, total: 0 };
      summary[key].count++; summary[key].total = Math.round((summary[key].total + Math.abs(amt)) * 100) / 100;
      const vendor = cleanVendor(desc);
      const row = mode === 'landlord'
        ? [date, opts.property || '', '', category, vendor, desc, Math.abs(amt)]
        : [date, vendor, category, desc, Math.abs(amt), ''];
      out.push({ date, amount: amt, direction: dir, description: desc, vendor, category, line, note, row });
    }
    const byLine = {};
    Object.values(summary).forEach((s) => { if (s.line && s.line !== 'None') byLine[s.line] = Math.round(((byLine[s.line] || 0) + s.total) * 100) / 100; });
    return { mode, columns: P.columns, detected: cols, header: rows[hi], rows: out, skipped: skipped.length, incomeSkipped, uncategorized,
      summary: Object.values(summary).sort((a, b) => b.total - a.total), byLine };
  }

  function toTSV(result, withHeader) {
    const esc = (v) => String(v).replace(/[\t\r\n]+/g, ' ');
    const lines = result.rows.map((r) => r.row.map(esc).join('\t'));
    return (withHeader ? [result.columns.join('\t')] : []).concat(lines).join('\n');
  }
  function toCSV(result) {
    const esc = (v) => { v = String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    return [result.columns].concat(result.rows.map((r) => r.row)).map((r) => r.map(esc).join(',')).join('\n') + '\n';
  }

  return { PRESETS, parseCSV, parseAmount, parseDate, detectColumns, cleanVendor, categorize, parseRulesText, rulesToText, toTSV, toCSV };
});
