import assert from 'node:assert/strict';
import { test } from 'node:test';
import versionCheckRoute from './version-check-route.js';

test('supported version → updateRequired false', async () => {
    const res = await versionCheckRoute.request('/?version=1.1.0');
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { updateRequired: false });
});

test('version equal to minimum → updateRequired false', async () => {
    const res = await versionCheckRoute.request('/?version=1.0.0');
    assert.deepEqual(await res.json(), { updateRequired: false });
});

test('version below minimum → updateRequired true', async () => {
    const res = await versionCheckRoute.request('/?version=0.9.9');
    assert.deepEqual(await res.json(), { updateRequired: true });
});

test('unparseable version → fail open, updateRequired false', async () => {
    const res = await versionCheckRoute.request('/?version=banana');
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { updateRequired: false });
});

test('missing version param → 400', async () => {
    const res = await versionCheckRoute.request('/');
    assert.equal(res.status, 400);
});
