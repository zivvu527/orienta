import assert from 'node:assert/strict';
import { mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {
  createExchangeRateService,
  type ExchangeRateProvider,
  type NormalizedProviderResult,
  type SupportedCurrency,
} from '../server/exchangeRates.ts';

const testRoot = path.resolve('.tmp-exchange-rate-tests');
mkdirSync(testRoot, { recursive: true });

function dataset(base: SupportedCurrency = 'CNY'): NormalizedProviderResult {
  const rates: Record<string, number> = {
    CNY: 1,
    USD: 0.14,
    EUR: 0.12,
    GBP: 0.1,
    JPY: 21,
    KRW: 195,
  };
  rates[base] = 1;
  return { rates, updatedAt: '2026-09-06T00:00:00Z' };
}

function succeeds(id: string, result = dataset()): ExchangeRateProvider {
  return { id, fetchRates: async () => result };
}

function fails(id: string): ExchangeRateProvider {
  return { id, fetchRates: async () => { throw new Error('simulated failure'); } };
}

function cachePath(name: string) {
  return path.join(testRoot, `${name}.json`);
}

test.after(() => rmSync(testRoot, { recursive: true, force: true }));

test('primary success is cached as a fresh result', async () => {
  let calls = 0;
  const primary: ExchangeRateProvider = { id: 'primary', fetchRates: async () => { calls += 1; return dataset(); } };
  const service = createExchangeRateService({ providers: [primary], cachePath: cachePath('primary'), now: () => 1_000_000 });
  assert.equal((await service.getRates('CNY')).cacheStatus, 'live');
  assert.equal((await service.getRates('CNY')).cacheStatus, 'fresh-cache');
  assert.equal(calls, 1);
});

test('primary failure advances to fallback 1', async () => {
  let thirdCalled = false;
  const third: ExchangeRateProvider = { id: 'fallback-2', fetchRates: async () => { thirdCalled = true; return dataset(); } };
  const service = createExchangeRateService({ providers: [fails('primary'), succeeds('fallback-1'), third], cachePath: cachePath('fallback-1') });
  assert.equal((await service.getRates('CNY')).rates.USD, 0.14);
  assert.equal(thirdCalled, false);
});

test('two failures advance to fallback 2', async () => {
  const service = createExchangeRateService({ providers: [fails('primary'), fails('fallback-1'), succeeds('fallback-2')], cachePath: cachePath('fallback-2') });
  assert.equal((await service.getRates('CNY')).cacheStatus, 'live');
});

test('a timed-out provider does not block its fallback', async () => {
  const hangs: ExchangeRateProvider = {
    id: 'timeout',
    fetchRates: (_base, signal) => new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true })),
  };
  const service = createExchangeRateService({ providers: [hangs, succeeds('fallback')], cachePath: cachePath('timeout'), providerTimeoutMs: 5 });
  assert.equal((await service.getRates('CNY')).rates.JPY, 21);
});

test('all providers failing uses persisted stale last-known-good after restart', async () => {
  const savedPath = cachePath('restart');
  const first = createExchangeRateService({ providers: [succeeds('primary')], cachePath: savedPath, now: () => 1_000_000 });
  await first.getRates('CNY');
  const restarted = createExchangeRateService({ providers: [fails('primary'), fails('fallback-1'), fails('fallback-2')], cachePath: savedPath, now: () => 3_000_001 });
  const result = await restarted.getRates('CNY');
  assert.equal(result.cacheStatus, 'stale-cache');
  assert.equal(result.stale, true);
  assert.equal(result.fetchedAt, 1_000_000);
});

test('all providers failing without saved data returns a graceful service error', async () => {
  const service = createExchangeRateService({ providers: [fails('primary'), fails('fallback-1'), fails('fallback-2')], cachePath: cachePath('empty') });
  await assert.rejects(service.getRates('CNY'), /No validated exchange-rate dataset/);
});

test('malformed and anomalous datasets are rejected', async () => {
  const malformed = dataset();
  malformed.rates.USD = 0;
  const service = createExchangeRateService({ providers: [succeeds('malformed', malformed), succeeds('fallback')], cachePath: cachePath('malformed') });
  assert.equal((await service.getRates('CNY')).rates.USD, 0.14);
});

test('rates remain direct base-to-target multipliers', async () => {
  const service = createExchangeRateService({ providers: [succeeds('primary')], cachePath: cachePath('conversion') });
  const result = await service.getRates('CNY');
  assert.equal(result.rates.CNY, 1);
  assert.ok(Math.abs((100 * result.rates.USD) - 14) < 1e-12);
  assert.equal(100 * result.rates.JPY, 2100);
});
