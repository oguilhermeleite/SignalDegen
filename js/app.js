// =====================================================
// SignalDegen — App (radar, analisador, favoritos, alertas)
// =====================================================

import { loadAllPools, loadPoolDetail, loadPriceHistory, isStable, num } from './sources.js';
import {
  classify, scorePool, riskLevel, RULES, detectStrategy, rangeWidths, buildRanges, timeInRange, pricePosition,
} from './classify.js';
import { DICT } from './i18n.js';

// ---------- estado ----------
const state = {
  lang: 'pt',
  tab: 'hot',
  data: null, // { pools, status, updatedAt }
  groups: { hot: [], moderate: [] },
  analysis: null,
  chart: null,
};
const REFRESH_MS = 5 * 60 * 1000;

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// ---------- storage seguro ----------
const store = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v === null ? fallback : JSON.parse(v);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* sem storage */ }
  },
};

// ---------- i18n ----------
export function t(key, vars = {}) {
  const dict = DICT[state.lang] || DICT.pt;
  let s = dict[key] ?? DICT.pt[key] ?? key;
  for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, v);
  return s;
}

function applyI18n(root = document) {
  $$('[data-i18n]', root).forEach((el) => { el.textContent = t(el.dataset.i18n); });
  $$('[data-i18n-placeholder]', root).forEach((el) => { el.placeholder = t(el.dataset.i18nPlaceholder); });
  $$('[data-i18n-title]', root).forEach((el) => { el.title = t(el.dataset.i18nTitle); });
  document.documentElement.lang = state.lang === 'pt' ? 'pt-BR' : 'en';
  $$('.flag-btn').forEach((b) => b.classList.toggle('active', b.dataset.lang === state.lang));
}

function setLang(lang) {
  state.lang = lang;
  store.set('sd:lang', lang);
  applyI18n();
  renderRadar();
  if (state.analysis) renderAnalysis();
}

// ---------- formatação ----------
const locale = () => (state.lang === 'pt' ? 'pt-BR' : 'en-US');

export function fmtUsd(n) {
  if (n === null || n === undefined || !Number.isFinite(n)) return '—';
  const a = Math.abs(n);
  if (a >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (a >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (a >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

export function fmtPct(n, digits = 2) {
  if (n === null || n === undefined || !Number.isFinite(n)) return '—';
  return `${n.toLocaleString(locale(), { minimumFractionDigits: digits, maximumFractionDigits: digits })}%`;
}

export function fmtPrice(n) {
  if (n === null || n === undefined || !Number.isFinite(n)) return '—';
  const a = Math.abs(n);
  const d = a >= 1000 ? 2 : a >= 1 ? 4 : a >= 0.01 ? 6 : 8;
  return n.toLocaleString(locale(), { minimumFractionDigits: Math.min(d, 2), maximumFractionDigits: d });
}

const fmtAge = (days) => {
  if (days === null || days === undefined) return '—';
  if (days < 1) return t('age.hours', { n: Math.max(1, Math.round(days * 24)) });
  if (days < 60) return t('age.days', { n: Math.round(days) });
  return t('age.months', { n: Math.round(days / 30) });
};

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function toast(msg, type = 'info') {
  const el = $('#toast');
  el.textContent = msg;
  el.className = `toast show ${type}`;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { el.className = 'toast'; }, 3200);
}

// ---------- favoritos ----------
const getFavs = () => store.get('sd:favs', {});
const isFav = (id) => !!getFavs()[id];

function toggleFav(pool) {
  const favs = getFavs();
  if (favs[pool.id]) {
    delete favs[pool.id];
    toast(t('fav.removed'));
  } else {
    favs[pool.id] = {
      symbolA: pool.symbolA, symbolB: pool.symbolB, dex: pool.dex, dexLabel: pool.dexLabel,
      lastApr: pool.apr24h ?? null, wasHot: state.groups.hot.some((p) => p.id === pool.id),
    };
    toast(t('fav.added'), 'success');
  }
  store.set('sd:favs', favs);
  renderRadar();
  if (state.analysis && state.analysis.id === pool.id) renderAnalysis();
}

// ---------- alertas ----------
const notifyOn = () => store.get('sd:notify', false);

async function toggleNotify() {
  if (notifyOn()) {
    store.set('sd:notify', false);
    toast(t('notify.off'));
  } else {
    if ('Notification' in window && Notification.permission !== 'granted') {
      try { await Notification.requestPermission(); } catch { /* navegador sem suporte */ }
    }
    store.set('sd:notify', true);
    toast(t('notify.on'), 'success');
  }
  updateBell();
}

function updateBell() {
  $('#bellBtn').classList.toggle('active', notifyOn());
}

function notify(msg) {
  if ('Notification' in window && Notification.permission === 'granted') {
    try { new Notification('SignalDegen 📡', { body: msg }); return; } catch { /* cai no toast */ }
  }
  toast(msg, 'info');
}

/** Compara favoritas com o estado anterior e avisa mudanças relevantes */
function checkFavAlerts() {
  const favs = getFavs();
  const hotIds = new Set(state.groups.hot.map((p) => p.id));
  const byId = new Map(state.data.pools.map((p) => [p.id, p]));
  let changed = false;
  for (const [id, f] of Object.entries(favs)) {
    const p = byId.get(id);
    if (!p) continue;
    const pair = `${f.symbolA}/${f.symbolB}`;
    if (notifyOn()) {
      if (hotIds.has(id) && !f.wasHot) notify(t('notify.becameHot', { pair }));
      if (f.lastApr && p.apr24h !== null && p.apr24h < f.lastApr * 0.5) {
        notify(t('notify.aprDrop', { pair, from: fmtPct(f.lastApr, 0), to: fmtPct(p.apr24h, 0) }));
      }
    }
    f.wasHot = hotIds.has(id);
    f.lastApr = p.apr24h ?? f.lastApr;
    changed = true;
  }
  if (changed) store.set('sd:favs', favs);
}

// =====================================================
// RADAR
// =====================================================
async function loadRadar(force = false) {
  setStatus('loading');
  try {
    state.data = await loadAllPools({ force });
    const c = classify(state.data.pools);
    state.groups = { hot: c.hot, moderate: c.moderate };
    $('#statTotal').textContent = c.eligible.toLocaleString(locale());
    $('#statHot').textContent = c.hot.length;
    $('#statModerate').textContent = c.moderate.length;
    const anyOk = Object.values(state.data.status).some((s) => s === 'ok');
    setStatus(anyOk ? 'ok' : 'error');
    checkFavAlerts();
  } catch (e) {
    console.error(e);
    setStatus('error');
  }
  renderRadar();
}

function setStatus(kind) {
  const dot = $('#statusDot');
  const text = $('#statusText');
  dot.className = `status-dot ${kind}`;
  if (kind === 'loading') {
    text.textContent = t('radar.loading');
  } else if (kind === 'error') {
    text.textContent = t('radar.error');
  } else {
    updateAgo();
  }
}

function updateAgo() {
  if (!state.data) return;
  const mins = Math.floor((Date.now() - state.data.updatedAt) / 60000);
  $('#statusText').textContent = mins < 1 ? t('radar.justNow') : t('radar.ago', { n: mins });
}

function renderSources() {
  const el = $('#sources');
  if (!state.data) { el.innerHTML = ''; return; }
  const names = { raydium: 'Raydium', meteora: 'Meteora', gecko: 'GeckoTerminal' };
  el.innerHTML = Object.entries(state.data.status)
    .map(([k, s]) => `<span class="source-chip ${s}" title="${esc(t('source.' + s))}">${s === 'ok' ? '✓' : s === 'loading' ? '…' : '✕'} ${names[k]}</span>`)
    .join('');
}

function filteredList() {
  let list;
  if (state.tab === 'favorites') {
    const favs = getFavs();
    const byId = new Map((state.data?.pools || []).map((p) => [p.id, p]));
    list = Object.entries(favs).map(([id, f]) => {
      const p = byId.get(id);
      return p ? { ...p, score: scorePool(p), risk: riskLevel(p) } : { id, ...f, missing: true };
    });
  } else {
    list = state.groups[state.tab] || [];
  }
  const q = $('#searchInput').value.trim().toUpperCase();
  const dex = $('#dexFilter').value;
  const minTvl = Number($('#tvlFilter').value);
  return list.filter((p) => {
    if (q && !`${p.symbolA}/${p.symbolB}`.toUpperCase().includes(q)) return false;
    if (dex !== 'all' && p.family && p.family !== dex) return false;
    if (minTvl && !p.missing && (p.tvl ?? 0) < minTvl) return false;
    return true;
  });
}

function renderRadar() {
  if (!$('#poolGrid')) return;
  $$('.tab').forEach((b) => b.classList.toggle('active', b.dataset.tab === state.tab));
  $('#countHot').textContent = state.groups.hot.length;
  $('#countModerate').textContent = state.groups.moderate.length;
  $('#countFav').textContent = Object.keys(getFavs()).length;
  $('#tabDesc').textContent = t(`radar.desc.${state.tab}`);
  renderSources();
  if (state.data) updateAgo();

  const grid = $('#poolGrid');
  if (!state.data) {
    grid.innerHTML = Array.from({ length: 6 }, () => '<div class="pool-card skeleton"></div>').join('');
    return;
  }
  const list = filteredList();
  if (!list.length) {
    const key = state.tab === 'favorites' && !Object.keys(getFavs()).length ? 'radar.emptyFav' : 'radar.empty';
    grid.innerHTML = `<div class="empty card">${esc(t(key))}</div>`;
    return;
  }
  grid.innerHTML = list.map(poolCard).join('');
}

function poolCard(p) {
  const fav = isFav(p.id);
  const pair = `${esc(p.symbolA)} / ${esc(p.symbolB)}`;
  if (p.missing) {
    return `
      <article class="pool-card">
        <div class="pc-head">
          <div><h3 class="pc-pair">${pair}</h3><span class="badge">${esc(p.dexLabel || '')}</span></div>
          <button class="star active" data-act="fav" data-id="${esc(p.id)}" title="${esc(t('fav.remove'))}">★</button>
        </div>
        <p class="muted small">${esc(t('fav.noData'))}</p>
        <div class="pc-actions">
          <button class="btn btn-sm btn-primary" data-act="analyze" data-id="${esc(p.id)}">🔍 ${esc(t('card.analyze'))}</button>
        </div>
      </article>`;
  }
  const spike = p.vol7d ? p.vol24h / (p.vol7d / 7) : null;
  const anomaly = p.apr24h !== null && p.apr24h > RULES.aprAnomaly;
  const chg = p.priceChange24h;
  return `
    <article class="pool-card ${state.tab}">
      <div class="pc-head">
        <div>
          <h3 class="pc-pair">${pair}</h3>
          <span class="badge">${esc(p.dexLabel)}</span>
          ${p.feePct !== null ? `<span class="badge soft">${esc(t('card.fee'))} ${fmtPct(p.feePct, p.feePct < 0.1 ? 2 : 2)}</span>` : ''}
          ${p.trending ? `<span class="badge trend">📈 ${esc(t('card.trending'))}</span>` : ''}
        </div>
        <button class="star ${fav ? 'active' : ''}" data-act="fav" data-id="${esc(p.id)}" title="${esc(t(fav ? 'fav.remove' : 'fav.add'))}">${fav ? '★' : '☆'}</button>
      </div>

      <div class="pc-apr">
        <div>
          <span class="pc-apr-label">${esc(t('card.apr24'))}</span>
          <span class="pc-apr-value">${fmtPct(p.apr24h, 1)}</span>
        </div>
        <div>
          <span class="pc-apr-label">${esc(t('card.apr7'))}</span>
          <span class="pc-apr-value small">${fmtPct(p.apr7d, 1)}</span>
        </div>
        <div class="score" title="${esc(t('card.scoreTip'))}">
          <span class="score-num">${p.score}</span><span class="score-label">${esc(t('card.score'))}</span>
        </div>
      </div>
      ${anomaly ? `<p class="warn small">⚠️ ${esc(t('card.aprAnomaly'))}</p>` : ''}

      <dl class="pc-metrics">
        <div><dt>${esc(t('m.tvl'))}</dt><dd>${fmtUsd(p.tvl)}</dd></div>
        <div><dt>${esc(t('m.vol24'))}</dt><dd>${fmtUsd(p.vol24h)}</dd></div>
        <div><dt>${esc(t('m.turnover'))}</dt><dd>${p.tvl ? (p.vol24h / p.tvl).toFixed(2) + 'x' : '—'}</dd></div>
        <div><dt>${esc(spike ? t('m.spike') : t('m.change24'))}</dt><dd class="${spike ? '' : chg >= 0 ? 'pos' : 'neg'}">${spike ? spike.toFixed(1) + 'x' : chg !== null ? (chg >= 0 ? '+' : '') + fmtPct(chg, 1) : '—'}</dd></div>
      </dl>

      <div class="pc-foot">
        <span class="risk risk-${p.risk}">${esc(t('risk.' + p.risk))}</span>
        <span class="muted small">${esc(t(state.tab === 'moderate' ? 'card.suggestModerate' : 'card.suggestShort'))}</span>
      </div>

      <div class="pc-actions">
        <button class="btn btn-sm btn-primary" data-act="analyze" data-id="${esc(p.id)}">🔍 ${esc(t('card.analyze'))}</button>
        <a class="btn btn-sm btn-ghost" href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">🔗 ${esc(t('card.goPool'))}</a>
      </div>
    </article>`;
}

// =====================================================
// ANALISADOR
// =====================================================
async function analyze(address, network = 'solana') {
  address = address.trim();
  if (!address) { toast(t('an.needAddress'), 'error'); return; }
  const btn = $('#analyzeBtn');
  btn.disabled = true;
  btn.textContent = t('an.analyzing');
  const box = $('#analysis');
  box.hidden = false;
  box.innerHTML = `<div class="card loading-box"><span class="spinner"></span> ${esc(t('an.analyzing'))}</div>`;

  try {
    const d = await loadPoolDetail(address, network);

    // Orientação do preço: token volátil medido no outro token
    const baseStable = isStable(d.baseSymbol);
    const quoteStable = isStable(d.quoteSymbol);
    const invert = baseStable && !quoteStable;
    let price = d.basePriceInQuote ?? (d.basePriceUsd && d.quotePriceUsd ? d.basePriceUsd / d.quotePriceUsd : null);
    if (invert && price) price = 1 / price;
    const volSym = invert ? d.quoteSymbol : d.baseSymbol;
    const unitSym = invert ? d.baseSymbol : d.quoteSymbol;

    let history = [];
    try {
      history = await loadPriceHistory(address, network, invert ? 'quote' : 'base');
    } catch {
      d.warnings.push('history');
    }
    if (!price && history.length) price = history[history.length - 1].close;
    if (!price) throw new Error('NO_PRICE');

    const strategy = detectStrategy(d.baseSymbol, d.quoteSymbol);
    const ranges = buildRanges(price, rangeWidths(d.priceChange24h, strategy));
    state.analysis = {
      ...d, network, price, volSym, unitSym, strategy, ranges, history,
      custom: { min: ranges.moderate.min, max: ranges.moderate.max },
      at: new Date(),
    };
    store.set('sd:lastAnalysis', { address, network });
    renderAnalysis();
    box.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (e) {
    console.error(e);
    state.analysis = null;
    const key = e.message === 'POOL_NOT_FOUND' ? 'an.notFound' : e.message === 'NO_PRICE' ? 'an.noPrice' : 'an.failed';
    box.innerHTML = `<div class="card error-box">❌ ${esc(t(key))}</div>`;
  } finally {
    btn.disabled = false;
    btn.textContent = t('an.analyze');
  }
}

function renderAnalysis() {
  const a = state.analysis;
  if (!a) return;
  const box = $('#analysis');
  const pair = `${esc(a.baseSymbol)} / ${esc(a.quoteSymbol)}`;
  const risk = riskLevel({
    tvl: a.tvl ?? 0, vol24h: a.vol24h ?? 0, ageDays: a.ageDays ?? null,
    priceChange24h: a.priceChange24h ?? null, symbolA: a.baseSymbol, symbolB: a.quoteSymbol,
  });
  const apr = a.apr24h ?? null;
  const anomaly = apr !== null && apr > RULES.aprAnomaly;
  const unit = `${esc(a.unitSym)} ${esc(t('an.per'))} ${esc(a.volSym)}`;
  const recommended = a.strategy === 'stable_pair' ? 'short' : 'moderate';
  const tir = (r) => timeInRange(a.history, r.min, r.max);
  const fav = isFav(a.id);

  const rangeCard = (key, icon, money) => {
    const r = a.ranges[key];
    const time = tir(r);
    return `
      <article class="range-card range-${key} ${key === recommended ? 'recommended' : ''}">
        ${key === recommended ? `<span class="rec-badge">★ ${esc(t('rg.recommended'))}</span>` : ''}
        <header class="rc-head">
          <span class="rc-title">${icon} ${esc(t('rg.' + key))}</span>
          <span class="rc-pct">±${r.pct}%</span>
        </header>
        <div class="rc-prices">
          <div><span class="rc-lbl">${esc(t('rg.min'))}</span><span class="rc-val">${fmtPrice(r.min)}</span></div>
          <span class="rc-arrow">⟷</span>
          <div><span class="rc-lbl">${esc(t('rg.max'))}</span><span class="rc-val">${fmtPrice(r.max)}</span></div>
        </div>
        <div class="rc-tir">
          <div class="tir-bar"><span style="width:${time === null ? 0 : time.toFixed(0)}%"></span></div>
          <span class="small">${time === null ? esc(t('rg.tirNA')) : esc(t('rg.tir', { n: time.toFixed(0) }))}</span>
        </div>
        <ul class="rc-facts">
          <li>${money} ${esc(t('rg.' + key + '.earn'))}</li>
          <li>⏱️ ${esc(t('rg.' + key + '.adjust'))}</li>
          <li>👤 ${esc(t('rg.' + key + '.who'))}</li>
        </ul>
      </article>`;
  };

  const objectives = [1, 2, 3].map((i) => `<li>✔️ ${esc(t(`obj.${a.strategy}.${i}`, { vol: a.volSym, stable: isStable(a.baseSymbol) ? a.baseSymbol : a.quoteSymbol, a: a.baseSymbol, b: a.quoteSymbol }))}</li>`).join('');

  box.innerHTML = `
    <div class="an-top">
      <button class="btn btn-sm btn-ghost" data-act="new">← ${esc(t('an.new'))}</button>
    </div>

    <div class="card an-header">
      <div>
        <h3 class="an-pair">${pair}</h3>
        <div class="an-tags">
          <span class="badge">${esc(a.dexLabel)}</span>
          <span class="badge soft">${esc(t('strat.' + a.strategy))}</span>
          ${a.isClmm ? '<span class="badge soft">CLMM / DLMM</span>' : `<span class="badge soft">${esc(t('an.fullRange'))}</span>`}
          <span class="risk risk-${risk}">${esc(t('risk.' + risk))}</span>
        </div>
        <p class="muted small">🗓️ ${esc(t('an.madeAt'))} ${a.at.toLocaleString(locale(), { dateStyle: 'short', timeStyle: 'short' })}</p>
      </div>
      <div class="an-price">
        <span class="muted small">${esc(t('an.currentPrice'))}</span>
        <span class="an-price-val">${fmtPrice(a.price)}</span>
        <span class="muted small">${unit}</span>
        <button class="star ${fav ? 'active' : ''}" data-act="fav-analysis" title="${esc(t(fav ? 'fav.remove' : 'fav.add'))}">${fav ? '★' : '☆'}</button>
      </div>
    </div>

    <div class="card">
      <h4 class="sub-title">▶️ ${esc(t('an.objective'))}</h4>
      <ul class="objectives">${objectives}</ul>
    </div>

    <div class="metrics">
      <div class="metric"><span>💧 ${esc(t('m.tvl'))}</span><strong>${fmtUsd(a.tvl)}</strong></div>
      <div class="metric"><span>⚡ ${esc(t('m.vol24'))}</span><strong>${fmtUsd(a.vol24h)}</strong></div>
      <div class="metric"><span>💲 ${esc(t('m.fee'))}</span><strong>${a.feeKnown ? fmtPct(a.feePct) : '—'}</strong></div>
      <div class="metric"><span>📈 ${esc(t('m.change24'))}</span><strong class="${(a.priceChange24h ?? 0) >= 0 ? 'pos' : 'neg'}">${a.priceChange24h === null || a.priceChange24h === undefined ? '—' : (a.priceChange24h >= 0 ? '+' : '') + fmtPct(a.priceChange24h)}</strong></div>
      <div class="metric"><span>🕰️ ${esc(t('m.age'))}</span><strong>${fmtAge(a.ageDays)}</strong></div>
      <div class="metric"><span>🏦 ${esc(t('m.mcap', { s: a.baseSymbol }))}</span><strong>${fmtUsd(a.baseMcap)}</strong></div>
    </div>

    <div class="card">
      <h4 class="sub-title">📊 ${esc(t('apr.title'))}</h4>
      ${apr === null ? `<p class="warn">⚠️ ${esc(t('apr.unknownFee'))}</p>` : `
      <div class="apr-grid">
        <div class="apr-box"><span>${esc(t('apr.daily'))}</span><strong>${fmtPct(apr / 365, 3)}</strong><small>${esc(t('apr.dailyTip'))}</small></div>
        <div class="apr-box"><span>${esc(t('apr.monthly'))}</span><strong>${fmtPct((apr / 365) * 30)}</strong><small>${esc(t('apr.monthlyTip'))}</small></div>
        <div class="apr-box hl"><span>${esc(t('apr.annual'))}</span><strong>${fmtPct(apr)}</strong><small>${esc(t('apr.annualTip'))}</small></div>
      </div>
      ${a.apr7d !== null && a.apr7d !== undefined ? `<p class="small muted">${esc(t('apr.vs7d', { n: fmtPct(a.apr7d, 1) }))}</p>` : ''}
      ${anomaly ? `<p class="warn">⚠️ ${esc(t('card.aprAnomaly'))}</p>` : ''}`}
      <p class="small muted">ℹ️ ${esc(t(a.isClmm ? 'apr.noteClmm' : 'apr.noteFull'))}</p>
    </div>

    <div class="card">
      <h4 class="sub-title">🎯 ${esc(t('rg.title'))}</h4>
      <div class="info-box">❓ <div><strong>${esc(t('rg.whatTitle'))}</strong> ${esc(t('rg.what'))}</div></div>
      ${!a.isClmm ? `<p class="warn small">⚠️ ${esc(t('rg.notClmm'))}</p>` : ''}

      <div class="chart-wrap"><canvas id="rangeChart" aria-label="${esc(t('chart.aria'))}"></canvas></div>
      <div class="legend">
        <span><i class="lg lg-short"></i>${esc(t('rg.short'))}</span>
        <span><i class="lg lg-moderate"></i>${esc(t('rg.moderate'))}</span>
        <span><i class="lg lg-long"></i>${esc(t('rg.long'))}</span>
        <span><i class="lg lg-custom"></i>${esc(t('rg.custom'))}</span>
        <span><i class="lg lg-price"></i>${esc(t('chart.price'))}</span>
      </div>
      ${a.history.length ? '' : `<p class="small muted">${esc(t('chart.noHistory'))}</p>`}

      <div class="range-grid">
        ${rangeCard('short', '🔴', '💰💰💰')}
        ${rangeCard('moderate', '🟡', '💰💰')}
        ${rangeCard('long', '🟢', '💰')}
      </div>

      <div class="custom-range">
        <h5>🛠️ ${esc(t('rg.customTitle'))} <span class="muted small">(${unit})</span></h5>
        <div class="cr-controls">
          ${['min', 'max'].map((k) => `
            <div class="cr-field">
              <label>${esc(t('rg.' + k))}</label>
              <div class="stepper">
                <button type="button" data-act="step" data-k="${k}" data-d="-1">−</button>
                <input type="number" step="any" id="custom-${k}" value="${a.custom[k].toPrecision(6)}">
                <button type="button" data-act="step" data-k="${k}" data-d="1">+</button>
              </div>
            </div>`).join('')}
        </div>
        <p id="customInfo" class="custom-info"></p>
      </div>
    </div>

    <div class="card notice">
      <strong>👽 ${esc(t('imp.title'))}</strong>
      <p>${esc(t('imp.text', { vol: a.volSym, price: fmtPrice(a.price), unit: `${a.unitSym}` }))}</p>
    </div>

    ${a.warnings.length ? `<p class="small muted">ℹ️ ${esc(t('an.partial', { list: a.warnings.join(', ') }))}</p>` : ''}

    <div class="an-actions">
      <button class="btn btn-primary" data-act="copy">📋 ${esc(t('an.copy'))}</button>
      <a class="btn btn-ghost" href="${esc(a.url)}" target="_blank" rel="noopener noreferrer">🔗 ${esc(t('card.goPool'))}</a>
      <a class="btn btn-ghost" href="${esc(a.chartUrl)}" target="_blank" rel="noopener noreferrer">📈 ${esc(t('an.chart'))}</a>
      <button class="btn btn-soft" data-act="new">🔄 ${esc(t('an.new'))}</button>
    </div>`;

  drawChart();
  updateCustomInfo();
}

function drawChart() {
  const a = state.analysis;
  const canvas = $('#rangeChart');
  if (!canvas || typeof Chart === 'undefined') return;
  if (state.chart) { state.chart.destroy(); state.chart = null; }

  const hist = a.history.length ? a.history : [{ t: Date.now(), close: a.price }];
  const labels = hist.map((c) => new Date(c.t).toLocaleString(locale(), { day: '2-digit', month: '2-digit', hour: '2-digit' }));
  const flat = (v) => hist.map(() => v);
  const band = (min, max, color) => [
    { data: flat(min), borderColor: 'transparent', pointRadius: 0, fill: false },
    { data: flat(max), borderColor: 'transparent', backgroundColor: color, pointRadius: 0, fill: '-1' },
  ];
  const r = a.ranges;
  const datasets = [
    ...band(r.long.min, r.long.max, 'rgba(16,185,129,0.13)'),
    ...band(r.moderate.min, r.moderate.max, 'rgba(245,158,11,0.18)'),
    ...band(r.short.min, r.short.max, 'rgba(239,68,68,0.22)'),
    { data: flat(a.custom.min), borderColor: '#c084fc', borderDash: [6, 4], borderWidth: 1.5, pointRadius: 0, fill: false },
    { data: flat(a.custom.max), borderColor: '#c084fc', borderDash: [6, 4], borderWidth: 1.5, pointRadius: 0, fill: false },
    {
      data: hist.map((c) => c.close), borderColor: '#f472b6', borderWidth: 2.5, tension: 0.3, fill: false,
      pointRadius: hist.map((_, i) => (i === hist.length - 1 ? 5 : 0)), pointBackgroundColor: '#fff',
    },
  ];
  const lows = [r.long.min, ...hist.map((c) => c.close)];
  const highs = [r.long.max, ...hist.map((c) => c.close)];
  const pad = (Math.max(...highs) - Math.min(...lows)) * 0.05;

  state.chart = new Chart(canvas, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          filter: (item) => item.datasetIndex === datasets.length - 1,
          callbacks: { label: (c) => ` ${fmtPrice(c.parsed.y)} ${a.unitSym}` },
        },
      },
      scales: {
        x: { ticks: { color: '#a5b4fc', maxTicksLimit: 6, font: { size: 10 } }, grid: { display: false } },
        y: {
          suggestedMin: Math.min(...lows) - pad, suggestedMax: Math.max(...highs) + pad,
          ticks: { color: '#a5b4fc', font: { size: 10 }, callback: (v) => fmtPrice(v) },
          grid: { color: 'rgba(168,85,247,0.08)' },
        },
      },
    },
  });
}

function updateCustomInfo() {
  const a = state.analysis;
  const el = $('#customInfo');
  if (!a || !el) return;
  const { min, max } = a.custom;
  if (!(min > 0 && max > min)) {
    el.className = 'custom-info bad';
    el.textContent = t('rg.invalid');
    return;
  }
  const width = ((max - min) / 2 / a.price) * 100;
  const time = timeInRange(a.history, min, max);
  const inside = a.price >= min && a.price <= max;
  el.className = `custom-info ${inside ? 'good' : 'bad'}`;
  el.textContent = [
    inside ? `✅ ${t('rg.inside')}` : `🚨 ${t('rg.outside')}`,
    t('rg.width', { n: width.toFixed(1) }),
    time === null ? '' : t('rg.tir', { n: time.toFixed(0) }),
  ].filter(Boolean).join(' • ');
}

function onCustomChange() {
  const a = state.analysis;
  if (!a) return;
  a.custom.min = num($('#custom-min').value) ?? a.custom.min;
  a.custom.max = num($('#custom-max').value) ?? a.custom.max;
  if (state.chart) {
    const n = state.chart.data.datasets.length;
    state.chart.data.datasets[n - 3].data = state.chart.data.datasets[n - 3].data.map(() => a.custom.min);
    state.chart.data.datasets[n - 2].data = state.chart.data.datasets[n - 2].data.map(() => a.custom.max);
    state.chart.update('none');
  }
  updateCustomInfo();
}

function analysisText() {
  const a = state.analysis;
  const apr = a.apr24h;
  const line = (k, icon) => `${icon} ${t('rg.' + k)} (±${a.ranges[k].pct}%): ${fmtPrice(a.ranges[k].min)} – ${fmtPrice(a.ranges[k].max)}`;
  return [
    `✨ POOL ${a.baseSymbol} / ${a.quoteSymbol} (${t('strat.' + a.strategy)})`,
    `🗓️ ${t('an.madeAt')} ${a.at.toLocaleString(locale(), { dateStyle: 'short', timeStyle: 'short' })}`,
    `🚨 ${t('an.risk')}: ${t('risk.' + riskLevel({ tvl: a.tvl ?? 0, vol24h: a.vol24h ?? 0, ageDays: a.ageDays ?? null, priceChange24h: a.priceChange24h ?? null, symbolA: a.baseSymbol, symbolB: a.quoteSymbol }))}`,
    '',
    `▶︎ ${t('an.objective')}:`,
    ...[1, 2, 3].map((i) => `✔️ ${t(`obj.${a.strategy}.${i}`, { vol: a.volSym, stable: isStable(a.baseSymbol) ? a.baseSymbol : a.quoteSymbol, a: a.baseSymbol, b: a.quoteSymbol })}`),
    '',
    `🕵️‍♂️ ${t('an.poolData')}:`,
    `🔗 ${a.url}`,
    `🎯 ${t('an.pair')}: ${a.baseSymbol} / ${a.quoteSymbol}`,
    `💲 ${t('m.fee')}: ${a.feeKnown ? fmtPct(a.feePct) : '—'}`,
    `🌐 ${t('an.network')}: ${a.network}`,
    `🤖 DEX: ${a.dexLabel}`,
    `🏦 ${t('m.mcap', { s: a.baseSymbol })}: ${fmtUsd(a.baseMcap)}`,
    `💧 ${t('m.tvl')}: ${fmtUsd(a.tvl)}`,
    `⚡ ${t('m.vol24')}: ${fmtUsd(a.vol24h)}`,
    `💲 ${t('an.currentPrice')}: ${fmtPrice(a.price)} ${a.unitSym}/${a.volSym}`,
    '',
    `📈 ${t('apr.title')}:`,
    apr === null ? `• ${t('apr.unknownFee')}` : `• ${t('apr.daily')}: ${fmtPct(apr / 365, 3)}\n• ${t('apr.monthly')}: ${fmtPct((apr / 365) * 30)}\n• ${t('apr.annual')}: ${fmtPct(apr)}`,
    '',
    `🏁 ${t('rg.title')}:`,
    line('short', '🔴'), line('moderate', '🟡'), line('long', '🟢'),
    '',
    `👽 ${t('imp.title')}:`,
    t('imp.text', { vol: a.volSym, price: fmtPrice(a.price), unit: a.unitSym }),
    '',
    'SignalDegen 📡',
  ].join('\n');
}

function resetAnalysis() {
  state.analysis = null;
  if (state.chart) { state.chart.destroy(); state.chart = null; }
  $('#analysis').hidden = true;
  $('#analysis').innerHTML = '';
  $('#poolInput').value = '';
  $('#analyzer').scrollIntoView({ behavior: 'smooth' });
  $('#poolInput').focus({ preventScroll: true });
}

// =====================================================
// EVENTOS
// =====================================================
function bind() {
  $$('.flag-btn').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));
  $('#menuBtn').addEventListener('click', () => $('#nav').classList.toggle('open'));
  $$('.nav-link').forEach((l) => l.addEventListener('click', () => $('#nav').classList.remove('open')));
  $('#bellBtn').addEventListener('click', toggleNotify);
  $('#refreshBtn').addEventListener('click', () => loadRadar(true));

  $$('.tab').forEach((b) => b.addEventListener('click', () => { state.tab = b.dataset.tab; renderRadar(); }));
  ['#searchInput', '#dexFilter', '#tvlFilter'].forEach((s) => $(s).addEventListener('input', renderRadar));

  $('#poolGrid').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const id = btn.dataset.id;
    const pool = state.data?.pools.find((p) => p.id === id) || { id, ...getFavs()[id] };
    if (btn.dataset.act === 'fav') toggleFav(pool);
    if (btn.dataset.act === 'analyze') {
      $('#poolInput').value = id;
      $('#networkSelect').value = 'solana';
      analyze(id, 'solana');
    }
  });

  $('#analyzerForm').addEventListener('submit', (e) => {
    e.preventDefault();
    analyze($('#poolInput').value, $('#networkSelect').value);
  });

  $('#analysis').addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-act]');
    if (!btn || !state.analysis) return;
    const a = state.analysis;
    if (btn.dataset.act === 'new') resetAnalysis();
    if (btn.dataset.act === 'copy') {
      try {
        await navigator.clipboard.writeText(analysisText());
        toast(t('an.copied'), 'success');
      } catch {
        toast(t('an.copyFail'), 'error');
      }
    }
    if (btn.dataset.act === 'fav-analysis') {
      toggleFav({ id: a.id, symbolA: a.baseSymbol, symbolB: a.quoteSymbol, dex: a.dex, dexLabel: a.dexLabel, apr24h: a.apr24h });
    }
    if (btn.dataset.act === 'step') {
      const input = $(`#custom-${btn.dataset.k}`);
      const step = a.price * 0.01 * Number(btn.dataset.d); // passos de 1% do preço
      input.value = Math.max(0, (num(input.value) ?? 0) + step).toPrecision(6);
      onCustomChange();
    }
  });
  $('#analysis').addEventListener('input', (e) => {
    if (e.target.id === 'custom-min' || e.target.id === 'custom-max') onCustomChange();
  });
}

// ---------- início ----------
function init() {
  state.lang = store.get('sd:lang', 'pt') === 'en' ? 'en' : 'pt';
  applyI18n();
  updateBell();
  bind();
  renderRadar();
  loadRadar();
  setInterval(() => { if (!document.hidden) loadRadar(); }, REFRESH_MS);
  setInterval(updateAgo, 30 * 1000);
}

if (typeof document !== 'undefined') init();
