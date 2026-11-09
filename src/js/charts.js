/* Собствени SVG диаграми (без външни библиотеки) / Hand-made SVG charts */
const Charts = (() => {
  const smooth = pts => {
    if (pts.length < 2) return '';
    let d = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      d += ` C${p1[0] + (p2[0] - p0[0]) / 6},${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6},${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]},${p2[1]}`;
    }
    return d;
  };
  const short = v => Math.abs(v) >= 1000 ? (v / 1000).toFixed(v % 1000 ? 1 : 0) + 'k' : Math.round(v);
  let uid = 0;

  function donut(items, { size = 210, thickness = 28, top = '', sub = '' } = {}) {
    const total = items.reduce((s, i) => s + i.value, 0);
    const r = (size - thickness) / 2, C = 2 * Math.PI * r, cx = size / 2;
    let acc = 0, segs = '';
    if (total <= 0) segs = `<circle cx="${cx}" cy="${cx}" r="${r}" fill="none" stroke="var(--glass2)" stroke-width="${thickness}"/>`;
    items.forEach((it, i) => {
      const len = it.value / total * C, gap = items.length > 1 ? 3 : 0;
      segs += `<circle class="dseg" cx="${cx}" cy="${cx}" r="${r}" fill="none" stroke="${it.color}" stroke-width="${thickness}" stroke-linecap="butt"
        style="--C:${C};--len:${Math.max(0, len - gap)};stroke-dasharray:${Math.max(0, len - gap)} ${C};stroke-dashoffset:${-acc};animation:dd 1.1s ${i * 0.08}s cubic-bezier(.2,.8,.2,1) both"><title>${it.label}: ${it.display || it.value}</title></circle>`;
      acc += len;
    });
    return `<style>@keyframes dd{from{stroke-dasharray:0 var(--C)}}</style>
    <svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img"><g transform="rotate(-90 ${cx} ${cx})">${segs}</g>
    <text x="${cx}" y="${cx - 2}" text-anchor="middle" fill="var(--text)" font-family="Manrope" font-weight="700" font-size="${size / 10}">${top}</text>
    <text x="${cx}" y="${cx + size / 11}" text-anchor="middle" fill="var(--muted)" font-size="${size / 17}" font-weight="700">${sub}</text></svg>`;
  }

  function area(labels, series, { w = 680, h = 250 } = {}) {
    const id = 'a' + (++uid), pl = 38, pr = 14, pt = 14, pb = 28;
    const max = Math.max(1, ...series.flatMap(s => s.values)) * 1.12;
    const X = i => pl + (labels.length < 2 ? (w - pl - pr) / 2 : i * (w - pl - pr) / (labels.length - 1));
    const Y = v => pt + (h - pt - pb) * (1 - v / max);
    let g = '', defs = '';
    for (let i = 0; i <= 4; i++) {
      const v = max * i / 4, y = Y(v);
      g += `<line x1="${pl}" x2="${w - pr}" y1="${y}" y2="${y}" stroke="var(--border)" stroke-dasharray="3 5"/><text x="${pl - 8}" y="${y + 4}" text-anchor="end" font-size="10.5" fill="var(--dim)" font-weight="700">${short(v)}</text>`;
    }
    labels.forEach((l, i) => g += `<text x="${X(i)}" y="${h - 8}" text-anchor="middle" font-size="11" fill="var(--muted)" font-weight="700">${l}</text>`);
    series.forEach((s, k) => {
      const pts = s.values.map((v, i) => [X(i), Y(v)]), line = smooth(pts);
      defs += `<linearGradient id="${id}g${k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s.color}" stop-opacity=".45"/><stop offset="1" stop-color="${s.color}" stop-opacity="0"/></linearGradient>`;
      g += `<path d="${line} L${pts[pts.length - 1][0]},${Y(0)} L${pts[0][0]},${Y(0)} Z" fill="url(#${id}g${k})" style="animation:fadeIn 1.4s both"/>
        <path d="${line}" fill="none" stroke="${s.color}" stroke-width="3.2" stroke-linecap="round" pathLength="1" stroke-dasharray="1" style="animation:draw 1.5s ${k * .2}s ease-out both"/>`;
      pts.forEach((p, i) => g += `<circle cx="${p[0]}" cy="${p[1]}" r="4.5" fill="var(--bg)" stroke="${s.color}" stroke-width="2.5"><title>${s.name}: ${s.fmt ? s.fmt(s.values[i]) : s.values[i]}</title></circle>`);
    });
    return `<style>@keyframes draw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}@keyframes fadeIn{from{opacity:0}}</style><svg viewBox="0 0 ${w} ${h}" width="100%" role="img"><defs>${defs}</defs>${g}</svg>`;
  }

  function gauge(score, color) {
    const id = 'g' + (++uid), r = 90, cx = 110, cy = 110, ang = Math.PI * (1 - score / 100);
    const kx = cx + r * Math.cos(ang), ky = cy - r * Math.sin(ang);
    return `<svg viewBox="0 0 220 135" width="100%" style="max-width:290px" role="img">
      <defs><linearGradient id="${id}" x1="0" x2="1"><stop offset="0" stop-color="#ff5c8a"/><stop offset=".5" stop-color="#ffb020"/><stop offset="1" stop-color="#00e0b8"/></linearGradient></defs>
      <path d="M${cx - r},${cy} A${r},${r} 0 0 1 ${cx + r},${cy}" fill="none" stroke="var(--glass2)" stroke-width="16" stroke-linecap="round"/>
      <path d="M${cx - r},${cy} A${r},${r} 0 0 1 ${cx + r},${cy}" fill="none" stroke="url(#${id})" stroke-width="16" stroke-linecap="round" pathLength="100" stroke-dasharray="${Math.max(.5, score)} 100" style="animation:gg 1.6s cubic-bezier(.2,.8,.2,1) both)"/>
      <circle cx="${kx}" cy="${ky}" r="9" fill="#fff" stroke="${color}" stroke-width="4" style="animation:fadeIn 1.6s both"/>
      <text x="${cx}" y="${cy - 8}" text-anchor="middle" font-family="Manrope" font-weight="800" font-size="40" fill="var(--text)" data-count="${score}" data-fmt="int">${score}</text>
      <text x="${cx}" y="${cy + 16}" text-anchor="middle" font-size="11" font-weight="800" fill="var(--muted)">/ 100</text></svg><style>@keyframes gg{from{stroke-dasharray:0 100}}</style>`;
  }

  function ring(pct, { size = 104, stroke = 11, color = '#00e0b8', label = '' } = {}) {
    const r = (size - stroke) / 2, c = size / 2, p = Math.max(0, Math.min(1, pct)), id = 'r' + (++uid);
    return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${color}"/><stop offset="1" stop-color="#7c5cff"/></linearGradient></defs>
      <circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="var(--glass2)" stroke-width="${stroke}"/>
      <circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="url(#${id})" stroke-width="${stroke}" stroke-linecap="round" transform="rotate(-90 ${c} ${c})" pathLength="100" stroke-dasharray="${p * 100} 100" style="animation:rg 1.4s cubic-bezier(.2,.8,.2,1) both"/>
      <text x="${c}" y="${c + 5}" text-anchor="middle" font-family="Manrope" font-weight="700" font-size="${size / 6}" fill="var(--text)">${label || Math.round(p * 100) + '%'}</text></svg><style>@keyframes rg{from{stroke-dasharray:0 100}}</style>`;
  }

  function spark(values, { w = 140, h = 40, color = '#00e0b8' } = {}) {
    if (values.length < 2) return '';
    const mn = Math.min(...values), mx = Math.max(...values), rng = mx - mn || 1;
    const pts = values.map((v, i) => [i * w / (values.length - 1), h - 4 - (v - mn) / rng * (h - 8)]);
    return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><path d="${smooth(pts)}" fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="round" pathLength="1" stroke-dasharray="1" style="animation:draw 1.4s both"/></svg>`;
  }
  return { donut, area, gauge, ring, spark };
})();
