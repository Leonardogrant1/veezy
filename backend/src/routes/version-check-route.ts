import { Hono } from 'hono';
import { MIN_SUPPORTED_VERSION } from '../config/version-config.js';

function parseSemver(v: string): [number, number, number] | null {
    const parts = v.split('.').map(Number);
    if (parts.length !== 3 || parts.some((n) => isNaN(n))) return null;
    return [parts[0], parts[1], parts[2]];
}

function isVersionSupported(version: string): boolean {
    const app = parseSemver(version);
    const min = parseSemver(MIN_SUPPORTED_VERSION);
    // Bei Parse-Fehler: fail open — App nicht sperren
    if (!app || !min) return true;
    if (app[0] !== min[0]) return app[0] > min[0];
    if (app[1] !== min[1]) return app[1] > min[1];
    return app[2] >= min[2];
}

const versionCheckRoute = new Hono();

versionCheckRoute.get('/', (c) => {
    const version = c.req.query('version');
    if (!version) return c.json({ error: 'version query param required' }, 400);
    return c.json({ updateRequired: !isVersionSupported(version) });
});

export default versionCheckRoute;
