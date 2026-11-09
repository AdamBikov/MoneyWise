/* MoneyWise — главно приложение: рутиране, изгледи, CRUD */
(() => {
  const t = (k, v) => I18N.t(k, v);
  const esc = UI.esc;
  const D = () => Store.data;
  const S = { route: 'dashboard', month: Algo.ym(new Date()), f: { q: '', type: 'all', cat: 'all' }, disposers: [], flip: false };
  const NAV = [['dashboard', 'home'], ['transactions', 'list'], ['budgets', 'target'], ['goals', 'flag'], ['analytics', 'chart'], ['settings', 'sliders']];
  const locale = () => I18N.lang === 'bg' ? 'bg-BG' : 'en-IE';
  const fmt = {
    money: v => new Intl.NumberFormat(locale(), { style: 'currency', currency: 'EUR', maximumFractionDigits: Math.abs(v) >= 10000 ? 0 : 2 }).format(v || 0),
    sign: v => (v > 0 ? '+' : v < 0 ? '−' : '') + fmt.money(Math.abs(v)),
    month: m => { const [y, mo] = m.split('-').map(Number); return new Intl.DateTimeFormat(locale(), { month: 'long', year: 'numeric' }).format(new Date(y, mo - 1, 1)); },
    mshort: m => { const [y, mo] = m.split('-').map(Number); return new Intl.DateTimeFormat(locale(), { month: 'short' }).format(new Date(y, mo - 1, 1)).replace('.', ''); },
    day: d => new Intl.DateTimeFormat(locale(), { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(d + 'T12:00:00')),
    date: d => d ? new Intl.DateTimeFormat(locale(), { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(d + 'T12:00:00')) : '—',
  };
  const cat = id => D().categories.find(c => c.id === id);
  const catName = c => !c ? t('uncategorized') : (I18N.lang === 'bg' ? c.name_bg || c.name_en : c.name_en || c.name_bg);
  const txTitle = x => x.note || catName(cat(x.category_id));
  const view = () => document.getElementById('view');
  const sortTx = a => [...a].sort((x, y) => y.tx_date.localeCompare(x.tx_date) || 0);
  const balance = () => D().transactions.reduce((s, x) => s + (x.type === 'income' ? 1 : -1) * +x.amount, 0);
  const isCurrent = () => S.month === Algo.ym(new Date());
  const pctDelta = (a, b) => b ? ((a - b) / b * 100) : null;
  const delta = (a, b, goodUp = true) => { const p = pctDelta(a, b); if (p === null) return ''; const good = goodUp ? p >= 0 : p <= 0; return `<span class="delta ${good ? 'up' : 'down'}">${p >= 0 ? '▲' : '▼'} ${Math.abs(p).toFixed(0)}% ${t('vs_prev')}</span>`; };

  /* ─────────────── shell ─────────────── */
  function render() {
    S.disposers.forEach(d => d.dispose()); S.disposers = [];
    document.documentElement.lang = I18N.lang; document.title = 'MoneyWise — ' + t('tagline');
    const app = document.getElementById('app');
    if (Store.mode === 'cloud' && !Store.user) return renderAuth(app);
    const navLinks = cls => NAV.map(([r, ic]) => `<a href="#/${r}" class="${S.route === r ? 'on' : ''}"><span class="ic">${I(ic)}</span><span>${t('nav_' + r)}</span></a>`).join('');
    app.innerHTML = `
      <aside class="side">
        <div class="logo"><div class="coin3d"><b>€</b></div><div>MoneyWise<small>${t('tagline')}</small></div></div>
        <nav class="nav">${navLinks()}</nav>
        <div class="spacer"></div>
        <div class="tools">
          <button class="pill ${I18N.lang === 'bg' ? 'on' : ''}" data-lang="bg">BG</button><button class="pill ${I18N.lang === 'en' ? 'on' : ''}" data-lang="en">EN</button>
          <button class="pill" id="theme" title="${t('theme')}">${document.documentElement.dataset.theme === 'dark' ? I('sun') : I('moon')}</button>
        </div>
        <div class="tools"><span class="mode ${Store.mode}">${Store.mode === 'cloud' ? I('cloud') + ' Supabase' : I('db') + ' ' + t('demo_mode')}</span></div>
      </aside>
      <div class="content">
        <header class="top">
          <h1>${t('nav_' + S.route)}</h1>
          <div class="mobtools"><button class="pill ${I18N.lang === 'bg' ? 'on' : ''}" data-lang="bg">BG</button><button class="pill ${I18N.lang === 'en' ? 'on' : ''}" data-lang="en">EN</button><button class="pill" id="theme2">${document.documentElement.dataset.theme === 'dark' ? I('sun') : I('moon')}</button></div>
          ${['dashboard', 'transactions', 'budgets'].includes(S.route) ? `<div class="monthsw"><button id="pm" aria-label="prev">‹</button><span>${fmt.month(S.month)}</span><button id="nm" aria-label="next">›</button></div>` : ''}
          <button class="btn primary" id="addtx">${I('plus')} ${t('add_tx')}</button>
        </header>
        <main id="view"></main>
      </div>
      <nav class="bottom">${navLinks()}</nav>`;
    app.querySelectorAll('[data-lang]').forEach(b => b.onclick = () => { I18N.set(b.dataset.lang); render(); });
    const th = () => { const d = document.documentElement; d.dataset.theme = d.dataset.theme === 'dark' ? 'light' : 'dark'; try { localStorage.setItem('mw.theme', d.dataset.theme); } catch (e) {} render(); };
    ['theme', 'theme2'].forEach(i => { const e = document.getElementById(i); if (e) e.onclick = th; });
    document.getElementById('addtx').onclick = () => txModal();
    const pm = document.getElementById('pm'), nm = document.getElementById('nm');
    if (pm) { pm.onclick = () => { S.month = Algo.addMonths(S.month, -1); render(); }; nm.onclick = () => { S.month = Algo.addMonths(S.month, 1); render(); }; }
    (VIEWS[S.route] || VIEWS.dashboard)();
    UI.countUp(document.getElementById('app'), fmt);
  }

  function renderAuth(app) {
    app.innerHTML = `<div class="card auth tilt"><div class="coin3d"><b>€</b></div><h1>MoneyWise</h1><p>${t('auth_sub')}</p>
      <form id="af"><label class="field"><span>Email</span><input name="email" type="email" required autocomplete="email"></label>
      <label class="field"><span>${t('password')}</span><input name="password" type="password" minlength="6" required autocomplete="current-password"></label>
      <div class="actions" style="justify-content:stretch"><button class="btn primary" style="flex:1" data-act="in">${t('sign_in')}</button><button type="button" class="btn" style="flex:1" id="su">${t('sign_up')}</button></div></form>
      <div class="tools" style="justify-content:center;margin-top:16px"><button class="pill ${I18N.lang === 'bg' ? 'on' : ''}" data-lang="bg">BG</button><button class="pill ${I18N.lang === 'en' ? 'on' : ''}" data-lang="en">EN</button></div></div>`;
    app.querySelectorAll('[data-lang]').forEach(b => b.onclick = () => { const f = new FormData(document.getElementById('af')); const em = f.get('email'); I18N.set(b.dataset.lang); render(); const e = document.querySelector('[name=email]'); if (e) e.value = em; });
    const go = async mode => {
      const f = new FormData(document.getElementById('af'));
      try { await (mode === 'up' ? Store.signUp : Store.signIn).call(Store, f.get('email'), f.get('password')); render(); }
      catch (e) { UI.toast(e.message === 'confirm_email' ? t('confirm_email') : e.message, 'err'); }
    };
    document.getElementById('af').onsubmit = e => { e.preventDefault(); go('in'); };
    document.getElementById('su').onclick = () => { if (document.getElementById('af').reportValidity()) go('up'); };
  }

  /* ─────────────── views ─────────────── */
  const VIEWS = {
    dashboard() {
      const tx = D().transactions, cats = D().categories, m = S.month, today = new Date();
      const cur = Algo.monthStats(tx, m), prev = Algo.monthStats(tx, Algo.addMonths(m, -1));
      const bal = balance(), rate = cur.income > 0 ? cur.net / cur.income * 100 : 0;
      const fc = Algo.forecast(tx, cats, today);
      const h = Algo.health({ tx, cats, budgets: D().budgets, goals: D().goals, today });
      const hcol = h.score >= 80 ? '#00e0b8' : h.score >= 60 ? '#6be3ff' : h.score >= 40 ? '#ffb020' : '#ff5c8a';
      // дарт на разходите по категории
      const slices = Object.entries(cur.byCat).map(([id, v]) => { const c = cat(id); return { label: catName(c), value: v, color: c ? c.color : '#8e97c4', display: fmt.money(v) }; }).sort((a, b) => b.value - a.value);
      // 6-месечен паричен поток
      const months = Array.from({ length: 6 }, (_, i) => Algo.addMonths(m, i - 5)), ms = months.map(x => Algo.monthStats(tx, x));
      // sparkline на баланса за 30 дни
      const sp = []; { let run = bal; const byDate = {}; tx.forEach(x => byDate[x.tx_date] = (byDate[x.tx_date] || 0) + (x.type === 'income' ? 1 : -1) * +x.amount);
        const arr = []; for (let i = 0; i < 30; i++) { const d = new Date(); d.setDate(d.getDate() - i); arr.push(run); run -= byDate[Algo.iso(d)] || 0; } sp.push(...arr.reverse()); }
      // прозрения
      const ins = [];
      if (isCurrent()) {
        ins.push(`<div class="ins ${fc.projectedNet >= 0 ? 'good' : 'bad'}"><span class="e">${I('trend')}</span><div>${t('ins_forecast', { exp: fmt.money(fc.projectedExpense), net: fmt.sign(fc.projectedNet) })}</div></div>`);
        const bud = D().budgets, spentB = Algo.sum(bud.map(b => cur.byCat[b.category_id] || 0)), limB = Algo.sum(bud.map(b => +b.limit_amount));
        if (bud.length) { const left = Math.max(0, limB - spentB) / (fc.remainingDays + 1); ins.push(`<div class="ins"><span class="e">${I('info')}</span><div>${t('ins_daily', { v: fmt.money(left) })}</div></div>`); }
      }
      Algo.budgetAlerts(cur.byCat, D().budgets, today, m).filter(r => r.status !== 'ok').sort((x, y) => y.pct - x.pct).slice(0, 3).forEach(r => {
        const c = catName(cat(r.budget.category_id));
        if (r.status === 'exceeded') ins.push(`<div class="ins bad"><span class="e">${I('alert')}</span><div>${t('ins_over', { c, v: fmt.money(r.spent - r.limit) })}</div></div>`);
        else if (r.status === 'risk') ins.push(`<div class="ins warn"><span class="e">${I('trenddown')}</span><div>${t('ins_risk', { c, d: r.exhaustDay || '—' })}</div></div>`);
        else ins.push(`<div class="ins warn"><span class="e">${I('alert')}</span><div>${t('ins_near', { c, p: Math.round(r.pct * 100) })}</div></div>`);
      });
      Algo.anomalies(tx, cats, today).slice(0, 2).forEach(a => ins.push(`<div class="ins warn"><span class="e">${I('eye')}</span><div>${t('ins_anom', { n: esc(txTitle(a.tx)), v: fmt.money(a.tx.amount), m: fmt.money(a.median) })}</div></div>`));
      if (cur.income > 0 && rate >= 20) ins.push(`<div class="ins good"><span class="e">${I('check')}</span><div>${t('ins_save', { p: Math.round(rate) })}</div></div>`);
      if (!ins.length) ins.push(`<div class="ins"><span class="e">${I('info')}</span><div>${t('ins_none')}</div></div>`);
      const recent = sortTx(tx).slice(0, 6);
      view().innerHTML = `
      <section class="hero">
        <div class="hero-left">
          <div class="bigcard ${S.flip ? 'flip' : ''}" id="bigcard" title="${t('flip_hint')}"><div class="inner">
            <div class="face"><div class="chip"></div><div style="position:absolute;right:26px;top:22px;font-weight:800;opacity:.9">MoneyWise</div>
              <div style="margin-top:14px" class="lbl">${t('total_balance')}</div><div class="amt" data-count="${bal}">${fmt.money(bal)}</div>
              <div class="row"><span>${Store.user ? esc(Store.user.email) : t('demo_user')}</span><span class="circles"><i></i><i></i></span></div></div>
            <div class="face back"><div class="lbl">${fmt.month(m)}</div>
              <div class="stat"><div>${t('income')}<b>${fmt.money(cur.income)}</b></div><div>${t('expenses')}<b>${fmt.money(cur.expense)}</b></div></div>
              <div class="stat"><div>${t('net')}<b>${fmt.sign(cur.net)}</b></div><div>${t('savings_rate')}<b>${Math.round(rate)}%</b></div></div>
              <div class="row"><span>${t('flip_back')}</span><span>${I('refresh')}</span></div></div></div></div>
          <form class="quick" id="quick"><span>${I('bolt')}</span><input id="qin" autocomplete="off" placeholder="${t('quick_ph')}"><span class="hint">${t('quick_hint')}</span><button class="btn primary sm">${t('add')}</button></form>
        </div>
        <div class="canvas-wrap"><canvas id="hero3d"></canvas><div class="cap">${t('move_mouse')}</div></div>
      </section>
      <section class="grid g4 mt perspective">
        <div class="card kpi inc tilt"><span class="glyph">${I('arrowdown')}</span><span class="lbl">${t('income')}</span><span class="val" data-count="${cur.income}">${fmt.money(cur.income)}</span>${delta(cur.income, prev.income)}</div>
        <div class="card kpi exp tilt"><span class="glyph">${I('arrowup')}</span><span class="lbl">${t('expenses')}</span><span class="val" data-count="${cur.expense}">${fmt.money(cur.expense)}</span>${delta(cur.expense, prev.expense, false)}</div>
        <div class="card kpi tilt"><span class="glyph">${I('equal')}</span><span class="lbl">${t('net')}</span><span class="val ${cur.net >= 0 ? 'up' : 'down'}">${fmt.sign(cur.net)}</span>${Charts.spark(sp, { color: cur.net >= 0 ? '#00e0b8' : '#ff5c8a' })}</div>
        <div class="card kpi tilt"><span class="glyph">${I('percent')}</span><span class="lbl">${t('savings_rate')}</span><span class="val" data-count="${Math.max(0, rate)}" data-fmt="pct">${Math.round(rate)}%</span><span class="delta" style="color:var(--muted)">${t('target20')}</span></div>
      </section>
      <section class="grid g21 mt">
        <div class="card"><h3>${I('chart')} ${t('cashflow')}<small>${t('last6')}</small></h3>${Charts.area(months.map(fmt.mshort), [{ name: t('income'), color: '#00e0b8', values: ms.map(x => x.income), fmt: fmt.money }, { name: t('expenses'), color: '#ff5c8a', values: ms.map(x => x.expense), fmt: fmt.money }])}</div>
        <div class="card"><h3>${I('pulse')} ${t('health')}<small>${t('algo')} #2</small></h3><div style="text-align:center">${Charts.gauge(h.score, hcol)}<div style="font-family:var(--head);font-weight:700;color:${hcol};margin-top:-4px">${t('grade_' + h.grade)}</div></div>
          <div class="legend" style="margin-top:14px;font-size:12px">${[['savings', 'h_savings'], ['budget', 'h_budget'], ['stability', 'h_stab'], ['goals', 'h_goals']].map(([k, l]) => `<div><i style="background:${hcol}"></i>${t(l)}<em>${Math.round(h.parts[k])}/100</em></div>`).join('')}</div></div>
      </section>
      <section class="grid g12 mt">
        <div class="card"><h3>${I('pie')} ${t('by_cat')}<small>${fmt.month(m)}</small></h3>
          ${slices.length ? `<div class="donut-wrap">${Charts.donut(slices, { top: fmt.money(cur.expense), sub: t('expenses') })}<div class="legend">${slices.slice(0, 7).map(s => `<div><i style="background:${s.color}"></i>${esc(s.label)}<em>${Math.round(s.value / cur.expense * 100)}%</em></div>`).join('')}</div></div>` : `<div class="empty"><div class="big">${I('inbox')}</div>${t('no_data')}</div>`}</div>
        <div class="grid">
          <div class="card"><h3>${I('info')} ${t('insights')}<small>${t('algo')} #1·#4</small></h3>${ins.join('')}</div>
          <div class="card"><h3>${I('clock')} ${t('recent')}<small><a href="#/transactions" style="color:var(--a2);text-decoration:none">${t('see_all')} →</a></small></h3>${recent.length ? recent.map(x => txRow(x)).join('') : `<div class="empty">${t('no_data')}</div>`}</div>
        </div>
      </section>`;
      bindTx();
      document.getElementById('bigcard').onclick = e => { S.flip = !S.flip; e.currentTarget.classList.toggle('flip', S.flip); };
      document.getElementById('quick').onsubmit = async e => {
        e.preventDefault(); const inp = document.getElementById('qin'); const p = Algo.parseQuick(inp.value, D().categories);
        if (!p) return UI.toast(t('quick_err'), 'err');
        await save(() => Store.add('transactions', { type: p.type, amount: p.amount, category_id: p.category_id, note: p.note, tx_date: p.tx_date }), t('quick_ok', { v: fmt.money(p.amount), c: catName(cat(p.category_id)) }));
      };
      S.disposers.push(Scene3D.hero(document.getElementById('hero3d')));
    },

    transactions() {
      let list = sortTx(D().transactions).filter(x => x.tx_date.startsWith(S.month));
      const all = list;
      if (S.f.type !== 'all') list = list.filter(x => x.type === S.f.type);
      if (S.f.cat !== 'all') list = list.filter(x => x.category_id === S.f.cat);
      if (S.f.q) { const q = S.f.q.toLowerCase(); list = list.filter(x => (x.note || '').toLowerCase().includes(q) || catName(cat(x.category_id)).toLowerCase().includes(q) || String(x.amount).includes(q)); }
      const inc = Algo.sum(list.filter(x => x.type === 'income').map(x => +x.amount)), exp = Algo.sum(list.filter(x => x.type === 'expense').map(x => +x.amount));
      const anomIds = new Set(Algo.anomalies(D().transactions, D().categories).map(a => a.tx.id));
      let html = '', lastDay = '';
      list.forEach(x => { if (x.tx_date !== lastDay) { lastDay = x.tx_date; const ds = list.filter(y => y.tx_date === lastDay).reduce((s, y) => s + (y.type === 'income' ? 1 : -1) * +y.amount, 0); html += `<div class="day"><span>${fmt.day(lastDay)}</span><span>${fmt.sign(ds)}</span></div>`; } html += txRow(x, anomIds.has(x.id), true); });
      view().innerHTML = `
      <div class="toolbar">
        <input class="input" id="q" placeholder="${I('search')} ${t('search')}" value="${esc(S.f.q)}">
        <select class="input" id="ft" style="max-width:150px"><option value="all">${t('all_types')}</option><option value="expense" ${S.f.type === 'expense' ? 'selected' : ''}>${t('expense')}</option><option value="income" ${S.f.type === 'income' ? 'selected' : ''}>${t('income_s')}</option></select>
        <select class="input" id="fc" style="max-width:200px"><option value="all">${t('all_cats')}</option>${D().categories.map(c => `<option value="${c.id}" ${S.f.cat === c.id ? 'selected' : ''}>${esc(catName(c))}</option>`).join('')}</select>
        <button class="btn sm" id="csv">${I('download')} CSV</button>
      </div>
      <div class="grid g3" style="margin-bottom:6px"><div class="card kpi inc"><span class="lbl">${t('income')}</span><span class="val">${fmt.money(inc)}</span></div><div class="card kpi exp"><span class="lbl">${t('expenses')}</span><span class="val">${fmt.money(exp)}</span></div><div class="card kpi"><span class="lbl">${t('count')}</span><span class="val">${list.length}<small style="font-size:13px;color:var(--muted)"> / ${all.length}</small></span></div></div>
      ${html || `<div class="empty"><div class="big">${I('receipt')}</div><p>${t('no_tx')}</p><br><button class="btn primary" id="e1">${I('plus')} ${t('add_tx')}</button></div>`}`;
      document.getElementById('q').oninput = e => { S.f.q = e.target.value; const pos = e.target.selectionStart; VIEWS.transactions(); const q = document.getElementById('q'); q.focus(); q.setSelectionRange(pos, pos); };
      document.getElementById('ft').onchange = e => { S.f.type = e.target.value; VIEWS.transactions(); };
      document.getElementById('fc').onchange = e => { S.f.cat = e.target.value; VIEWS.transactions(); };
      document.getElementById('csv').onclick = () => download('moneywise-' + S.month + '.csv', 'text/csv;charset=utf-8', '﻿' + ['date,type,amount,category,note', ...list.map(x => [x.tx_date, x.type, x.amount, '"' + catName(cat(x.category_id)) + '"', '"' + (x.note || '').replace(/"/g, '""') + '"'].join(','))].join('\n'));
      const e1 = document.getElementById('e1'); if (e1) e1.onclick = () => txModal();
      bindTx();
    },

    budgets() {
      const cur = Algo.monthStats(D().transactions, S.month), bud = D().budgets;
      const totalLim = Algo.sum(bud.map(b => +b.limit_amount)), totalSp = Algo.sum(bud.map(b => cur.byCat[b.category_id] || 0));
      const free = D().categories.filter(c => c.kind === 'expense' && !bud.find(b => b.category_id === c.id));
      const day = isCurrent() ? new Date().getDate() / Algo.daysIn(S.month) : 1;
      view().innerHTML = `
      <div class="card tilt" style="margin-bottom:18px"><h3>${I('target')} ${t('total_budget')}</h3><div style="display:flex;gap:22px;align-items:center;flex-wrap:wrap"><div style="flex:1;min-width:220px">
        <div class="meta"><span>${fmt.money(totalSp)}</span><span>${fmt.money(totalLim)}</span></div><div class="prog ${totalSp > totalLim ? 'bad' : totalSp > totalLim * .85 ? 'warn' : ''}" style="margin:8px 0"><i style="width:${Math.min(100, totalLim ? totalSp / totalLim * 100 : 0)}%"></i></div>
        <div class="explain">${totalLim - totalSp >= 0 ? t('left_of', { v: fmt.money(totalLim - totalSp) }) : t('over_by', { v: fmt.money(totalSp - totalLim) })}</div></div>
        ${Charts.ring(totalLim ? totalSp / totalLim : 0, { size: 110, color: totalSp > totalLim ? '#ff5c8a' : '#00e0b8' })}</div></div>
      <div class="grid g3 perspective">${bud.map(b => {
        const c = cat(b.category_id), sp_ = cur.byCat[b.category_id] || 0, lim = +b.limit_amount, p = sp_ / lim;
        const cls = p > 1 ? 'bad' : p > .85 ? 'warn' : '';
        return `<div class="card bcard tilt"><div class="head"><div class="ico" style="background:${c ? c.color : '#888'}33">${CI(c)}</div><div style="flex:1"><b>${esc(catName(c))}</b><small>${t('limit')}: ${fmt.money(lim)}</small></div>
          <button class="icon-btn" data-editb="${b.id}">${I('edit')}</button><button class="icon-btn" data-delb="${b.id}">${I('trash')}</button></div>
          <div class="prog ${cls}"><i style="width:${Math.min(100, p * 100)}%"></i></div>
          <div class="meta"><span>${fmt.money(sp_)} (${Math.round(p * 100)}%)</span><span>${p > 1 ? I('alert') + ' ' + t('over_by', { v: fmt.money(sp_ - lim) }) : t('left_of', { v: fmt.money(lim - sp_) })}</span></div>
          ${isCurrent() && day > .1 && sp_ / day > lim && p <= 1 ? `<div class="sug">${I('trenddown')} ${t('pace_warn', { v: fmt.money(sp_ / day) })}</div>` : ''}</div>`;
      }).join('')}
      <button class="card tilt" id="addb" style="display:grid;place-items:center;min-height:150px;border-style:dashed;color:var(--muted);font-weight:800">${I('plus')} ${t('add_budget')}</button></div>
      ${free.length ? '' : ''}`;
      document.getElementById('addb').onclick = () => budgetModal();
      view().querySelectorAll('[data-editb]').forEach(b => b.onclick = () => budgetModal(D().budgets.find(x => x.id === b.dataset.editb)));
      view().querySelectorAll('[data-delb]').forEach(b => b.onclick = async () => { if (await UI.confirm(t('confirm_del'), t('delete'), t('cancel'))) save(() => Store.remove('budgets', b.dataset.delb), t('deleted')); });
    },

    goals() {
      const tx = D().transactions, today = new Date();
      let net = 0; for (let i = 1; i <= 3; i++) net += Algo.monthStats(tx, Algo.addMonths(Algo.ym(today), -i)).net;
      const surplus = Math.max(0, net / 3);
      const alloc = Algo.allocate(D().goals, surplus, today), al = Object.fromEntries(alloc.map(a => [a.goal.id, a]));
      view().innerHTML = `
      <div class="card tilt" style="margin-bottom:18px"><h3>${I('sliders')} ${t('smart_alloc')}<small>${t('algo')} #3</small></h3>
        <div class="explain">${t('alloc_intro', { v: fmt.money(surplus) })}</div>
        <details class="how"><summary>${t('how_it_works')}</summary><div class="explain" style="margin-top:8px">${t('alloc_how')}</div></details></div>
      <div class="grid g2 perspective">${D().goals.map(g => {
        const p = +g.saved_amount / +g.target_amount, a = al[g.id], done = p >= 1;
        const eta = a && isFinite(a.eta) ? (() => { const d = new Date(); d.setMonth(d.getMonth() + Math.ceil(a.eta)); return fmt.date(Algo.iso(d)); })() : null;
        return `<div class="card tilt"><div class="goal"><div class="ringbox">${Charts.ring(p, { size: 118, stroke: 12, color: done ? '#ffc857' : '#00e0b8' })}<div style="position:absolute;inset:0;display:grid;place-items:center;opacity:.55;color:var(--muted)">${GI(g)}</div></div>
          <div class="info"><h4>${esc(g.name)}</h4>
          <div class="meta"><span>${fmt.money(g.saved_amount)} / ${fmt.money(g.target_amount)}</span><span>${t('deadline')}: ${fmt.date(g.deadline)}</span></div>
          <div class="prog"><i style="width:${Math.min(100, p * 100)}%"></i></div>
          ${done ? `<div class="sug">${I('check')} ${t('goal_done')}</div>` : a ? `<div class="sug">${a.onTrack ? I('check') : I('clock')} ${t('suggest', { v: fmt.money(a.give), n: fmt.money(a.need) })}${eta ? ' · ' + t('eta', { d: eta }) : ''}</div>` : ''}
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px">${done ? '' : `<button class="btn mint sm" data-contrib="${g.id}">${I('plus')} ${t('contribute')}</button>`}<button class="btn sm" data-editg="${g.id}">${I('edit')}</button><button class="btn sm danger" data-delg="${g.id}">${I('trash')}</button></div></div></div></div>`;
      }).join('')}
      <button class="card tilt" id="addg" style="display:grid;place-items:center;min-height:190px;border-style:dashed;color:var(--muted);font-weight:800">${I('plus')} ${t('add_goal')}</button></div>`;
      document.getElementById('addg').onclick = () => goalModal();
      view().querySelectorAll('[data-editg]').forEach(b => b.onclick = () => goalModal(D().goals.find(x => x.id === b.dataset.editg)));
      view().querySelectorAll('[data-contrib]').forEach(b => b.onclick = () => contribModal(D().goals.find(x => x.id === b.dataset.contrib)));
      view().querySelectorAll('[data-delg]').forEach(b => b.onclick = async () => { if (await UI.confirm(t('confirm_del'), t('delete'), t('cancel'))) save(() => Store.remove('goals', b.dataset.delg), t('deleted')); });
    },

    analytics() {
      const tx = D().transactions, cats = D().categories, m = Algo.ym(new Date());
      const months = Array.from({ length: 6 }, (_, i) => Algo.addMonths(m, i - 5));
      const totals = {}; tx.filter(x => x.type === 'expense' && months.includes(x.tx_date.slice(0, 7))).forEach(x => totals[x.category_id] = (totals[x.category_id] || 0) + +x.amount);
      const top = Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id]) => cat(id)).filter(Boolean);
      const vals = months.map(mm => top.map(c => Algo.monthStats(tx, mm).byCat[c.id] || 0));
      // тренд на баланса (кумулативно) по месеци
      let run = 0; const first = tx.length ? tx.map(x => x.tx_date.slice(0, 7)).sort()[0] : m;
      const allm = []; for (let k = first; k <= m; k = Algo.addMonths(k, 1)) allm.push(k);
      const worth = allm.map(k => { run += Algo.monthStats(tx, k).net; return run; });
      // календар-топлина за избрания месец
      const mm = S.month, dim = Algo.daysIn(mm), [yy, mo] = mm.split('-').map(Number), startDow = (new Date(yy, mo - 1, 1).getDay() + 6) % 7;
      const perDay = {}; tx.filter(x => x.type === 'expense' && x.tx_date.startsWith(mm)).forEach(x => perDay[+x.tx_date.slice(8)] = (perDay[+x.tx_date.slice(8)] || 0) + +x.amount);
      const vs = Object.values(perDay), mx = Math.max(1, Algo.median(vs) * 3, 1);
      const wd = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((_, i) => new Intl.DateTimeFormat(locale(), { weekday: 'short' }).format(new Date(2024, 0, 1 + i)));
      let heat = wd.map(w => `<div class="w">${w}</div>`).join('') + '<div></div>'.repeat(startDow);
      for (let d = 1; d <= dim; d++) { const v = perDay[d] || 0, k = Math.min(1, v / mx); heat += `<div class="h" title="${d}: ${fmt.money(v)}" style="background:${v ? `rgba(255,92,138,${.15 + k * .75})` : ''};${k > .7 ? 'color:#fff' : ''}">${d}</div>`; }
      // по дни от седмицата
      const wsum = Array(7).fill(0); tx.filter(x => x.type === 'expense').forEach(x => wsum[(new Date(x.tx_date + 'T12:00:00').getDay() + 6) % 7] += +x.amount);
      const wmax = Math.max(1, ...wsum), wtop = wsum.indexOf(Math.max(...wsum));
      // топ търговци
      const merch = {}; tx.filter(x => x.type === 'expense' && x.note).forEach(x => merch[x.note] = (merch[x.note] || 0) + +x.amount);
      const topM = Object.entries(merch).sort((a, b) => b[1] - a[1]).slice(0, 6);
      const fc = Algo.forecast(tx, cats, new Date());
      view().innerHTML = `
      <div class="card"><h3>${I('cube')} ${t('chart3d')}<small>${t('drag_rotate')}</small></h3>
        <div class="canvas-wrap" style="min-height:380px;background:none;border:0"><canvas id="bars3d" style="cursor:grab"></canvas><div class="tip" id="tip3d"></div></div>
        <div class="legend" style="flex-direction:row;flex-wrap:wrap;gap:16px;margin-top:10px">${top.map(c => `<div><i style="background:${c.color}"></i>${esc(catName(c))}</div>`).join('')}</div></div>
      <div class="grid g2 mt">
        <div class="card"><h3>${I('trend')} ${t('net_worth')}<small>${t('cumulative')}</small></h3>${allm.length > 1 ? Charts.area(allm.map(fmt.mshort), [{ name: t('net_worth'), color: '#7c5cff', values: worth, fmt: fmt.money }]) : ''}</div>
        <div class="card"><h3>${I('trend')} ${t('forecast')}<small>${t('algo')} #1</small></h3>
          <div class="grid g2"><div class="kpi"><span class="lbl">${t('proj_exp')}</span><span class="val exp" style="color:var(--exp)">${fmt.money(fc.projectedExpense)}</span></div><div class="kpi"><span class="lbl">${t('proj_net')}</span><span class="val" style="color:${fc.projectedNet >= 0 ? 'var(--inc)' : 'var(--exp)'}">${fmt.sign(fc.projectedNet)}</span></div>
          <div class="kpi"><span class="lbl">${t('daily_rate')}</span><span class="val">${fmt.money(fc.rate)}</span></div><div class="kpi"><span class="lbl">${t('days_left')}</span><span class="val">${fc.remainingDays}</span></div></div>
          <details class="how"><summary>${t('how_it_works')}</summary><div class="explain" style="margin-top:8px">${t('fc_how')}</div></details></div>
      </div>
      <div class="grid g3 mt">
        <div class="card"><h3>${I('calendar')} ${t('heatmap')}<small>${fmt.month(mm)}</small></h3><div class="heat perspective">${heat}</div></div>
        <div class="card"><h3>${I('calendar')} ${t('by_weekday')}</h3><div class="wk">${wsum.map((v, i) => `<div title="${fmt.money(v)}"><i class="${i === wtop ? 'max' : ''}" style="height:${Math.max(3, v / wmax * 100)}%"></i>${wd[i]}</div>`).join('')}</div></div>
        <div class="card"><h3>${I('store')} ${t('top_merch')}</h3><table class="t">${topM.map(([n, v]) => `<tr><td>${esc(n)}</td><td>${fmt.money(v)}</td></tr>`).join('') || `<tr><td>${t('no_data')}</td></tr>`}</table></div>
      </div>`;
      S.disposers.push(Scene3D.bars(document.getElementById('bars3d'), document.getElementById('tip3d'), { months: months.map(fmt.mshort), cats: top.map(c => ({ color: c.color, name: catName(c) })), values: vals, fmt: fmt.money }));
    },

    settings() {
      const cs = D().categories;
      view().innerHTML = `
      <div class="grid g2">
        <div class="card"><h3>${I('globe')} ${t('language')}</h3><div style="display:flex;gap:10px"><button class="btn ${I18N.lang === 'bg' ? 'primary' : ''}" data-lang="bg">Български</button><button class="btn ${I18N.lang === 'en' ? 'primary' : ''}" data-lang="en">English</button></div>
          <p class="explain" style="margin-top:12px">${t('lang_note')}</p></div>
        <div class="card"><h3>${I('db')} ${t('data_source')}</h3><p><span class="mode ${Store.mode}">${Store.mode === 'cloud' ? I('cloud') + ' Supabase' : I('db') + ' ' + t('demo_mode')}</span></p>
          <p class="explain" style="margin-top:12px">${Store.mode === 'cloud' ? t('cloud_note', { e: esc(Store.user.email) }) : t('local_note')}</p>
          ${Store.mode === 'cloud' ? `<br><button class="btn danger sm" id="so">${t('sign_out')}</button>` : ''}</div>
        <div class="card"><h3>${I('db')} ${t('backup')}</h3><div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn sm" id="exj">${I('download')} JSON</button><label class="btn sm" for="imj">${I('upload')} ${t('import')}</label><input type="file" id="imj" accept=".json" hidden></div></div>
        <div class="card"><h3>${I('db')} ${t('demo_data')}</h3><div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn sm mint" id="demo">${t('load_demo')}</button><button class="btn sm danger" id="wipe">${t('wipe')}</button></div></div>
      </div>
      <div class="card mt"><h3>${I('tag')} ${t('categories')}<button class="btn sm primary" id="addc" style="margin-left:auto">${I('plus')} ${t('add')}</button></h3>
        <div class="grid g3">${cs.map(c => `<div class="tx" style="margin:0"><div class="ico" style="background:${c.color}33">${c.icon}</div><div class="mid"><b>${esc(catName(c))}</b><small>${c.kind === 'income' ? t('income_s') : t('expense')}</small></div><div class="acts" style="opacity:1"><button class="icon-btn" data-delc="${c.id}">${I('trash')}</button></div></div>`).join('')}</div></div>`;
      view().querySelectorAll('[data-lang]').forEach(b => b.onclick = () => { I18N.set(b.dataset.lang); render(); });
      const so = document.getElementById('so'); if (so) so.onclick = async () => { await Store.signOut(); render(); };
      document.getElementById('exj').onclick = () => download('moneywise-backup.json', 'application/json', Store.exportJSON());
      document.getElementById('imj').onchange = async e => { const f = e.target.files[0]; if (!f) return; try { await Store.importJSON(await f.text()); UI.toast(t('imported')); render(); } catch (er) { UI.toast(t('import_err'), 'err'); } };
      document.getElementById('demo').onclick = async () => { if (await UI.confirm(t('confirm_demo'), t('load_demo'), t('cancel'))) save(() => Store.loadDemo(I18N.lang), t('demo_loaded')); };
      document.getElementById('wipe').onclick = async () => { if (await UI.confirm(t('confirm_wipe'), t('wipe'), t('cancel'))) save(() => Store.wipe(), t('wiped')); };
      document.getElementById('addc').onclick = () => catModal();
      view().querySelectorAll('[data-delc]').forEach(b => b.onclick = async () => { if (await UI.confirm(t('confirm_del'), t('delete'), t('cancel'))) save(() => Store.remove('categories', b.dataset.delc), t('deleted')); });
    },
  };

  /* ─────────────── общи елементи ─────────────── */
  function txRow(x, anom = false, actions = false) {
    const c = cat(x.category_id), inc = x.type === 'income';
    return `<div class="tx"><div class="ico" style="background:${c ? c.color : '#888'}2e">${CI(c)}</div>
      <div class="mid"><b>${esc(txTitle(x))}${anom ? `<span class="badge">${t('unusual')}</span>` : ''}</b><small>${esc(catName(c))} · ${fmt.date(x.tx_date)}</small></div>
      <div class="sum" style="color:var(--${inc ? 'inc' : 'exp'})">${inc ? '+' : '−'}${fmt.money(+x.amount)}</div>
      <div class="acts"><button class="icon-btn" data-edit="${x.id}" aria-label="edit">${I('edit')}</button><button class="icon-btn" data-del="${x.id}" aria-label="delete">${I('trash')}</button></div></div>`;
  }
  function bindTx() {
    view().querySelectorAll('[data-edit]').forEach(b => b.onclick = () => txModal(D().transactions.find(x => x.id === b.dataset.edit)));
    view().querySelectorAll('[data-del]').forEach(b => b.onclick = async () => { if (await UI.confirm(t('confirm_del'), t('delete'), t('cancel'))) save(() => Store.remove('transactions', b.dataset.del), t('deleted')); });
  }
  async function save(fn, okMsg) {
    try { await fn(); if (okMsg) UI.toast(okMsg); render(); }
    catch (e) { console.error(e); UI.toast((e && e.message) || t('error'), 'err'); }
  }
  function download(name, mime, text) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: mime })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); }

  /* ─────────────── модали ─────────────── */
  function txModal(tx) {
    const v = tx || { type: 'expense', amount: '', category_id: '', note: '', tx_date: Algo.iso(new Date()) };
    const m = UI.modal(`<h3>${tx ? t('edit_tx') : t('add_tx')}</h3><form id="f">
      <div class="seg"><label><input type="radio" name="type" value="expense" ${v.type === 'expense' ? 'checked' : ''}><span>${t('expense')}</span></label><label><input type="radio" name="type" value="income" ${v.type === 'income' ? 'checked' : ''}><span>${t('income_s')}</span></label></div>
      <label class="field"><span>${t('amount')} (€)</span><input name="amount" type="number" step="0.01" min="0.01" inputmode="decimal" required value="${v.amount}"></label>
      <label class="field"><span>${t('category')}</span><select name="category_id"></select></label>
      <label class="field"><span>${t('date')}</span><input name="tx_date" type="date" required value="${v.tx_date}"></label>
      <label class="field"><span>${t('note')}</span><input name="note" maxlength="80" value="${esc(v.note)}" placeholder="${t('note_ph')}"></label>
      <div class="actions"><button type="button" class="btn ghost" data-close>${t('cancel')}</button><button class="btn primary">${t('save')}</button></div></form>`);
    const f = m.el.querySelector('#f'), sel = f.category_id;
    const fill = () => { const type = f.type.value; sel.innerHTML = D().categories.filter(c => c.kind === type).map(c => `<option value="${c.id}" ${c.id === v.category_id ? 'selected' : ''}>${esc(catName(c))}</option>`).join(''); };
    fill(); f.querySelectorAll('[name=type]').forEach(r => r.onchange = () => { v.category_id = ''; fill(); });
    f.onsubmit = async e => {
      e.preventDefault(); const amount = parseFloat(f.amount.value);
      if (!(amount > 0)) return UI.toast(t('err_amount'), 'err');
      const row = { type: f.type.value, amount, category_id: sel.value || null, note: f.note.value.trim(), tx_date: f.tx_date.value };
      m.close(); save(() => tx ? Store.update('transactions', tx.id, row) : Store.add('transactions', row), t('saved'));
    };
  }
  function budgetModal(b) {
    const used = new Set(D().budgets.map(x => x.category_id));
    const opts = D().categories.filter(c => c.kind === 'expense' && (!used.has(c.id) || (b && b.category_id === c.id)));
    if (!opts.length) return UI.toast(t('no_free_cat'), 'err');
    const m = UI.modal(`<h3>${b ? t('edit_budget') : t('add_budget')}</h3><form id="f"><label class="field"><span>${t('category')}</span><select name="c" ${b ? 'disabled' : ''}>${opts.map(c => `<option value="${c.id}" ${b && b.category_id === c.id ? 'selected' : ''}>${esc(catName(c))}</option>`).join('')}</select></label>
      <label class="field"><span>${t('limit')} (€ / ${t('month')})</span><input name="l" type="number" step="1" min="1" required value="${b ? b.limit_amount : ''}"></label>
      <div class="actions"><button type="button" class="btn ghost" data-close>${t('cancel')}</button><button class="btn primary">${t('save')}</button></div></form>`);
    const f = m.el.querySelector('#f');
    f.onsubmit = e => { e.preventDefault(); const l = parseFloat(f.l.value); if (!(l > 0)) return; m.close(); save(() => b ? Store.update('budgets', b.id, { limit_amount: l }) : Store.add('budgets', { category_id: f.c.value, limit_amount: l }), t('saved')); };
  }
  function goalModal(g) {
        const v = g || { name: '', icon: 'flag', target_amount: '', saved_amount: 0, deadline: Algo.iso(new Date(new Date().getFullYear(), new Date().getMonth() + 6, 15)), priority: 2 };
    const m = UI.modal(`<h3>${g ? t('edit_goal') : t('add_goal')}</h3><form id="f">
      <label class="field"><span>${t('name')}</span><input name="name" required maxlength="40" value="${esc(v.name)}"></label>
      <div class="field"><span>${t('icon')}</span><div class="iconpick">${GOAL_PICK.map(i => `<label><input type="radio" name="icon" value="${i}" ${(ICONS[v.icon] ? v.icon : 'flag') === i ? 'checked' : ''}><span>${I(i)}</span></label>`).join('')}</div></div>
      <div class="grid g2" style="gap:12px"><label class="field"><span>${t('target')} (€)</span><input name="target" type="number" min="1" step="1" required value="${v.target_amount}"></label><label class="field"><span>${t('saved')} (€)</span><input name="saved" type="number" min="0" step="0.01" value="${v.saved_amount}"></label></div>
      <div class="grid g2" style="gap:12px"><label class="field"><span>${t('deadline')}</span><input name="deadline" type="date" required value="${v.deadline}"></label><label class="field"><span>${t('priority')}</span><select name="priority"><option value="1" ${v.priority == 1 ? 'selected' : ''}>${t('p_low')}</option><option value="2" ${v.priority == 2 ? 'selected' : ''}>${t('p_mid')}</option><option value="3" ${v.priority == 3 ? 'selected' : ''}>${t('p_high')}</option></select></label></div>
      <div class="actions"><button type="button" class="btn ghost" data-close>${t('cancel')}</button><button class="btn primary">${t('save')}</button></div></form>`);
    const f = m.el.querySelector('#f');
    f.onsubmit = e => { e.preventDefault(); const row = { name: f.name.value.trim(), icon: f.icon.value, target_amount: parseFloat(f.target.value), saved_amount: parseFloat(f.saved.value) || 0, deadline: f.deadline.value, priority: +f.priority.value }; if (!(row.target_amount > 0)) return; m.close(); save(() => g ? Store.update('goals', g.id, row) : Store.add('goals', row), t('saved')); };
  }
  function contribModal(g) {
    const rem = Math.max(0, g.target_amount - g.saved_amount);
    const m = UI.modal(`<h3>${esc(g.name)}</h3><form id="f"><label class="field"><span>${t('amount')} (€)</span><input name="a" type="number" step="0.01" min="0.01" required value="${Math.min(rem, 50)}"></label>
      <p class="explain" style="margin-bottom:14px">${t('remaining')}: ${fmt.money(rem)}</p><div class="actions"><button type="button" class="btn ghost" data-close>${t('cancel')}</button><button class="btn mint">${t('contribute')}</button></div></form>`);
    const f = m.el.querySelector('#f');
    f.onsubmit = e => {
      e.preventDefault(); const a = parseFloat(f.a.value); if (!(a > 0)) return; m.close();
      const wasDone = g.saved_amount >= g.target_amount, now = Math.round((+g.saved_amount + a) * 100) / 100;
      save(async () => { await Store.add('goal_contributions', { goal_id: g.id, amount: a, contributed_at: Algo.iso(new Date()) }); await Store.update('goals', g.id, { saved_amount: now }); if (!wasDone && now >= g.target_amount) { setTimeout(UI.confetti, 150); } }, t('saved'));
    };
  }
  function catModal() {
    const cols = ['#00e0b8', '#7c5cff', '#ff5c8a', '#ffc857', '#4ea1ff', '#ff8a3d', '#e06bff', '#6be3ff'];
    const m = UI.modal(`<h3>${t('add_cat')}</h3><form id="f"><div class="seg"><label><input type="radio" name="k" value="expense" checked><span>${t('expense')}</span></label><label><input type="radio" name="k" value="income"><span>${t('income_s')}</span></label></div>
      <label class="field"><span>${t('name')}</span><input name="n" required maxlength="30"></label><div class="field"><span>${t('icon')}</span><div class="iconpick">${CAT_PICK.map((i, k) => `<label><input type="radio" name="i" value="${i}" ${k === 0 ? 'checked' : ''}><span>${I(i)}</span></label>`).join('')}</div></div>
      <label class="field"><span>${t('color')}</span><select name="c">${cols.map(c => `<option value="${c}" style="background:${c};color:#000">${c}</option>`).join('')}</select></label>
      <div class="actions"><button type="button" class="btn ghost" data-close>${t('cancel')}</button><button class="btn primary">${t('save')}</button></div></form>`);
    const f = m.el.querySelector('#f');
    f.onsubmit = e => { e.preventDefault(); const n = f.n.value.trim(); m.close(); save(() => Store.add('categories', { key: 'custom', kind: f.k.value, icon: f.i.value || 'tag', color: f.c.value, name_bg: n, name_en: n, keywords: n.toLowerCase() }), t('saved')); };
  }

  /* ─────────────── старт ─────────────── */
  function route() { const r = (location.hash.replace('#/', '') || 'dashboard'); S.route = VIEWS[r] ? r : 'dashboard'; render(); window.scrollTo(0, 0); }
  async function boot() {
    try { const th = localStorage.getItem('mw.theme'); if (th) document.documentElement.dataset.theme = th; } catch (e) {}
    I18N.init(); UI.initTilt();
    try { await Store.init(); } catch (e) { console.error(e); UI.toast(e.message, 'err'); }
    window.addEventListener('hashchange', route);
    document.addEventListener('keydown', e => { if (e.key.toLowerCase() === 'n' && !/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName) && !document.querySelector('.modal') && (Store.mode === 'local' || Store.user)) { e.preventDefault(); txModal(); } });
    route();
  }
  boot();
})();
