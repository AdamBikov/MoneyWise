// Стартиране: node tests/algo.test.js
const fs = require('fs'), assert = require('assert');
const Algo = new Function(fs.readFileSync(__dirname + '/../js/algo.js', 'utf8') + '; return Algo;')();
let pass = 0; const ok = (n, f) => { try { f(); pass++; console.log('✔', n); } catch (e) { console.error('✘', n, '-', e.message); process.exitCode = 1; } };
const cats = [{ id: 'h', key: 'housing', kind: 'expense' }, { id: 'f', key: 'food', kind: 'expense' }, { id: 's', key: 'salary', kind: 'income' }, { id: 'o', key: 'other', kind: 'expense', name_bg: 'Други', name_en: 'Other' }, { id: 'c', key: 'eatout', kind: 'expense', name_bg: 'Заведения', name_en: 'Eating out', keywords: 'кафе,coffee' }];
const today = new Date(2026, 10, 15);
const tx = (d, type, cid, a) => ({ id: Math.random(), tx_date: d, type, category_id: cid, amount: a });

ok('monthStats sums income/expense', () => { const s = Algo.monthStats([tx('2026-11-01', 'income', 's', 1000), tx('2026-11-02', 'expense', 'f', 40), tx('2026-10-02', 'expense', 'f', 99)], '2026-11'); assert.equal(s.income, 1000); assert.equal(s.expense, 40); assert.equal(s.net, 960); });
ok('forecast projects beyond spent so far', () => { const t = []; for (let d = 1; d <= 15; d++) t.push(tx('2026-11-' + String(d).padStart(2, '0'), 'expense', 'f', 10)); const f = Algo.forecast(t, cats, today); assert.ok(f.projectedExpense > 150 && f.projectedExpense < 320, f.projectedExpense); assert.equal(f.remainingDays, 15); });
ok('forecast adds expected income not yet received', () => { const f = Algo.forecast([tx('2026-10-28', 'income', 's', 500)], cats, today); assert.equal(f.expectedIncome, 500); });
ok('health score within 0..100', () => { const h = Algo.health({ tx: [tx('2026-11-01', 'income', 's', 2000), tx('2026-11-03', 'expense', 'f', 100)], cats, budgets: [], goals: [], today }); assert.ok(h.score >= 0 && h.score <= 100); assert.ok(['excellent', 'good', 'fair', 'risky'].includes(h.grade)); });
ok('health: saver beats overspender', () => { const a = Algo.health({ tx: [tx('2026-11-01', 'income', 's', 2000), tx('2026-11-03', 'expense', 'f', 100)], cats, budgets: [], goals: [], today }).score; const b = Algo.health({ tx: [tx('2026-11-01', 'income', 's', 2000), tx('2026-11-03', 'expense', 'f', 2300)], cats, budgets: [], goals: [], today }).score; assert.ok(a > b); });
ok('allocate never exceeds surplus or remaining', () => { const g = [{ id: 1, target_amount: 1000, saved_amount: 0, deadline: '2027-03-15', priority: 3 }, { id: 2, target_amount: 600, saved_amount: 500, deadline: '2027-01-15', priority: 1 }]; const r = Algo.allocate(g, 300, today); assert.ok(Algo.sum(r.map(x => x.give)) <= 300.01); r.forEach(x => assert.ok(x.give <= x.remaining + 0.01)); });
ok('allocate: higher priority gets more under shortage', () => { const mk = p => ({ target_amount: 1200, saved_amount: 0, deadline: '2027-11-15', priority: p }); const r = Algo.allocate([mk(1), mk(3)], 50, today); assert.ok(r[1].give > r[0].give); });
ok('allocate: zero surplus gives zero', () => { const r = Algo.allocate([{ target_amount: 100, saved_amount: 0, deadline: '2027-01-01', priority: 2 }], 0, today); assert.equal(r[0].give, 0); });
ok('anomalies flags a huge outlier only', () => { const t = [12, 14, 15, 13, 16, 14].map((a, i) => tx('2026-11-0' + (i + 1), 'expense', 'f', a)); t.push(tx('2026-11-10', 'expense', 'f', 180)); const a = Algo.anomalies(t, cats, today); assert.equal(a.length, 1); assert.equal(a[0].tx.amount, 180); });
ok('anomalies ignores fixed housing costs', () => { const t = [450, 450, 450, 450, 900].map((a, i) => tx('2026-11-0' + (i + 1), 'expense', 'h', a)); assert.equal(Algo.anomalies(t, cats, today).length, 0); });
ok('parseQuick: expense + category keyword', () => { const p = Algo.parseQuick('кафе 4,50', cats); assert.equal(p.amount, 4.5); assert.equal(p.type, 'expense'); assert.equal(p.category_id, 'c'); });
ok('parseQuick: income with plus sign', () => { const p = Algo.parseQuick('+заплата 1800', cats); assert.equal(p.type, 'income'); assert.equal(p.amount, 1800); });
ok('parseQuick: yesterday shifts date', () => { const p = Algo.parseQuick('coffee 3 yesterday', cats); const y = new Date(); y.setDate(y.getDate() - 1); assert.equal(p.tx_date, Algo.iso(y)); });
ok('parseQuick: no number → null', () => assert.equal(Algo.parseQuick('кафе', cats), null));
console.log(`\n${pass} passed`);
