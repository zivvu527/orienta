const DEFAULT_TIMEOUT_MS = 10_000;
const SUPPORTED_CURRENCIES = ['CNY', 'USD', 'EUR', 'GBP', 'JPY', 'KRW'] as const;
type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

let cachedRates: { base: SupportedCurrency; rates: Record<string, number>; updatedAt: string; fetchedAt: number } | null = null;

export async function getExchangeRates(base: string) {
  const normalizedBase = normalizeCurrency(base);

  if (cachedRates && cachedRates.base === normalizedBase && Date.now() - cachedRates.fetchedAt < 30 * 60 * 1000) {
    return cachedRates;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const symbols = SUPPORTED_CURRENCIES.filter((currency) => currency !== normalizedBase).join(',');
    const url = `https://api.frankfurter.app/latest?from=${normalizedBase}&to=${symbols}`;
    const response = await fetch(url, { signal: controller.signal });
    const body = await response.json().catch(() => null) as unknown;

    if (!response.ok || !isExchangeRateProviderBody(body)) {
      throw new Error('Exchange rate provider returned an invalid response.');
    }

    const rates: Record<string, number> = { [normalizedBase]: 1 };
    for (const currency of SUPPORTED_CURRENCIES) {
      if (currency === normalizedBase) continue;
      const value = body.rates[currency];
      if (typeof value === 'number' && Number.isFinite(value)) {
        rates[currency] = value;
      }
    }

    cachedRates = {
      base: normalizedBase,
      rates,
      updatedAt: body.date,
      fetchedAt: Date.now(),
    };

    return cachedRates;
  } finally {
    clearTimeout(timeout);
  }
}

function isExchangeRateProviderBody(value: unknown): value is { date: string; rates: Record<string, unknown> } {
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
