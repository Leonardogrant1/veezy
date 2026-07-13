import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getCached, getStale, setCached } from './ttl-cache.js';

test('returns cached value within TTL', () => {
    setCached('a', { v: 1 }, 10_000);
    assert.deepEqual(getCached('a'), { v: 1 });
});

test('returns null after TTL expiry', () => {
    setCached('b', { v: 2 }, -1);
    assert.equal(getCached('b'), null);
});

test('getStale returns expired entries', () => {
    setCached('c', { v: 3 }, -1);
    assert.deepEqual(getStale('c'), { v: 3 });
});

test('getStale returns null for unknown keys', () => {
    assert.equal(getStale('unknown'), null);
});
