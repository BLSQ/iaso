import path from 'node:path';

import {
    devHost,
    devOrigin,
    devPort,
    devProtocol,
    repoRoot,
    rollupInputs,
    usePolling,
} from './context';

export const serverConfig = () => ({
    host: '0.0.0.0' as const,
    port: devPort,
    strictPort: true,
    origin: devOrigin,
    warmup: {
        clientFiles: [rollupInputs.common, rollupInputs.iaso],
    },
    cors: true,
    headers: {
        'Access-Control-Allow-Origin': '*',
    },
    fs: {
        allow: [repoRoot, path.resolve(repoRoot, '../bluesquare-components')],
    },
    watch: usePolling
        ? {
              usePolling: true,
              interval: 1000,
              ignored: ['**/assets/frontend/**'],
          }
        : {
              ignored: ['**/assets/frontend/**'],
          },
    hmr: {
        host: devHost,
        clientPort: devPort,
        protocol: devProtocol === 'https' ? ('wss' as const) : ('ws' as const),
    },
});