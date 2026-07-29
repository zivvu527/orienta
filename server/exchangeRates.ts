const DEFAULT_TIMEOUT_MS = Number(process.env.EXCHANGE_RATES_TIMEOUT_MS ?? 14_000);
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
  const timeoutMs = Number.isFinite(DEFAULT_TIMEOUT_MS) && DEFAULT_TIMEOUT_MS > 0 ? DEFAULT_TIMEOUT_MS : 14_000;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    cachedRates = await getLiveRates(normalizedBase, controller.signal);

    return cachedRates;
  } finally {
    clearTimeout(timeout);
  }
}

async function getLiveRates(base: SupportedCurrency, signal: AbortSignal): Promise<ExchangeRatesResult> {
  const providers = [
    () => getJsDelivrCurrencyRates(base, signal),
    () => getCurrencyApiPagesRates(base, signal),
    () => getFrankfurterRates(base, signal),
    () => getOpenExchangeRates(base, signal),
    () => getExchangeRateApiRates(base, signal),
    () => getFloatRates(base, signal),
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

async function getJsDelivrCurrencyRates(base: SupportedCurrency, signal: AbortSignal): Promise<ExchangeRatesResult> {
  const lowerBase = base.toLowerCase();
  const url = `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${lowerBase}.json`;
  const response = await fetch(url, { signal });
  const body = await response.json().catch(() => null) as unknown;

  if (!response.ok || !isLowercaseCurrencyApiBody(body, lowerBase)) {
    throw new Error('jsDelivr currency API returned an invalid exchange-rate response.');
  }

  return {
    base,
    rates: normalizeLowercaseRates(base, body[lowerBase]),
    updatedAt: body.date,
    fetchedAt: Date.now(),
    provider: 'jsdelivr-currency-api',
  };
}

async function getCurrencyApiPagesRates(base: SupportedCurrency, signal: AbortSignal): Promise<ExchangeRatesResult> {
  const lowerBase = base.toLowerCase();
  const url = `https://latest.currency-api.pages.dev/v1/currencies/${lowerBase}.json`;
  const response = await fetch(url, { signal });
  const body = await response.json().catch(() => null) as unknown;

  if (!response.ok || !isLowercaseCurrencyApiBody(body, lowerBase)) {
    throw new Error('currency-api pages returned an invalid exchange-rate response.');
  }

  return {
    base,
    rates: normalizeLowercaseRates(base, body[lowerBase]),
    updatedAt: body.date,
    fetchedAt: Date.now(),
    provider: 'currency-api-pages',
  };
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

async function getFloatRates(base: SupportedCurrency, signal: AbortSignal): Promise<ExchangeRatesResult> {
  const url = `https://www.floatrates.com/daily/${base.toLowerCase()}.json`;
  const response = await fetch(url, { signal });
  const body = await response.json().catch(() => null) as unknown;

  if (!response.ok || !body || typeof body !== 'object') {
    throw new Error('FloatRates returned an invalid exchange-rate response.');
  }

  const providerRates: Record<string, number> = { [base]: 1 };
  const records = body as Record<string, { rate?: unknown; date?: unknown }>;
  let updatedAt = '';

  for (const currency of SUPPORTED_CURRENCIES) {
    if (currency === base) continue;
    const record = records[currency.toLowerCase()];
    if (typeof record?.rate === 'number' && Number.isFinite(record.rate)) {
      providerRates[currency] = record.rate;
      if (!updatedAt && typeof record.date === 'string') updatedAt = record.date;
    }
  }

  return {
    base,
    rates: normalizeRates(base, providerRates),
    updatedAt: updatedAt || new Date().toISOString(),
    fetchedAt: Date.now(),
    provider: 'floatrates',
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

function normalizeLowercaseRates(base: SupportedCurrency, providerRates: Record<string, unknown>) {
  const normalized: Record<string, unknown> = { [base]: 1 };
  for (const currency of SUPPORTED_CURRENCIES) {
    if (currency === base) continue;
    normalized[currency] = providerRates[currency.toLowerCase()];
  }

  return normalizeRates(base, normalized);
}

function isLowercaseCurrencyApiBody(
  value: unknown,
  base: string,
): value is { date: string } & Record<string, Record<string, unknown>> {
  if (!value || typeof value !== 'object') return false;
  const body = value as Record<string, unknown>;
  return typeof body.date === 'string'
    && Boolean(body[base])
    && typeof body[base] === 'object';
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
