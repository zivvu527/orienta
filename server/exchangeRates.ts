import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const SUPPORTED_CURRENCIES = ['CNY', 'USD', 'EUR', 'GBP', 'JPY', 'KRW'] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];
const FRESH_CACHE_TTL_MS = 30 * 60 * 1000;
const DEFAULT_PROVIDER_TIMEOUT_MS = 5_000;
const MAX_REASONABLE_RATE = 1_000_000;

export type ExchangeRateCacheStatus = 'live' | 'fresh-cache' | 'stale-cache';
export type ExchangeRatesResult = {
  base: SupportedCurrency;
  rates: Record<string, number>;
  updatedAt: string;
  fetchedAt: number;
  cacheStatus: ExchangeRateCacheStatus;
  stale: boolean;
};

type StoredExchangeRates = Omit<ExchangeRatesResult, 'cacheStatus' | 'stale'> & { provider: string };
export type NormalizedProviderResult = { rates: Record<string, number>; updatedAt: string };
export type ExchangeRateProvider = {
  id: string;
  fetchRates: (base: SupportedCurrency, signal: AbortSignal) => Promise<NormalizedProviderResult>;
};
type PersistedCache = { version: 1; entries: Partial<Record<SupportedCurrency, StoredExchangeRates>> };
type ExchangeRateServiceOptions = {
  providers?: ExchangeRateProvider[];
  cachePath?: string;
  providerTimeoutMs?: number;
  freshCacheTtlMs?: number;
  now?: () => number;
};

// CURRENTLY CONFIGURED only. Final order requires testing from the China production server.
const configuredProviders: ExchangeRateProvider[] = [
  { id: 'jsdelivr-currency-api', fetchRates: getJsDelivrCurrencyRates },
  { id: 'frankfurter', fetchRates: getFrankfurterRates },
  { id: 'open-er-api', fetchRates: getOpenErApiRates },
];

export function createExchangeRateService(options: ExchangeRateServiceOptions = {}) {
  const providers = options.providers ?? configuredProviders;
  const now = options.now ?? Date.now;
  const providerTimeoutMs = positiveNumber(options.providerTimeoutMs)
    ?? positiveNumber(Number(process.env.EXCHANGE_RATE_PROVIDER_TIMEOUT_MS))
    ?? DEFAULT_PROVIDER_TIMEOUT_MS;
  const freshCacheTtlMs = positiveNumber(options.freshCacheTtlMs) ?? FRESH_CACHE_TTL_MS;
  const cachePath = options.cachePath
    ?? process.env.EXCHANGE_RATE_CACHE_PATH
    ?? path.resolve(process.cwd(), 'server', 'data', 'exchange-rates-cache.json');
  const cache = loadPersistedCache(cachePath);

  async function getRates(base: string): Promise<ExchangeRatesResult> {
    const normalizedBase = normalizeCurrency(base);
    const saved = cache.entries[normalizedBase];
    if (saved && now() - saved.fetchedAt < freshCacheTtlMs) {
      return toPublicResult(saved, 'fresh-cache');
    }

    for (const provider of providers) {
      try {
        const normalized = await runWithTimeout(provider, normalizedBase, providerTimeoutMs);
        const stored: StoredExchangeRates = {
          base: normalizedBase,
          rates: validateRates(normalizedBase, normalized.rates),
          updatedAt: validateUpdatedAt(normalized.updatedAt),
          fetchedAt: now(),
          provider: provider.id,
        };
        cache.entries[normalizedBase] = stored;
        persistCache(cachePath, cache);
        return toPublicResult(stored, 'live');
      } catch (error) {
        const reason = error instanceof Error ? error.message : 'unknown error';
        console.warn(`[exchange-rates:${provider.id}] ${reason}`);
      }
    }

    const lastKnownGood = cache.entries[normalizedBase];
    if (lastKnownGood) return toPublicResult(lastKnownGood, 'stale-cache');
    throw new Error('No validated exchange-rate dataset is currently available.');
  }

  return { getRates };
}

const defaultService = createExchangeRateService();
export function getExchangeRates(base: string) { return defaultService.getRates(base); }

async function runWithTimeout(provider: ExchangeRateProvider, base: SupportedCurrency, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await provider.fetchRates(base, controller.signal);
  } catch (error) {
    if (controller.signal.aborted) throw new Error(`timed out after ${timeoutMs}ms`);
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function getJsDelivrCurrencyRates(base: SupportedCurrency, signal: AbortSignal) {
  const lowerBase = base.toLowerCase();
  const response = await fetch(`https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${lowerBase}.json`, { signal });
  const body = await parseJson(response, 'jsDelivr currency API');
  if (!isLowercaseCurrencyApiBody(body, lowerBase)) throw new Error('returned an invalid response schema');
  return { rates: normalizeLowercaseRates(base, body[lowerBase]), updatedAt: body.date };
}

async function getFrankfurterRates(base: SupportedCurrency, signal: AbortSignal) {
  const symbols = SUPPORTED_CURRENCIES.filter((currency) => currency !== base).join(',');
  const response = await fetch(`https://api.frankfurter.app/latest?from=${base}&to=${symbols}`, { signal });
  const body = await parseJson(response, 'Frankfurter');
  if (!isStandardRatesBody(body)) throw new Error('returned an invalid response schema');
  return { rates: normalizeRates(base, body.rates), updatedAt: body.date };
}

async function getOpenErApiRates(base: SupportedCurrency, signal: AbortSignal) {
  const response = await fetch(`https://open.er-api.com/v6/latest/${base}`, { signal });
  const body = await parseJson(response, 'Open ER API');
  if (!isOpenErApiBody(body)) throw new Error('returned an invalid response schema');
  return { rates: normalizeRates(base, body.rates), updatedAt: body.time_last_update_utc };
}

async function parseJson(response: Response, label: string): Promise<unknown> {
  if (!response.ok) throw new Error(`${label} returned HTTP ${response.status}`);
  try { return await response.json(); } catch { throw new Error(`${label} returned invalid JSON`); }
}

function normalizeRates(base: SupportedCurrency, providerRates: Record<string, unknown>) {
  const rates: Record<string, number> = { [base]: 1 };
  for (const currency of SUPPORTED_CURRENCIES) {
    if (currency !== base) {
      const value = providerRates[currency];
      rates[currency] = typeof value === 'number' ? value : Number.NaN;
    }
  }
  return validateRates(base, rates);
}

function normalizeLowercaseRates(base: SupportedCurrency, providerRates: Record<string, unknown>) {
  const rates: Record<string, unknown> = { [base]: 1 };
  for (const currency of SUPPORTED_CURRENCIES) {
    if (currency !== base) rates[currency] = providerRates[currency.toLowerCase()];
  }
  return normalizeRates(base, rates);
}

function validateRates(base: SupportedCurrency, candidate: Record<string, unknown>) {
  const rates: Record<string, number> = {};
  for (const currency of SUPPORTED_CURRENCIES) {
    const value = candidate[currency];
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0 || value > MAX_REASONABLE_RATE) {
      throw new Error(`missing or invalid ${currency} rate`);
    }
    rates[currency] = value;
  }
  if (Math.abs(rates[base] - 1) > Number.EPSILON) throw new Error('base currency was not normalized to 1');
  return rates;
}

function validateUpdatedAt(value: string) {
  if (!value || !Number.isFinite(Date.parse(value))) throw new Error('missing or invalid source update time');
  return value;
}

function toPublicResult(stored: StoredExchangeRates, cacheStatus: ExchangeRateCacheStatus): ExchangeRatesResult {
  return {
    base: stored.base,
    rates: { ...stored.rates },
    updatedAt: stored.updatedAt,
    fetchedAt: stored.fetchedAt,
    cacheStatus,
    stale: cacheStatus === 'stale-cache',
  };
}

function loadPersistedCache(cachePath: string): PersistedCache {
  try {
    const parsed = JSON.parse(readFileSync(cachePath, 'utf8')) as unknown;
    if (!parsed || typeof parsed !== 'object' || (parsed as { version?: unknown }).version !== 1) throw new Error('unsupported cache format');
    const rawEntries = (parsed as { entries?: unknown }).entries;
    if (!rawEntries || typeof rawEntries !== 'object') throw new Error('missing cache entries');
    const entries: PersistedCache['entries'] = {};
    for (const currency of SUPPORTED_CURRENCIES) {
      const entry = (rawEntries as Record<string, unknown>)[currency];
      if (!entry) continue;
      try { entries[currency] = validateStoredEntry(currency, entry); }
      catch { console.warn(`[exchange-rates:cache-read] Ignored invalid ${currency} entry.`); }
    }
    return { version: 1, entries };
  } catch (error) {
    const code = error && typeof error === 'object' && 'code' in error ? error.code : undefined;
    if (code !== 'ENOENT') console.warn('[exchange-rates:cache-read] Persisted cache could not be loaded.');
    return { version: 1, entries: {} };
  }
}

function validateStoredEntry(base: SupportedCurrency, value: unknown): StoredExchangeRates {
  if (!value || typeof value !== 'object') throw new Error('invalid cache entry');
  const entry = value as Record<string, unknown>;
  if (entry.base !== base || typeof entry.provider !== 'string' || !entry.provider) throw new Error('invalid cache identity');
  if (typeof entry.fetchedAt !== 'number' || !Number.isFinite(entry.fetchedAt) || entry.fetchedAt <= 0) throw new Error('invalid cache fetch time');
  if (!entry.rates || typeof entry.rates !== 'object') throw new Error('invalid cache rates');
  return {
    base,
    rates: validateRates(base, entry.rates as Record<string, unknown>),
    updatedAt: validateUpdatedAt(String(entry.updatedAt ?? '')),
    fetchedAt: entry.fetchedAt,
    provider: entry.provider,
  };
}

function persistCache(cachePath: string, cache: PersistedCache) {
  const temporaryPath = `${cachePath}.${process.pid}.tmp`;
  try {
    mkdirSync(path.dirname(cachePath), { recursive: true });
    writeFileSync(temporaryPath, JSON.stringify(cache), { encoding: 'utf8', mode: 0o600 });
    renameSync(temporaryPath, cachePath);
  } catch {
    try { rmSync(temporaryPath, { force: true }); } catch { /* best-effort cleanup */ }
    console.warn('[exchange-rates:cache-write] Last-known-good cache could not be persisted.');
  }
}

function isLowercaseCurrencyApiBody(value: unknown, base: string): value is { date: string } & Record<string, Record<string, unknown>> {
  if (!value || typeof value !== 'object') return false;
  const body = value as Record<string, unknown>;
  return typeof body.date === 'string' && Boolean(body[base]) && typeof body[base] === 'object';
}
function isStandardRatesBody(value: unknown): value is { date: string; rates: Record<string, unknown> } {
  if (!value || typeof value !== 'object') return false;
  const body = value as { date?: unknown; rates?: unknown };
  return typeof body.date === 'string' && Boolean(body.rates) && typeof body.rates === 'object';
}
function isOpenErApiBody(value: unknown): value is { time_last_update_utc: string; rates: Record<string, unknown> } {
  if (!value || typeof value !== 'object') return false;
  const body = value as { result?: unknown; time_last_update_utc?: unknown; rates?: unknown };
  return body.result === 'success' && typeof body.time_last_update_utc === 'string' && Boolean(body.rates) && typeof body.rates === 'object';
}
function normalizeCurrency(value: string): SupportedCurrency {
  const currency = value.toUpperCase();
  return SUPPORTED_CURRENCIES.includes(currency as SupportedCurrency) ? currency as SupportedCurrency : 'CNY';
}
function positiveNumber(value: number | undefined) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined;
}
