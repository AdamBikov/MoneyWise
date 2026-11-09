/* UI помощници: модали, тостове, конфети, 3D наклон, брояч */
const UI = (() => {
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function toast(msg, type = 'ok') {
    const el = document.createElement('div'); el.className = 'toast ' + (type === 'err' ? 'err' : ''); el.textContent = msg;
    document.getElementById('toasts').appendChild(el);
    setTimeout(() => { el.style.transition = '.4s'; el.style.opacity = 0; el.style.transform = 'translateX(60px)'; setTimeout(() => el.remove(), 400); }, 3200);
  }

  function modal(html) {
    const root = document.getElementById('modal-root');
    const back = document.createElement('div'); back.className = 'back';
    back.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${html}</div>`;
    root.appendChild(back);
    const close = () => { back.remove(); document.removeEventListener('keydown', esc_); };
    const esc_ = e => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', esc_);
    back.addEventListener('mousedown', e => { if (e.target === back) close(); });
    back.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', close));
    const first = back.querySelector('input:not([type=radio]),select'); if (first) setTimeout(() => first.focus(), 60);
    return { el: back.firstElementChild, close };
  }

  function confirmBox(msg, okLabel, cancelLabel) {
    return new Promise(res => {
      const m = modal(`<h3>${esc(msg)}</h3><div class="actions"><button class="btn ghost" data-close>${esc(cancelLabel)}</button><button class="btn danger" id="ok">${esc(okLabel)}</button></div>`);
      m.el.querySelector('#ok').onclick = () => { m.close(); res(true); };
      m.el.parentElement.addEventListener('mousedown', e => { if (e.target === m.el.parentElement) res(false); });
      m.el.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => res(false)));
    });
  }

  function confetti() {
    const c = document.getElementById('confetti'), g = c.getContext('2d');
    c.width = innerWidth; c.height = innerHeight;
    const cols = ['#7c5cff', '#00e0b8', '#ff5c8a', '#ffc857', '#6be3ff'];
    const ps = Array.from({ length: 170 }, () => ({ x: innerWidth / 2 + (Math.random() - .5) * 200, y: innerHeight * .55, vx: (Math.random() - .5) * 16, vy: -Math.random() * 18 - 4, s: 5 + Math.random() * 7, r: Math.random() * 6, vr: (Math.random() - .5) * .4, c: cols[Math.floor(Math.random() * cols.length)] }));
    let f = 0;
    (function tick() {
      g.clearRect(0, 0, c.width, c.height);
      ps.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += .45; p.vx *= .99; p.r += p.vr; g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = p.c; g.fillRect(-p.s / 2, -p.s / 3, p.s, p.s / 1.6); g.restore(); });
      if (++f < 150) requestAnimationFrame(tick); else g.clearRect(0, 0, c.width, c.height);
    })();
  }

  /* 3D наклон на карти при посочване */
  function initTilt() {
    document.addEventListener('mousemove', e => {
      const el = e.target.closest && e.target.closest('.tilt');
      document.querySelectorAll('.tilt.active').forEach(o => { if (o !== el) { o.classList.remove('active'); o.style.transform = ''; } });
      if (!el || matchMedia('(pointer:coarse)').matches) return;
      const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      el.classList.add('active');
      el.style.transform = `perspective(900px) rotateX(${(.5 - y) * 9}deg) rotateY(${(x - .5) * 11}deg) translateZ(8px)`;
      el.style.setProperty('--gx', x * 100 + '%'); el.style.setProperty('--gy', y * 100 + '%');
    });
    document.addEventListener('mouseleave', () => document.querySelectorAll('.tilt.active').forEach(o => { o.classList.remove('active'); o.style.transform = ''; }));
  }

  /* анимирани числа */
  function countUp(root, fmt) {
    root.querySelectorAll('[data-count]').forEach(el => {
      const to = parseFloat(el.dataset.count), kind = el.dataset.fmt || 'money', t0 = performance.now(), dur = 1100;
      const show = v => el.textContent = kind === 'money' ? fmt.money(v) : kind === 'pct' ? Math.round(v) + '%' : Math.round(v);
      (function step(now) { const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3); show(to * e); if (k < 1) requestAnimationFrame(step); else show(to); })(t0);
    });
  }
  return { esc, toast, modal, confirm: confirmBox, confetti, initTilt, countUp };
})();
