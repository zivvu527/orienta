const DEFAULT_TIMEOUT_MS = 10_000;
const SUPPORTED_CURRENCIES = ['CNY', 'USD', 'EUR', 'GBP', 'JPY', 'KRW'] as const;
type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

type ExchangeRatesResult = {
  base: SupportedCurrency;
  rates: Record<string, number>;
  updatedAt: string;
  fetchedAt: number;
  provider: string;
};

let cachedRates: ExchangeRatesResult | null = null;

export async function getExchangeRates(base: string) {
  const normalizedBase = normalizeCurrency(base);

  if (cachedRates && cachedRates.base === normalizedBase && Date.now() - cachedRates.fetchedAt < 30 * 60 * 1000) {
    return cachedRates;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    cachedRates = await getLiveRates(normalizedBase, controller.signal);

    return cachedRates;
  } finally {
    clearTimeout(timeout);
  }
}

async function getLiveRates(base: SupportedCurrency, signal: AbortSignal): Promise<ExchangeRatesResult> {
  const providers = [
    () => getFrankfurterRates(base, signal),
    () => getOpenExchangeRates(base, signal),
    () => getExchangeRateApiRates(base, signal),
  ];

  const errors: string[] = [];
  for (const provider of providers) {
    try {
      return await provider();
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown exchange rate error.');
    }
  }

  throw new Error(`Live exchange rates unavailable. ${errors.join(' ')}`);
}

async function getFrankfurterRates(base: SupportedCurrency, signal: AbortSignal): Promise<ExchangeRatesResult> {
  const symbols = SUPPORTED_CURRENCIES.filter((currency) => currency !== base).join(',');
  const url = `https://api.frankfurter.app/latest?from=${base}&to=${symbols}`;
  const response = await fetch(url, { signal });
  const body = await response.json().catch(() => null) as unknown;

  if (!response.ok || !isExchangeRateProviderBody(body)) {
    throw new Error('Frankfurter returned an invalid exchange-rate response.');
  }

  return {
    base,
    rates: normalizeRates(base, body.rates),
    updatedAt: body.date,
    fetchedAt: Date.now(),
    provider: 'frankfurter',
  };
}

async function getOpenExchangeRates(base: SupportedCurrency, signal: AbortSignal): Promise<ExchangeRatesResult> {
  const url = `https://open.er-api.com/v6/latest/${base}`;
  const response = await fetch(url, { signal });
  const body = await response.json().catch(() => null) as unknown;

  if (!response.ok || !isOpenExchangeRatesBody(body)) {
    throw new Error('Open ER API returned an invalid exchange-rate response.');
  }

  return {
    base,
    rates: normalizeRates(base, body.rates),
    updatedAt: body.time_last_update_utc,
    fetchedAt: Date.now(),
    provider: 'open.er-api.com',
  };
}

async function getExchangeRateApiRates(base: SupportedCurrency, signal: AbortSignal): Promise<ExchangeRatesResult> {
  const url = `https://api.exchangerate-api.com/v4/latest/${base}`;
  const response = await fetch(url, { signal });
  const body = await response.json().catch(() => null) as unknown;

  if (!response.ok || !isExchangeRateApiBody(body)) {
    throw new Error('ExchangeRate API returned an invalid exchange-rate response.');
  }

  return {
    base,
    rates: normalizeRates(base, body.rates),
    updatedAt: body.date,
    fetchedAt: Date.now(),
    provider: 'api.exchangerate-api.com',
  };
}

function normalizeRates(base: SupportedCurrency, providerRates: Record<string, unknown>) {
  const rates: Record<string, number> = { [base]: 1 };

  for (const currency of SUPPORTED_CURRENCIES) {
    if (currency === base) continue;
    const value = providerRates[currency];
    if (typeof value === 'number' && Number.isFinite(value)) {
      rates[currency] = value;
    }
  }

  for (const currency of SUPPORTED_CURRENCIES) {
    if (typeof rates[currency] !== 'number') {
      throw new Error(`Live exchange rate missing ${currency}.`);
    }
  }

  return rates;
}

function isExchangeRateProviderBody(value: unknown): value is { date: string; rates: Record<string, unknown> } {
  if (!value || typeof value !== 'object') return false;
  const body = value as { date?: unknown; rates?: unknown };
  return typeof body.date === 'string'
    && Boolean(body.rates)
    && typeof body.rates === 'object';
}

function isOpenExchangeRatesBody(value: unknown): value is { time_last_update_utc: string; rates: Record<string, unknown> } {
  if (!value || typeof value !== 'object') return false;
  const body = value as { result?: unknown; time_last_update_utc?: unknown; rates?: unknown };
  return body.result === 'success'
    && typeof body.time_last_update_utc === 'string'
    && Boolean(body.rates)
    && typeof body.rates === 'object';
}

function isExchangeRateApiBody(value: unknown): value is { date: string; rates: Record<string, unknown> } {
  if (!value || typeof value !== 'object') return false;
  const body = value as { date?: unknown; rates?: unknown };
  return typeof body.date === 'string'
    && Boolean(body.rates)
    && typeof body.rates === 'object';
}

function normalizeCurrency(value: string): SupportedCurrency {
  const currency = value.toUpperCase();
  if (SUPPORTED_CURRENCIES.includes(currency as SupportedCurrency)) {
    return currency as SupportedCurrency;
  }

  return 'CNY';
}
