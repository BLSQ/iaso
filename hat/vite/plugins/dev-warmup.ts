import type { Plugin } from 'vite';

import { rollupInputs } from '../context';

/** Pre-transform entries on server start (Vite runs optimizeDeps automatically during warmup). */
export const devWarmupPlugin = (): Plugin => ({
    name: 'iaso-dev-warmup',
    apply: 'serve',
    configureServer(server) {
        server.httpServer?.once('listening', () => {
            void Promise.all([
                server.warmupRequest(`/${rollupInputs.common}`),
                server.warmupRequest(`/${rollupInputs.iaso}`),
            ]);
        });
    },
});