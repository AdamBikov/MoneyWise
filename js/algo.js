/*
 * MoneyWise — СОБСТВЕН АЛГОРИТЪМ / OWN ALGORITHMS
 * Всички функции са чисти (без странични ефекти) и лесни за обяснение:
 *  1. forecast()   — прогноза за края на месеца (EMA + фиксирани/променливи разходи)
 *  2. health()     — Индекс на финансово здраве 0–100 (4 претеглени компонента)
 *  3. allocate()   — „умно“ разпределение на спестяванията по цели (спешност × приоритет)
 *  4. anomalies()  — откриване на необичайни разходи (modified z-score с MAD)
 *  5. parseQuick() — разпознаване на естествен текст: „кафе 4.50“, „+заплата 1800“
 */
const Algo = (() => {
  const pad = n => String(n).padStart(2, '0');
  const iso = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const ym = d => iso(d).slice(0, 7);
  const addMonths = (m, n) => { const [y, mo] = m.split('-').map(Number); return ym(new Date(y, mo - 1 + n, 1)); };
  const daysIn = m => { const [y, mo] = m.split('-').map(Number); return new Date(y, mo, 0).getDate(); };
  const clamp = (x, a = 0, b = 100) => Math.max(a, Math.min(b, x));
  const sum = a => a.reduce((s, x) => s + x, 0);
  const median = a => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
  const FIXED_KEYS = ['housing'];

  function monthStats(tx, m) {
    let income = 0, expense = 0; const byCat = {};
    for (const x of tx) {
      if (x.tx_date.slice(0, 7) !== m) continue;
      const a = +x.amount;
      if (x.type === 'income') income += a;
      else { expense += a; byCat[x.category_id] = (byCat[x.category_id] || 0) + a; }
    }
    return { income, expense, net: income - expense, byCat };
  }

  /* 1. ПРОГНОЗА ------------------------------------------------------------ */
  function forecast(tx, cats, today = new Date()) {
    const m = ym(today), dim = daysIn(m), d = today.getDate(), rem = dim - d;
    const fixedIds = new Set(cats.filter(c => FIXED_KEYS.includes(c.key)).map(c => c.id));
    const cur = monthStats(tx, m);
    const prevM = addMonths(m, -1);
    // дневни променливи разходи за последните 45 дни
    const perDay = {};
    for (const x of tx) if (x.type === 'expense' && !fixedIds.has(x.category_id)) perDay[x.tx_date] = (perDay[x.tx_date] || 0) + (+x.amount);
    const vals = [];
    for (let i = 44; i >= 0; i--) { const dt = new Date(today); dt.setDate(dt.getDate() - i); vals.push(perDay[iso(dt)] || 0); }
    // winsorize: големи еднократни покупки не бива да „взривяват“ прогнозата
    const nz = vals.filter(v => v > 0), cap = nz.length ? median(nz) * 4 : 0;
    const alpha = 0.12; let ema = 0, init = false;
    for (const v of vals) { const c = cap ? Math.min(v, cap) : v; ema = init ? alpha * c + (1 - alpha) * ema : c; init = true; }
    const varSoFar = sum(tx.filter(x => x.type === 'expense' && x.tx_date.slice(0, 7) === m && !fixedIds.has(x.category_id)).map(x => +x.amount));
    const monthAvg = d > 0 ? varSoFar / d : 0;
    const rate = 0.6 * ema + 0.4 * monthAvg;                       // смесена дневна скорост
    const fixedSoFar = sum(tx.filter(x => x.type === 'expense' && x.tx_date.slice(0, 7) === m && fixedIds.has(x.category_id)).map(x => +x.amount));
    const fixedPrev = sum(tx.filter(x => x.type === 'expense' && x.tx_date.slice(0, 7) === prevM && fixedIds.has(x.category_id)).map(x => +x.amount));
    const fixedExpected = Math.max(fixedSoFar, fixedPrev);
    const remainingExpense = Math.max(0, fixedExpected - fixedSoFar) + rate * rem;
    const projectedExpense = cur.expense + remainingExpense;
    // очаквани приходи: категории доходи от миналия месец, които още не са пристигнали
    const incCatsNow = new Set(tx.filter(x => x.type === 'income' && x.tx_date.slice(0, 7) === m).map(x => x.category_id));
    const expectedIncome = sum(tx.filter(x => x.type === 'income' && x.tx_date.slice(0, 7) === prevM && +x.tx_date.slice(8) > d && !incCatsNow.has(x.category_id)).map(x => +x.amount));
    return { rate, ema, remainingDays: rem, remainingExpense, projectedExpense, expectedIncome,
      projectedNet: cur.income + expectedIncome - projectedExpense, cur };
  }

  /* 2. ИНДЕКС НА ФИНАНСОВО ЗДРАВЕ ------------------------------------------ */
  function health({ tx, cats, budgets, goals, today = new Date() }) {
    const m = ym(today);
    // а) норма на спестяване за последните 3 месеца (тегло 35)
    let inc = 0, net = 0;
    for (let i = 0; i < 3; i++) { const s = monthStats(tx, addMonths(m, -i)); inc += s.income; net += s.net; }
    const rate = inc > 0 ? net / inc : 0;
    const savings = clamp(rate / 0.2 * 100);                      // 20% спестяване = 100 т.
    // б) спазване на бюджетите (тегло 30)
    const cur = monthStats(tx, m), frac = Math.max(0.12, today.getDate() / daysIn(m));
    let budget = 60;
    if (budgets.length) {
      budget = sum(budgets.map(b => {
        const spent = cur.byCat[b.category_id] || 0, lim = +b.limit_amount;
        if (spent > lim) return Math.max(0, 25 - (spent / lim - 1) * 100);
        const pace = spent / frac;                                  // очакван месечен разход при този темп
        return pace > lim ? 65 : 100;
      })) / budgets.length;
    }
    // в) стабилност на разходите — коефициент на вариация по седмици (тегло 15)
    const weeks = Array(8).fill(0);
    const fixedIds = new Set(cats.filter(c => FIXED_KEYS.includes(c.key)).map(c => c.id));
    for (const x of tx) {
      if (x.type !== 'expense' || fixedIds.has(x.category_id)) continue;
      const age = Math.floor((today - new Date(x.tx_date + 'T12:00:00')) / 864e5);
      if (age >= 0 && age < 56) weeks[Math.floor(age / 7)] += +x.amount;
    }
    const mean = sum(weeks) / 8, sd = Math.sqrt(sum(weeks.map(w => (w - mean) ** 2)) / 8);
    const stability = mean > 0 ? clamp(100 - (sd / mean) * 100) : 50;
    // г) цели (тегло 20)
    let goalScore = 50;
    if (goals.length) {
      goalScore = sum(goals.map(g => {
        const p = clamp(+g.saved_amount / +g.target_amount, 0, 1);
        const left = Math.max(1, monthsUntil(g.deadline, today));
        const need = (+g.target_amount - +g.saved_amount) / left;
        const avgNet = Math.max(0, net / 3);
        const feas = need <= 0 ? 1 : clamp(avgNet / (need * goals.length), 0, 1);
        return (p * 0.5 + feas * 0.5) * 100;
      })) / goals.length;
    }
    const score = Math.round(savings * 0.35 + budget * 0.30 + stability * 0.15 + goalScore * 0.20);
    const grade = score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'fair' : 'risky';
    return { score, grade, rate, parts: { savings, budget, stability, goals: goalScore } };
  }

  function monthsUntil(deadline, today = new Date()) {
    if (!deadline) return 12;
    const d = new Date(deadline + 'T12:00:00');
    return (d.getFullYear() - today.getFullYear()) * 12 + d.getMonth() - today.getMonth() + (d.getDate() - today.getDate()) / 30;
  }

  /* 3. УМНО РАЗПРЕДЕЛЕНИЕ НА СПЕСТЯВАНИЯТА --------------------------------- */
  function allocate(goals, surplus, today = new Date()) {
    const open = goals.filter(g => +g.saved_amount < +g.target_amount);
    const rows = open.map(g => {
      const remaining = +g.target_amount - +g.saved_amount;
      const months = Math.max(1, monthsUntil(g.deadline, today));
      const need = remaining / months;                              // нужна месечна вноска
      const weight = need * (0.8 + 0.2 * (+g.priority || 2));       // спешност × приоритет
      return { goal: g, remaining, months, need, weight, give: 0 };
    });
    let pool = Math.max(0, surplus);
    const totalNeed = sum(rows.map(r => r.need));
    if (pool <= 0 || !rows.length) { rows.forEach(r => { r.eta = Infinity; }); return rows; }
    if (totalNeed <= pool) {                                        // достатъчно: покриваме всичко + разпределяме остатъка
      rows.forEach(r => r.give = r.need);
      let extra = pool - totalNeed, w = sum(rows.map(r => r.weight));
      rows.forEach(r => r.give = Math.min(r.remaining, r.give + extra * r.weight / w));
    } else {                                                        // недостиг: делим пропорционално на теглото
      const w = sum(rows.map(r => r.weight));
      rows.forEach(r => r.give = Math.min(r.remaining, pool * r.weight / w));
    }
    rows.forEach(r => { r.give = Math.round(r.give * 100) / 100; r.eta = r.give > 0 ? r.remaining / r.give : Infinity; r.onTrack = r.eta <= r.months + 0.5; });
    return rows;
  }

  /* 4. АНОМАЛИИ (modified z-score) ----------------------------------------- */
  function anomalies(tx, cats, today = new Date(), windowDays = 35) {
    const byCat = {};
    for (const x of tx) if (x.type === 'expense') (byCat[x.category_id] = byCat[x.category_id] || []).push(x);
    const fixedIds = new Set(cats.filter(c => FIXED_KEYS.includes(c.key)).map(c => c.id));
    const out = [];
    for (const [cid, list] of Object.entries(byCat)) {
      if (list.length < 5 || fixedIds.has(cid)) continue;
      const a = list.map(x => +x.amount), med = median(a);
      let mad = median(a.map(v => Math.abs(v - med)));
      const meanAD = sum(a.map(v => Math.abs(v - med))) / a.length;
      for (const x of list) {
        const age = (today - new Date(x.tx_date + 'T12:00:00')) / 864e5;
        if (age > windowDays || age < -1) continue;
        const v = +x.amount;
        const z = mad > 0 ? 0.6745 * (v - med) / mad : meanAD > 0 ? (v - med) / (1.2533 * meanAD) : (v > med * 3 ? 9 : 0);
        if (z > 3.5 && v > med * 2) out.push({ tx: x, z: Math.round(z * 10) / 10, median: med });
      }
    }
    return out.sort((p, q) => q.z - p.z);
  }

  /* 5. БЪРЗО ВЪВЕЖДАНЕ ОТ ЕСТЕСТВЕН ТЕКСТ ----------------------------------- */
  function parseQuick(text, cats) {
    const m = text.match(/(\d+(?:[.,]\d{1,2})?)/);
    if (!m) return null;
    const amount = parseFloat(m[1].replace(',', '.'));
    if (!(amount > 0)) return null;
    const type = /^\s*\+/.test(text) ? 'income' : 'expense';
    let date = new Date();
    let note = text.replace(m[0], ' ').replace(/[+€]|\beur\b|евро|лв\.?/gi, ' ');
    if (/вчера|yesterday/i.test(note)) { date.setDate(date.getDate() - 1); note = note.replace(/вчера|yesterday/ig, ' '); }
    else if (/днес|today/i.test(note)) note = note.replace(/днес|today/ig, ' ');
    note = note.replace(/\s+/g, ' ').trim();
    const low = note.toLowerCase();
    let best = null, bestLen = 0;
    for (const c of cats.filter(c => c.kind === type)) {
      const words = [c.name_bg, c.name_en, ...(c.keywords || '').split(',')].map(s => (s || '').trim().toLowerCase()).filter(s => s.length > 1);
      for (const w of words) if (low.includes(w) && w.length > bestLen) { best = c; bestLen = w.length; }
    }
    if (!best) best = cats.find(c => c.kind === type && c.key === 'other') || cats.find(c => c.kind === type);
    return { type, amount, category_id: best ? best.id : null, note, tx_date: iso(date), matched: bestLen > 0 };
  }

  return { iso, ym, addMonths, daysIn, monthStats, forecast, health, allocate, anomalies, parseQuick, monthsUntil, median, sum, clamp };
})();
