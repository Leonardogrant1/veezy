import { serve } from '@hono/node-server';
import 'dotenv/config';
import { Hono } from 'hono';
import { networkInterfaces } from 'os';
import selfReferenceRoute from './routes/self-reference-route.js';
import userDataRoute from './routes/user-data-route.js';
import visionRoute from './routes/vision-route.js';

const app = new Hono();

app.get('/health', (c) => c.json({ status: 'ok' }));

app.route('/vision', visionRoute);
app.route('/self-reference', selfReferenceRoute);
app.route('/user-data', userDataRoute);

const port = parseInt(process.env.PORT ?? '8080');

serve({ fetch: app.fetch, port }, () => {
    const nets = networkInterfaces();
    const localIp = Object.values(nets)
        .flat()
        .find((n) => n && n.family === 'IPv4' && !n.internal)?.address ?? 'localhost';

    console.log(`Server running on:`);
    console.log(`  Local:   http://localhost:${port}`);
    console.log(`  Network: http://${localIp}:${port}`);
});
