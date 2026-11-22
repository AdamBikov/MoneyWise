// Тест на слоя за данни (src/js/store.js) с ИМИТАЦИЯ на Supabase клиент.
// Стартиране: node tests/store.test.js
// ВАЖНО: това НЕ замества тест с реален Supabase проект — проверява само, че кодът вика правилните таблици и данни.
const fs = require('fs'), assert = require('assert');
const src = f => fs.readFileSync(__dirname + '/../src/js/' + f, 'utf8');
let pass = 0; const ok = async (n, f) => { try { await f(); pass++; console.log('✔', n); } catch (e) { console.error('✘', n, '-', e.message); process.exitCode = 1; } };

function fakeSupabase(sessionUser, seed = {}) {
  const db = { categories: [], transactions: [], budgets: [], savings_goals: [], goal_contributions: [], ...seed };
  const calls = [];
  const client = {
    calls, db,
    auth: {
      getSession: async () => ({ data: { session: sessionUser ? { user: sessionUser } : null } }),
      signInWithPassword: async ({ email }) => ({ data: { user: { id: 'u1', email } }, error: null }),
      signUp: async () => ({ data: { user: { id: 'u2' }, session: null }, error: null }),
      signOut: async () => ({}),
    },
    from(table) {
      const q = {
        select: async () => { calls.push(['select', table]); return { data: db[table].map(r => ({ ...r })), error: null }; },
        insert: async rows => { calls.push(['insert', table]); [].concat(rows).forEach(r => db[table].push({ ...r })); return { error: null }; },
        update: patch => ({ eq: async (k, v) => { calls.push(['update', table]); db[table].filter(r => r[k] === v).forEach(r => Object.assign(r, patch)); return { error: null }; } }),
        delete: () => ({
          eq: async (k, v) => { calls.push(['delete', table]); db[table] = db[table].filter(r => r[k] !== v); return { error: null }; },
          neq: async () => { calls.push(['delete-all', table]); db[table] = []; return { error: null }; },
        }),
      };
      return q;
    },
  };
  return client;
}

function loadStore(sb) {
  const ls = {};
  const env = {
    window: { MW_CONFIG: sb ? { SUPABASE_URL: 'https://x.supabase.co', SUPABASE_ANON_KEY: 'public-test-key' } : {}, supabase: sb ? { createClient: () => sb } : undefined },
    localStorage: { getItem: k => ls[k] ?? null, setItem: (k, v) => { ls[k] = String(v); } },
    I18N: { lang: 'bg' },
  };
  const fn = new Function(...Object.keys(env), src('algo.js') + ';' + src('store.js') + ';return Store;');
  return fn(...Object.values(env));
}

(async () => {
  await ok('cloud: init reads all 5 tables (goals → savings_goals)', async () => {
    const sb = fakeSupabase({ id: 'u1', email: 'a@b.bg' }); const S = loadStore(sb); await S.init();
    const sel = sb.calls.filter(c => c[0] === 'select').map(c => c[1]);
    assert.deepEqual(sel.sort(), ['budgets', 'categories', 'goal_contributions', 'savings_goals', 'transactions']);
  });
  await ok('cloud: first login seeds 12 default categories with user_id', async () => {
    const sb = fakeSupabase({ id: 'u1', email: 'a@b.bg' }); const S = loadStore(sb); await S.init();
    assert.equal(sb.db.categories.length, 12); assert.ok(sb.db.categories.every(c => c.user_id === 'u1'));
  });
  await ok('cloud: add transaction → INSERT in transactions with user_id', async () => {
    const sb = fakeSupabase({ id: 'u1', email: 'a@b.bg' }); const S = loadStore(sb); await S.init();
    const row = await S.add('transactions', { type: 'expense', amount: 4.5, category_id: null, note: 'Кафе', tx_date: '2026-11-20' });
    assert.equal(sb.db.transactions.length, 1); assert.equal(sb.db.transactions[0].user_id, 'u1'); assert.equal(S.data.transactions[0].id, row.id);
  });
  await ok('cloud: update goal → UPDATE on savings_goals', async () => {
    const sb = fakeSupabase({ id: 'u1', email: 'a@b.bg' }, { savings_goals: [{ id: 'g1', saved_amount: 10, user_id: 'u1' }] });
    const S = loadStore(sb); await S.init(); await S.update('goals', 'g1', { saved_amount: 60 });
    assert.equal(sb.db.savings_goals[0].saved_amount, 60); assert.ok(sb.calls.some(c => c[0] === 'update' && c[1] === 'savings_goals'));
  });
  await ok('cloud: delete transaction → DELETE in database and in memory', async () => {
    const sb = fakeSupabase({ id: 'u1', email: 'a@b.bg' }, { transactions: [{ id: 't1', user_id: 'u1', type: 'expense', amount: 1, tx_date: '2026-11-01' }] });
    const S = loadStore(sb); await S.init(); await S.remove('transactions', 't1');
    assert.equal(sb.db.transactions.length, 0); assert.equal(S.data.transactions.length, 0);
  });
  await ok('cloud: deleting a category clears category_id on its transactions', async () => {
    const sb = fakeSupabase({ id: 'u1', email: 'a@b.bg' }, { categories: [{ id: 'c1', user_id: 'u1', key: 'x', kind: 'expense', name_bg: 'x', name_en: 'x' }], transactions: [{ id: 't1', user_id: 'u1', category_id: 'c1', type: 'expense', amount: 1, tx_date: '2026-11-01' }] });
    const S = loadStore(sb); await S.init(); await S.remove('categories', 'c1');
    assert.equal(S.data.transactions[0].category_id, null);
  });
  await ok('cloud: sign up without session asks to confirm email', async () => {
    const sb = fakeSupabase(null); const S = loadStore(sb); await S.init();
    await assert.rejects(() => S.signUp('a@b.bg', '123456'), /confirm_email/);
  });
  await ok('cloud: sign in loads data and sets user', async () => {
    const sb = fakeSupabase(null); const S = loadStore(sb); await S.init(); await S.signIn('a@b.bg', '123456');
    assert.equal(S.user.email, 'a@b.bg'); assert.ok(S.data.categories.length > 0);
  });
  await ok('local: demo data is created and CRUD works without Supabase', async () => {
    const S = loadStore(null); await S.init();
    assert.equal(S.mode, 'local'); assert.ok(S.data.transactions.length > 20);
    const n = S.data.transactions.length;
    const r = await S.add('transactions', { type: 'income', amount: 10, category_id: null, note: 'x', tx_date: '2026-11-01' });
    await S.update('transactions', r.id, { amount: 12 }); assert.equal(S.data.transactions.find(t => t.id === r.id).amount, 12);
    await S.remove('transactions', r.id); assert.equal(S.data.transactions.length, n);
  });
  await ok('local: wipe keeps categories, removes transactions/budgets/goals', async () => {
    const S = loadStore(null); await S.init(); await S.wipe();
    assert.equal(S.data.transactions.length, 0); assert.equal(S.data.goals.length, 0); assert.ok(S.data.categories.length > 0);
  });
  console.log(`\n${pass} passed`);
})();
