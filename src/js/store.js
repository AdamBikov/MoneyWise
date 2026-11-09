/* Слой за данни: Supabase (облак) или localStorage (демо). Един и същ интерфейс. */
const Store = (() => {
  const TABLES = ['categories', 'transactions', 'budgets', 'goals', 'goal_contributions'];
  const KEY = 'moneywise.v2';
  const tbl = t => (t === 'goals' ? 'savings_goals' : t);   // вътрешно име 'goals' → таблица savings_goals
  const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); }));

  const DEFAULT_CATS = [
    { key: 'food', kind: 'expense', icon: 'cart', color: '#00e0b8', name_bg: 'Храна', name_en: 'Groceries', keywords: 'lidl,billa,kaufland,магазин,супермаркет,grocer,market,fantastico,хляб,мляко' },
    { key: 'eatout', kind: 'expense', icon: 'utensils', color: '#ff8a3d', name_bg: 'Заведения', name_en: 'Eating out', keywords: 'кафе,кафене,кафета,пица,бургер,ресторант,restaurant,coffee,cafe,pizza,burger,bar,бира,доставка,glovo,takeaway' },
    { key: 'transport', kind: 'expense', icon: 'bus', color: '#4ea1ff', name_bg: 'Транспорт', name_en: 'Transport', keywords: 'бензин,гориво,автобус,метро,такси,uber,bolt,fuel,gas,shell,bus,taxi,паркинг,parking,билет' },
    { key: 'housing', kind: 'expense', icon: 'home', color: '#7c5cff', name_bg: 'Жилище и сметки', name_en: 'Housing & bills', keywords: 'наем,ток,вода,парно,интернет,rent,electric,water,internet,bills,сметка,сметки' },
    { key: 'fun', kind: 'expense', icon: 'play', color: '#ff5c8a', name_bg: 'Забавления', name_en: 'Entertainment', keywords: 'кино,игра,netflix,spotify,cinema,movie,game,steam,концерт,concert,playstation,hbo' },
    { key: 'health', kind: 'expense', icon: 'heart', color: '#ff6b6b', name_bg: 'Здраве', name_en: 'Health', keywords: 'аптека,лекар,зъболекар,pharmacy,doctor,dentist,витамини,фитнес,gym' },
    { key: 'shopping', kind: 'expense', icon: 'bag', color: '#e06bff', name_bg: 'Пазаруване', name_en: 'Shopping', keywords: 'дрехи,обувки,amazon,zara,clothes,shoes,shopping,техника,слушалки,electronics' },
    { key: 'education', kind: 'expense', icon: 'book', color: '#ffc857', name_bg: 'Образование', name_en: 'Education', keywords: 'книга,курс,учебник,book,course,udemy,school,университет,такса' },
    { key: 'other', kind: 'expense', icon: 'dots', color: '#8e97c4', name_bg: 'Други', name_en: 'Other', keywords: 'друго,other' },
    { key: 'salary', kind: 'income', icon: 'briefcase', color: '#00e0b8', name_bg: 'Заплата', name_en: 'Salary', keywords: 'заплата,работа,salary,wage,payroll' },
    { key: 'freelance', kind: 'income', icon: 'laptop', color: '#6be3ff', name_bg: 'Фрийланс', name_en: 'Freelance', keywords: 'фрийланс,проект,freelance,project,клиент,client' },
    { key: 'gift', kind: 'income', icon: 'gift', color: '#ffc857', name_bg: 'Подаръци', name_en: 'Gifts', keywords: 'подарък,gift,бонус,bonus,джоб' },
  ];

  function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  function demoData(lang) {
    const rnd = mulberry(2026), pick = a => a[Math.floor(rnd() * a.length)], between = (a, b) => Math.round((a + rnd() * (b - a)) * 100) / 100;
    const cats = DEFAULT_CATS.map(c => ({ id: uuid(), ...c }));
    const by = k => cats.find(c => c.key === k).id;
    const tx = [], now = new Date();
    const add = (base, day, type, key, amount, note) => {
      const lastDay = base.getMonth() === now.getMonth() && base.getFullYear() === now.getFullYear() ? now.getDate() : 31;
      const dim = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
      if (day > Math.min(lastDay, dim)) return;
      tx.push({ id: uuid(), type, category_id: by(key), amount, note, tx_date: Algo.iso(new Date(base.getFullYear(), base.getMonth(), day)) });
    };
    for (let mo = 3; mo >= 0; mo--) {
      const b = new Date(now.getFullYear(), now.getMonth() - mo, 1);
      add(b, 1, 'income', 'salary', 1850, '');
      if (mo !== 2) add(b, 12 + (mo % 3), 'income', 'freelance', between(180, 420), pick(['Logo', 'Website', 'Translation']));
      if (mo === 1) add(b, 20, 'income', 'gift', 100, '');
      add(b, 3, 'expense', 'housing', 450, pick(['Rent', 'Rent']));
      add(b, 5, 'expense', 'housing', between(70, 110), 'Electricity');
      add(b, 8, 'expense', 'housing', 19.9, 'Internet');
      add(b, 10, 'expense', 'fun', 9.99, 'Netflix'); add(b, 11, 'expense', 'fun', 4.99, 'Spotify');
      add(b, 2, 'expense', 'transport', 28, 'Bus card');
      for (let d = 2; d <= 30; d += 3) add(b, d + (rnd() > .5 ? 1 : 0), 'expense', 'food', between(14, 68), pick(['Lidl', 'Billa', 'Kaufland', 'Fantastico']));
      for (let i = 0; i < 9; i++) add(b, 1 + Math.floor(rnd() * 29), 'expense', 'eatout', between(5, 28), pick(['Coffee', 'Pizza', 'Burger', 'Dinner', 'Lunch']));
      for (let i = 0; i < 3; i++) add(b, 4 + i * 9 + Math.floor(rnd() * 3), 'expense', 'transport', between(32, 55), pick(['Shell', 'OMV', 'Lukoil']));
      add(b, 7, 'expense', 'transport', between(6, 14), 'Uber');
      for (let i = 0; i < 2; i++) add(b, 6 + Math.floor(rnd() * 20), 'expense', 'fun', between(10, 38), pick(['Cinema', 'Steam', 'Concert']));
      add(b, 15 + Math.floor(rnd() * 8), 'expense', 'health', between(12, 55), pick(['Pharmacy', 'Dentist', 'Gym']));
      for (let i = 0; i < 2; i++) add(b, 5 + Math.floor(rnd() * 22), 'expense', 'shopping', between(18, 62), pick(['Zara', 'H&M', 'Shoes']));
      if (mo === 3 || mo === 0) add(b, 9, 'expense', 'education', between(25, 60), pick(['Book', 'Udemy course']));
      if (mo === 1) add(b, 18, 'expense', 'shopping', 389, 'Amazon · Headphones');
      if (mo === 0) add(b, Math.max(1, now.getDate() - 2), 'expense', 'eatout', 142, 'Restaurant');
    }
    const budgets = [['food', 340], ['eatout', 130], ['transport', 150], ['fun', 60], ['shopping', 150], ['health', 70], ['housing', 620]].map(([k, l]) => ({ id: uuid(), category_id: by(k), limit_amount: l }));
    const dl = k => Algo.iso(new Date(now.getFullYear(), now.getMonth() + k, 15));
    const bg = lang === 'bg';
    const goals = [
      { id: uuid(), name: bg ? 'Почивка в Гърция' : 'Greece holiday', icon: 'plane', target_amount: 1200, saved_amount: 640, deadline: dl(4), priority: 2 },
      { id: uuid(), name: bg ? 'Нов лаптоп' : 'New laptop', icon: 'laptop', target_amount: 1500, saved_amount: 420, deadline: dl(9), priority: 3 },
      { id: uuid(), name: bg ? 'Авариен фонд' : 'Emergency fund', icon: 'shield', target_amount: 3000, saved_amount: 900, deadline: dl(16), priority: 1 },
    ];
    const contribs = [];
    goals.forEach(g => { const parts = [0.45, 0.35, 0.2]; parts.forEach((p, i) => contribs.push({ id: uuid(), goal_id: g.id, amount: Math.round(g.saved_amount * p), contributed_at: Algo.iso(new Date(now.getFullYear(), now.getMonth() - i - 1, 20)) })); });
    return { categories: cats, transactions: tx, budgets, goals, goal_contributions: contribs };
  }

  const S = {
    mode: 'local', sb: null, user: null, data: Object.fromEntries(TABLES.map(t => [t, []])),
    uuid, DEFAULT_CATS,

    async init() {
      const c = window.MW_CONFIG || {};
      if (c.SUPABASE_URL && c.SUPABASE_ANON_KEY && window.supabase) {
        this.mode = 'cloud';
        this.sb = window.supabase.createClient(c.SUPABASE_URL, c.SUPABASE_ANON_KEY);
        const { data } = await this.sb.auth.getSession();
        this.user = data.session ? data.session.user : null;
        if (this.user) await this.loadAll();
      } else {
        this.mode = 'local';
        try { const raw = localStorage.getItem(KEY); if (raw) this.data = { ...this.data, ...JSON.parse(raw) }; } catch (e) {}
        if (!this.data.categories.length) { this.data = demoData(I18N.lang); this.persist(); }
      }
    },
    persist() { if (this.mode === 'local') try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch (e) {} },
    async loadAll() {
      for (const t of TABLES) {
        const { data, error } = await this.sb.from(tbl(t)).select('*');
        if (error) throw error;
        this.data[t] = data || [];
      }
      if (!this.data.categories.length) {
        const rows = DEFAULT_CATS.map(c => ({ id: uuid(), user_id: this.user.id, ...c }));
        const { error } = await this.sb.from('categories').insert(rows); if (error) throw error;
        this.data.categories = rows;
      }
    },
    async signIn(email, password) { const { data, error } = await this.sb.auth.signInWithPassword({ email, password }); if (error) throw error; this.user = data.user; await this.loadAll(); },
    async signUp(email, password) {
      const { data, error } = await this.sb.auth.signUp({ email, password }); if (error) throw error;
      if (!data.session) throw new Error('confirm_email');
      this.user = data.user; await this.loadAll();
    },
    async signOut() { if (this.sb) await this.sb.auth.signOut(); this.user = null; this.data = Object.fromEntries(TABLES.map(t => [t, []])); },

    /* CRUD */
    async add(table, row) {
      row = { id: uuid(), ...row };
      if (this.mode === 'cloud') { const r = { ...row, user_id: this.user.id }; const { error } = await this.sb.from(tbl(table)).insert(r); if (error) throw error; row = r; }
      this.data[table].push(row); this.persist(); return row;
    },
    async update(table, id, patch) {
      if (this.mode === 'cloud') { const { error } = await this.sb.from(tbl(table)).update(patch).eq('id', id); if (error) throw error; }
      const row = this.data[table].find(r => r.id === id); Object.assign(row, patch); this.persist(); return row;
    },
    async remove(table, id) {
      if (this.mode === 'cloud') { const { error } = await this.sb.from(tbl(table)).delete().eq('id', id); if (error) throw error; }
      this.data[table] = this.data[table].filter(r => r.id !== id);
      if (table === 'categories') { this.data.transactions.forEach(x => { if (x.category_id === id) x.category_id = null; }); this.data.budgets = this.data.budgets.filter(b => b.category_id !== id); }
      if (table === 'goals') this.data.goal_contributions = this.data.goal_contributions.filter(c => c.goal_id !== id);
      this.persist();
    },
    async wipe(keepCategories = true) {
      if (this.mode === 'cloud') for (const t of ['goal_contributions', 'goals', 'budgets', 'transactions']) { const { error } = await this.sb.from(tbl(t)).delete().neq('id', '00000000-0000-0000-0000-000000000000'); if (error) throw error; }
      this.data.transactions = []; this.data.budgets = []; this.data.goals = []; this.data.goal_contributions = [];
      this.persist();
    },
    async loadDemo(lang) {
      const d = demoData(lang);
      if (this.mode === 'cloud') {
        await this.wipe();
        const map = {}; // категориите вече съществуват → пренасочваме по key
        d.categories.forEach(c => { const ex = this.data.categories.find(e => e.key === c.key); map[c.id] = ex ? ex.id : c.id; });
        d.transactions.forEach(x => x.category_id = map[x.category_id]); d.budgets.forEach(b => b.category_id = map[b.category_id]);
        const own = r => ({ ...r, user_id: this.user.id });
        for (const [t, rows] of [['transactions', d.transactions], ['budgets', d.budgets], ['goals', d.goals], ['goal_contributions', d.goal_contributions]]) {
          const { error } = await this.sb.from(tbl(t)).insert(rows.map(own)); if (error) throw error;
          this.data[t] = rows.map(own);
        }
      } else { this.data = d; this.persist(); }
    },
    exportJSON() { return JSON.stringify({ app: 'MoneyWise', version: 2, exported: new Date().toISOString(), data: this.data }, null, 2); },
    async importJSON(text) {
      const j = JSON.parse(text); if (!j.data || !Array.isArray(j.data.transactions)) throw new Error('bad');
      if (this.mode === 'cloud') throw new Error('cloud_import');
      this.data = { ...Object.fromEntries(TABLES.map(t => [t, []])), ...j.data }; this.persist();
    },
  };
  return S;
})();
