// =====================================================
// SignalDegen — Fontes de dados de pools (Solana)
// Raydium API v3 + Meteora DLMM + GeckoTerminal (+ DexScreener como reserva)
// Tudo roda no navegador, com cache em localStorage.
// =====================================================

export const ENDPOINTS = {
  raydiumList:
    'https://api-v3.raydium.io/pools/info/list?poolType=all&poolSortField=volume24h&sortType=desc&pageSize=300&page=1',
  raydiumIds: (ids) => `https://api-v3.raydium.io/pools/info/ids?ids=${ids}`,
  meteoraList:
    'https://dlmm-api.meteora.ag/pair/all_with_pagination?page=0&limit=200&sort_key=volume&order_by=desc',
  meteoraPair: (addr) => `https://dlmm-api.meteora.ag/pair/${addr}`,
  geckoTrending: (net = 'solana') =>
    `https://api.geckoterminal.com/api/v2/networks/${net}/trending_pools?include=base_token,quote_token,dex&page=1`,
  geckoTopPools: (net, page = 1) =>
    `https://api.geckoterminal.com/api/v2/networks/${net}/pools?include=base_token,quote_token,dex&sort=h24_volume_usd_desc&page=${page}`,
  geckoNetworks: (page) => `https://api.geckoterminal.com/api/v2/networks?page=${page}`,
  geckoPool: (net, addr) =>
    `https://api.geckoterminal.com/api/v2/networks/${net}/pools/${addr}?include=base_token,quote_token,dex`,
  geckoOhlcv: (net, addr, token) =>
    `https://api.geckoterminal.com/api/v2/networks/${net}/pools/${addr}/ohlcv/hour?aggregate=4&limit=42&currency=token&token=${token}`,
  dexscreenerPair: (net, addr) => `https://api.dexscreener.com/latest/dex/pairs/${net}/${addr}`,
};

export const STABLES = [
  'USDC', 'USDT', 'USDS', 'PYUSD', 'USDH', 'UXD', 'DAI', 'USDE', 'FDUSD', 'USD1', 'AUSD', 'USDG', 'USD*',
];
// Pares considerados "sólidos": SOL, stablecoins e LSTs de SOL
export const SOLID = [
  'SOL', 'WSOL', 'JITOSOL', 'MSOL', 'BSOL', 'JUPSOL', 'INF', 'BNSOL',
  'ETH', 'WETH', 'WBTC', 'CBBTC', ...STABLES,
];

// Redes suportadas. gecko = id da rede no GeckoTerminal; ds = id no DexScreener
export const CHAINS = {
  solana: { label: 'Solana', gecko: 'solana', ds: 'solana' },
  robinhood: { label: 'Robinhood Chain', gecko: null, ds: 'robinhood', match: /robinhood/i },
  eth: { label: 'Ethereum', gecko: 'eth', ds: 'ethereum' },
  base: { label: 'Base', gecko: 'base', ds: 'base' },
  arbitrum: { label: 'Arbitrum', gecko: 'arbitrum', ds: 'arbitrum' },
  bsc: { label: 'BSC', gecko: 'bsc', ds: 'bsc' },
};

export const isStable = (sym) => STABLES.includes(String(sym || '').toUpperCase());
export const isSolid = (sym) => SOLID.includes(String(sym || '').toUpperCase());

// ---------- helpers ----------
export function num(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

const CACHE_PREFIX = 'sd:cache:';

function readCache(url, ttlMs) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + url);
    if (!raw) return null;
    const { t, d } = JSON.parse(raw);
    if (Date.now() - t > ttlMs) return null;
    return d;
  } catch {
    return null;
  }
}

function writeCache(url, data) {
  try {
    localStorage.setItem(CACHE_PREFIX + url, JSON.stringify({ t: Date.now(), d: data }));
  } catch {
    // Cache cheio ou indisponível: segue sem cache
  }
}

/** fetch com timeout + cache (ttl em ms). force=true ignora o cache. */
export async function getJSON(url, { ttl = 5 * 60 * 1000, force = false, timeout = 15000 } = {}) {
  if (!force) {
    const cached = readCache(url, ttl);
    if (cached) return cached;
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    writeCache(url, data);
    return data;
  } finally {
    clearTimeout(timer);
  }
}

/** Taxa em % a partir de fração (0.0025) ou já em % (0.25). */
export function feeToPct(fee) {
  const f = num(fee);
  if (f === null) return null;
  return f < 0.1 ? f * 100 : f;
}

/** Extrai a taxa do nome da pool no GeckoTerminal, ex.: "SOL / USDC 0.04%" */
export function feeFromName(name) {
  const m = String(name || '').match(/(\d+(?:\.\d+)?)\s*%/);
  return m ? parseFloat(m[1]) : null;
}

const aprFrom = (fees, tvl) => (fees !== null && tvl ? (fees / tvl) * 365 * 100 : null);
const ageFromSeconds = (s) => (num(s) ? (Date.now() / 1000 - num(s)) / 86400 : null);
const ageFromDate = (d) => {
  const t = Date.parse(d);
  return Number.isFinite(t) ? (Date.now() - t) / 86400000 : null;
};

/**
 * Descobre o id da rede no GeckoTerminal pelo nome (ex.: Robinhood Chain).
 * A lista de redes fica em cache por 24h.
 */
export async function geckoNetworkId(chain) {
  const c = CHAINS[chain] || CHAINS.solana;
  if (c.gecko) return c.gecko;
  for (let page = 1; page <= 4; page++) {
    try {
      const json = await getJSON(ENDPOINTS.geckoNetworks(page), { ttl: 24 * 60 * 60 * 1000 });
      const hit = (json.data || []).find((n) => c.match.test(n.attributes?.name || '') || c.match.test(n.id));
      if (hit) {
        c.gecko = hit.id;
        return hit.id;
      }
      if (!json.data || json.data.length < 100) break;
    } catch {
      break;
    }
  }
  return chain; // melhor palpite
}

// ---------- links ----------
export function poolLink({ dex, id, isClmm, chain = 'solana' }) {
  if (chain !== 'solana') return `https://dexscreener.com/${(CHAINS[chain] || {}).ds || chain}/${id}`;
  const d = String(dex || '').toLowerCase();
  if (d.startsWith('raydium')) {
    return isClmm || d.includes('clmm')
      ? `https://raydium.io/clmm/create-position/?pool_id=${id}`
      : `https://raydium.io/liquidity/increase/?mode=add&pool_id=${id}`;
  }
  if (d.startsWith('meteora')) {
    return d.includes('damm') ? `https://app.meteora.ag/damm/${id}` : `https://app.meteora.ag/dlmm/${id}`;
  }
  if (d.startsWith('orca')) return `https://www.orca.so/pools/${id}`;
  return `https://dexscreener.com/solana/${id}`;
}

export function dexLabel(dex) {
  const d = String(dex || '').toLowerCase();
  if (d.includes('raydium') && d.includes('clmm')) return 'Raydium CLMM';
  if (d.includes('raydium') && d.includes('cp')) return 'Raydium CPMM';
  if (d.includes('raydium')) return 'Raydium';
  if (d.includes('meteora') && d.includes('damm')) return 'Meteora DAMM';
  if (d.includes('meteora')) return 'Meteora DLMM';
  if (d.includes('orca')) return 'Orca';
  if (d.includes('pump')) return 'PumpSwap';
  if (d.includes('uniswap')) return d.includes('v4') ? 'Uniswap v4' : d.includes('v3') ? 'Uniswap v3' : 'Uniswap';
  return dex ? dex.charAt(0).toUpperCase() + dex.slice(1) : '—';
}

export function dexFamily(dex) {
  const d = String(dex || '').toLowerCase();
  if (d.includes('raydium')) return 'raydium';
  if (d.includes('meteora')) return 'meteora';
  if (d.includes('orca')) return 'orca';
  if (d.includes('uniswap')) return 'uniswap';
  return 'other';
}

// ---------- normalizadores ----------
/** Formato único de pool usado no site */
function makePool(o) {
  return {
    id: o.id,
    dex: o.dex,
    dexLabel: dexLabel(o.dex),
    family: dexFamily(o.dex),
    isClmm: !!o.isClmm,
    symbolA: o.symbolA || '?',
    symbolB: o.symbolB || '?',
    feePct: o.feePct ?? null,
    tvl: o.tvl ?? null,
    vol24h: o.vol24h ?? null,
    vol7d: o.vol7d ?? null,
    fees24h: o.fees24h ?? null,
    apr24h: o.apr24h ?? null,
    apr7d: o.apr7d ?? null,
    priceChange24h: o.priceChange24h ?? null,
    ageDays: o.ageDays ?? null,
    trending: !!o.trending,
    chain: o.chain || 'solana',
    source: o.source,
    url: poolLink({ dex: o.dex, id: o.id, isClmm: o.isClmm, chain: o.chain || 'solana' }),
  };
}

export function normalizeRaydium(p) {
  const a = p.mintA || p.mint1 || {};
  const b = p.mintB || p.mint2 || {};
  let fee = num(p.feeRate);
  if (fee === null && p.config && num(p.config.tradeFeeRate) !== null) {
    fee = num(p.config.tradeFeeRate) / 1e6; // tradeFeeRate vem em milionésimos
  }
  const feePct = feeToPct(fee);
  const feeFrac = feePct !== null ? feePct / 100 : null;
  const tvl = num(p.tvl);
  const day = p.day || {};
  const week = p.week || {};
  const vol24h = num(day.volume);
  const vol7d = num(week.volume);
  const fees24h = num(day.volumeFee) ?? (vol24h !== null && feeFrac !== null ? vol24h * feeFrac : null);
  const fees7dDaily =
    num(week.volumeFee) !== null ? num(week.volumeFee) / 7 : vol7d !== null && feeFrac !== null ? (vol7d / 7) * feeFrac : null;
  const isClmm = /concentrated|clmm/i.test(p.type || '');
  return makePool({
    id: p.id,
    dex: isClmm ? 'raydium-clmm' : 'raydium',
    isClmm,
    symbolA: a.symbol,
    symbolB: b.symbol,
    feePct,
    tvl,
    vol24h,
    vol7d,
    fees24h,
    apr24h: num(day.feeApr) ?? aprFrom(fees24h, tvl),
    apr7d: num(week.feeApr) ?? aprFrom(fees7dDaily, tvl),
    ageDays: ageFromSeconds(p.openTime),
    source: 'raydium',
  });
}

export function normalizeMeteora(p) {
  const [symA, symB] = String(p.name || '').split('-');
  const tvl = num(p.liquidity);
  const fees24h = num(p.fees_24h);
  return makePool({
    id: p.address,
    dex: 'meteora-dlmm',
    isClmm: true,
    symbolA: symA,
    symbolB: symB,
    feePct: num(p.base_fee_percentage),
    tvl,
    vol24h: num(p.trade_volume_24h),
    fees24h,
    apr24h: aprFrom(fees24h, tvl),
    source: 'meteora',
  });
}

function geckoTokenMap(json) {
  const map = {};
  for (const inc of json.included || []) {
    if (inc.type === 'token') map[inc.id] = inc.attributes || {};
  }
  return map;
}

export function normalizeGecko(item, tokens = {}, { chain = 'solana', trending = true } = {}) {
  const at = item.attributes || {};
  const rel = item.relationships || {};
  const dex = rel.dex?.data?.id || '';
  const baseTok = tokens[rel.base_token?.data?.id] || {};
  const quoteTok = tokens[rel.quote_token?.data?.id] || {};
  const [nameA, nameB] = String(at.name || '').replace(/\s+\d+(\.\d+)?%$/, '').split(' / ');
  const feePct = feeFromName(at.name);
  const tvl = num(at.reserve_in_usd);
  const vol24h = num(at.volume_usd?.h24);
  const fees24h = feePct !== null && vol24h !== null ? vol24h * (feePct / 100) : null;
  return makePool({
    id: at.address,
    dex,
    isClmm: /clmm|dlmm|whirlpool|orca|v3|v4|slipstream|concentrated/i.test(dex),
    symbolA: baseTok.symbol || nameA,
    symbolB: quoteTok.symbol || nameB,
    feePct,
    tvl,
    vol24h,
    fees24h,
    apr24h: aprFrom(fees24h, tvl),
    priceChange24h: num(at.price_change_percentage?.h24),
    ageDays: ageFromDate(at.pool_created_at),
    trending,
    chain,
    source: 'gecko',
  });
}

// ---------- carregamento do radar ----------
/**
 * Busca pools de todas as fontes. Cada fonte é independente:
 * se uma falhar, as outras continuam. Retorna { pools, status }.
 */
export async function loadAllPools({ force = false, chain = 'solana' } = {}) {
  if (chain !== 'solana') return loadGeckoChain(chain, force);
  const status = { raydium: 'loading', meteora: 'loading', gecko: 'loading' };

  const [ray, met, gec] = await Promise.allSettled([
    getJSON(ENDPOINTS.raydiumList, { force }),
    getJSON(ENDPOINTS.meteoraList, { force }),
    getJSON(ENDPOINTS.geckoTrending('solana'), { force }),
  ]);

  const byId = new Map();

  if (ray.status === 'fulfilled') {
    const list = ray.value?.data?.data || ray.value?.data || [];
    let ok = 0;
    for (const p of Array.isArray(list) ? list : []) {
      try {
        const n = normalizeRaydium(p);
        if (n.id) { byId.set(n.id, n); ok++; }
      } catch { /* ignora item inválido */ }
    }
    status.raydium = ok ? 'ok' : 'empty';
  } else {
    status.raydium = 'error';
  }

  if (met.status === 'fulfilled') {
    const list = met.value?.pairs || met.value?.data || (Array.isArray(met.value) ? met.value : []);
    let ok = 0;
    for (const p of list) {
      if (p.hide || p.is_blacklisted) continue;
      try {
        const n = normalizeMeteora(p);
        if (n.id && !byId.has(n.id)) { byId.set(n.id, n); ok++; }
      } catch { /* ignora */ }
    }
    status.meteora = ok ? 'ok' : 'empty';
  } else {
    status.meteora = 'error';
  }

  if (gec.status === 'fulfilled') {
    const tokens = geckoTokenMap(gec.value);
    let ok = 0;
    for (const item of gec.value?.data || []) {
      try {
        const n = normalizeGecko(item, tokens);
        if (!n.id) continue;
        const existing = byId.get(n.id);
        if (existing) {
          // Dados nativos da DEX têm prioridade; GeckoTerminal só complementa
          existing.trending = true;
          existing.priceChange24h = existing.priceChange24h ?? n.priceChange24h;
          existing.ageDays = existing.ageDays ?? n.ageDays;
        } else {
          byId.set(n.id, n);
        }
        ok++;
      } catch { /* ignora */ }
    }
    status.gecko = ok ? 'ok' : 'empty';
  } else {
    status.gecko = 'error';
  }

  return { pools: [...byId.values()], status, updatedAt: Date.now(), chain };
}

/** Redes sem API nativa de DEX (ex.: Robinhood Chain): tudo via GeckoTerminal */
async function loadGeckoChain(chain, force) {
  const net = await geckoNetworkId(chain);
  const results = await Promise.allSettled([
    getJSON(ENDPOINTS.geckoTrending(net), { force }),
    getJSON(ENDPOINTS.geckoTopPools(net, 1), { force }),
    getJSON(ENDPOINTS.geckoTopPools(net, 2), { force }),
  ]);
  const byId = new Map();
  results.forEach((r, i) => {
    if (r.status !== 'fulfilled') return;
    const tokens = geckoTokenMap(r.value);
    for (const item of r.value?.data || []) {
      try {
        const n = normalizeGecko(item, tokens, { chain, trending: i === 0 });
        if (!n.id) continue;
        const prev = byId.get(n.id);
        if (prev) prev.trending = prev.trending || n.trending;
        else byId.set(n.id, n);
      } catch { /* ignora */ }
    }
  });
  const ok = results.some((r) => r.status === 'fulfilled');
  return {
    pools: [...byId.values()],
    status: { gecko: ok ? (byId.size ? 'ok' : 'empty') : 'error' },
    updatedAt: Date.now(),
    chain,
  };
}

// ---------- dados de uma pool (Analisador) ----------
/**
 * Junta dados de uma pool específica:
 * GeckoTerminal (núcleo) → DEX nativa (taxa/APR) → DexScreener (reserva).
 */
export async function loadPoolDetail(address, network = 'solana') {
  const out = { id: address, network, warnings: [] };
  const geckoNet = await geckoNetworkId(network);
  const dsNet = (CHAINS[network] || {}).ds || network;

  // 1) GeckoTerminal
  try {
    const json = await getJSON(ENDPOINTS.geckoPool(geckoNet, address), { ttl: 2 * 60 * 1000 });
    const tokens = geckoTokenMap(json);
    const item = json.data;
    const at = item.attributes || {};
    const rel = item.relationships || {};
    const base = tokens[rel.base_token?.data?.id] || {};
    const quote = tokens[rel.quote_token?.data?.id] || {};
    Object.assign(out, {
      name: at.name,
      dex: rel.dex?.data?.id || '',
      baseSymbol: base.symbol || String(at.name || '').split(' / ')[0],
      quoteSymbol: quote.symbol || String(at.name || '').split(' / ')[1]?.replace(/\s+\d.*$/, ''),
      basePriceUsd: num(at.base_token_price_usd),
      quotePriceUsd: num(at.quote_token_price_usd),
      basePriceInQuote: num(at.base_token_price_quote_token),
      tvl: num(at.reserve_in_usd),
      vol24h: num(at.volume_usd?.h24),
      priceChange24h: num(at.price_change_percentage?.h24),
      ageDays: ageFromDate(at.pool_created_at),
      feePct: feeFromName(at.name),
      baseMcap: num(at.market_cap_usd) ?? num(at.fdv_usd),
      source: 'gecko',
    });
  } catch (e) {
    out.warnings.push('gecko');
  }

  // 2) DexScreener como reserva
  if (!out.source) {
    try {
      const json = await getJSON(ENDPOINTS.dexscreenerPair(dsNet, address), { ttl: 2 * 60 * 1000 });
      const p = json.pair || (json.pairs && json.pairs[0]);
      if (!p) throw new Error('not found');
      Object.assign(out, {
        name: `${p.baseToken?.symbol} / ${p.quoteToken?.symbol}`,
        dex: p.dexId + (Array.isArray(p.labels) && p.labels.some((l) => /clmm|dlmm/i.test(l)) ? '-clmm' : ''),
        baseSymbol: p.baseToken?.symbol,
        quoteSymbol: p.quoteToken?.symbol,
        basePriceUsd: num(p.priceUsd),
        basePriceInQuote: num(p.priceNative),
        quotePriceUsd: num(p.priceUsd) && num(p.priceNative) ? num(p.priceUsd) / num(p.priceNative) : null,
        tvl: num(p.liquidity?.usd),
        vol24h: num(p.volume?.h24),
        priceChange24h: num(p.priceChange?.h24),
        ageDays: p.pairCreatedAt ? (Date.now() - p.pairCreatedAt) / 86400000 : null,
        baseMcap: num(p.marketCap) ?? num(p.fdv),
        source: 'dexscreener',
      });
    } catch {
      out.warnings.push('dexscreener');
    }
  }

  if (!out.source) throw new Error('POOL_NOT_FOUND');

  // 3) Dados nativos da DEX (taxa real e APR 7d)
  const fam = dexFamily(out.dex);
  if (network === 'solana' && fam === 'raydium') {
    try {
      const json = await getJSON(ENDPOINTS.raydiumIds(address), { ttl: 2 * 60 * 1000 });
      const p = (json.data || []).find(Boolean);
      if (p) {
        const n = normalizeRaydium(p);
        out.native = n;
        out.feePct = n.feePct ?? out.feePct;
        out.isClmm = n.isClmm;
        out.dex = n.dex;
        out.tvl = n.tvl ?? out.tvl;
        out.vol24h = n.vol24h ?? out.vol24h;
        out.vol7d = n.vol7d;
        out.apr24h = n.apr24h;
        out.apr7d = n.apr7d;
        out.ageDays = n.ageDays ?? out.ageDays;
      }
    } catch {
      out.warnings.push('raydium');
    }
  } else if (network === 'solana' && fam === 'meteora') {
    try {
      const p = await getJSON(ENDPOINTS.meteoraPair(address), { ttl: 2 * 60 * 1000 });
      if (p && p.address) {
        const n = normalizeMeteora(p);
        out.native = n;
        out.feePct = n.feePct ?? out.feePct;
        out.isClmm = true;
        out.tvl = n.tvl ?? out.tvl;
        out.vol24h = n.vol24h ?? out.vol24h;
        out.apr24h = n.apr24h;
      }
    } catch {
      out.warnings.push('meteora');
    }
  }

  if (out.isClmm === undefined) out.isClmm = /clmm|dlmm|whirlpool|orca|v3|v4|slipstream|concentrated/i.test(out.dex);

  // Taxa ainda desconhecida: não inventamos APR
  out.feeKnown = out.feePct !== null && out.feePct !== undefined;
  if (out.apr24h == null && out.feeKnown && out.tvl && out.vol24h != null) {
    out.apr24h = ((out.vol24h * (out.feePct / 100)) / out.tvl) * 365 * 100;
  }

  out.dexLabel = dexLabel(out.dex);
  out.url = poolLink({ dex: out.dex, id: address, isClmm: out.isClmm, chain: network });
  out.chartUrl = `https://www.geckoterminal.com/${geckoNet}/pools/${address}`;
  return out;
}

/** Preço histórico (7 dias, velas de 4h) no par: volátil em unidades do outro token. */
export async function loadPriceHistory(address, network, priceToken = 'base') {
  const net = await geckoNetworkId(network);
  const json = await getJSON(ENDPOINTS.geckoOhlcv(net, address, priceToken), { ttl: 10 * 60 * 1000 });
  const list = json?.data?.attributes?.ohlcv_list || [];
  // formato: [timestamp, open, high, low, close, volume] — vem do mais novo pro mais antigo
  return list
    .map((c) => ({ t: c[0] * 1000, high: num(c[2]), low: num(c[3]), close: num(c[4]) }))
    .filter((c) => c.close !== null)
    .sort((a, b) => a.t - b.t);
}
