// =====================================================
// SignalDegen — Classificação de pools e cálculo de ranges
// Lógica pura (sem DOM), fácil de testar.
// =====================================================

import { isSolid, isStable } from './sources.js';

export const RULES = {
  minTvl: 100_000,
  minVol24h: 50_000,
  hot: { minTurnover: 1.0, volSpike: 1.5, limit: 12 },
  moderate: { minTvl: 1_000_000, minTurnover: 0.1, maxTurnover: 1.0, minAgeDays: 30, aprStability: 0.4, limit: 12 },
  aprAnomaly: 1000,
};

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export const turnover = (p) => (p.tvl ? p.vol24h / p.tvl : 0);

/** Pool passa no filtro mínimo de qualidade? */
export function isEligible(p) {
  return (
    p.tvl !== null && p.vol24h !== null &&
    p.tvl >= RULES.minTvl && p.vol24h >= RULES.minVol24h
  );
}

/** Volume de hoje bem acima da média diária dos últimos 7 dias */
export function hasVolumeSpike(p) {
  if (p.vol7d === null || !p.vol7d) return null; // sem dado de 7d
  return p.vol24h >= RULES.hot.volSpike * (p.vol7d / 7);
}

export function isHot(p) {
  if (!isEligible(p)) return false;
  if (turnover(p) < RULES.hot.minTurnover) return false;
  const spike = hasVolumeSpike(p);
  // Sem histórico de 7d: aceita se estiver em alta no GeckoTerminal
  return spike === null ? p.trending || turnover(p) >= 2 : spike;
}

export function isAprStable(p) {
  if (p.apr7d === null || p.apr24h === null || !p.apr7d) return false;
  return Math.abs(p.apr24h - p.apr7d) / p.apr7d <= RULES.moderate.aprStability;
}

export function isModerate(p) {
  const r = RULES.moderate;
  if (!isEligible(p)) return false;
  if (p.tvl < r.minTvl) return false;
  const to = turnover(p);
  if (to < r.minTurnover || to > r.maxTurnover) return false;
  if (p.ageDays !== null && p.ageDays < r.minAgeDays) return false;
  if (!isAprStable(p)) return false;
  return isSolid(p.symbolA) || isSolid(p.symbolB);
}

/** Nota 0–100: rendimento (40) + liquidez (35) + estabilidade (25) */
export function scorePool(p) {
  const apr = p.apr7d ?? p.apr24h ?? 0;
  const yieldPts = clamp(apr / 200, 0, 1) * 40;
  const liqPts = p.tvl ? clamp(Math.log10(p.tvl / 1e5) / 2, 0, 1) * 35 : 0;
  let stabPts = 0.3 * 25;
  if (p.apr7d && p.apr24h !== null) {
    stabPts = clamp(1 - Math.abs(p.apr24h - p.apr7d) / Math.max(p.apr7d, 1), 0, 1) * 25;
  }
  return Math.round(yieldPts + liqPts + stabPts);
}

/** Nível de risco: 'extreme' | 'high' | 'medium' | 'low' */
export function riskLevel(p) {
  let pts = 0;
  if (p.tvl < 300_000) pts += 3;
  else if (p.tvl < 1_000_000) pts += 2;
  else if (p.tvl < 5_000_000) pts += 1;
  if (p.ageDays !== null && p.ageDays < 3) pts += 3;
  else if (p.ageDays !== null && p.ageDays < 30) pts += 1;
  if (turnover(p) > 3) pts += 2;
  else if (turnover(p) > 1) pts += 1;
  if (p.priceChange24h !== null && Math.abs(p.priceChange24h) > 30) pts += 2;
  else if (p.priceChange24h !== null && Math.abs(p.priceChange24h) > 10) pts += 1;
  if (!(isSolid(p.symbolA) || isSolid(p.symbolB))) pts += 2;
  if (isStable(p.symbolA) && isStable(p.symbolB)) pts = Math.max(0, pts - 3);
  if (pts >= 7) return 'extreme';
  if (pts >= 4) return 'high';
  if (pts >= 2) return 'medium';
  return 'low';
}

const sortBy = (key) => (a, b) => (b[key] ?? -1) - (a[key] ?? -1);

/** Separa as pools nas categorias do radar */
export function classify(pools) {
  const enrich = (p) => ({ ...p, score: scorePool(p), risk: riskLevel(p), turnover: turnover(p) });
  const hot = pools.filter(isHot).map(enrich).sort(sortBy('apr24h')).slice(0, RULES.hot.limit);
  const hotIds = new Set(hot.map((p) => p.id));
  const moderate = pools
    .filter((p) => !hotIds.has(p.id) && isModerate(p))
    .map(enrich)
    .sort(sortBy('apr7d'))
    .slice(0, RULES.moderate.limit);
  return {
    hot,
    moderate,
    eligible: pools.filter(isEligible).length,
    total: pools.length,
  };
}

// ---------- Estratégia e ranges (Analisador) ----------

/**
 * Estratégia pela composição do par:
 * - stable + volátil → 'progressive_buy' (entra em stable e acumula o volátil)
 * - stable + stable → 'stable_pair'
 * - volátil + volátil → 'balanced'
 */
export function detectStrategy(symA, symB) {
  const a = isStable(symA);
  const b = isStable(symB);
  if (a && b) return 'stable_pair';
  if (a || b) return 'progressive_buy';
  return 'balanced';
}

/** Larguras base (±%) e ajuste pela volatilidade de 24h */
export function rangeWidths(priceChange24h, strategy) {
  if (strategy === 'stable_pair') return { short: 0.1, moderate: 0.3, long: 1 };
  const vol = Math.min(Math.abs(priceChange24h || 0), 40);
  const f = 1 + vol / 40; // até 2x mais largo em dias muito voláteis
  return { short: +(3 * f).toFixed(1), moderate: +(7 * f).toFixed(1), long: +(18 * f).toFixed(1) };
}

export function buildRanges(center, widths) {
  const mk = (pct) => ({ pct, min: center * (1 - pct / 100), max: center * (1 + pct / 100) });
  return { short: mk(widths.short), moderate: mk(widths.moderate), long: mk(widths.long) };
}

/** % do tempo (velas) em que o preço fechou dentro do range */
export function timeInRange(history, min, max) {
  if (!history || !history.length) return null;
  const inside = history.filter((c) => c.close >= min && c.close <= max).length;
  return (inside / history.length) * 100;
}

/** Onde o preço atual está em relação aos ranges */
export function pricePosition(price, ranges) {
  const inR = (r) => price >= r.min && price <= r.max;
  if (!inR(ranges.long)) return 'outside';
  if (!inR(ranges.moderate)) return 'long_only';
  if (!inR(ranges.short)) return 'moderate';
  return 'all';
}
