import path from 'node:path';

import type { Plugin } from 'vite';

import {
    DEV_STATS_FILE,
    devOrigin,
    entryPoints,
    outDir,
    rollupInputs,
} from '../context';
import { writeDjangoStats } from '../django-stats/write';
import type { StatsAsset } from '../django-stats/types';

export const djangoDevStats = (): Plugin => ({
    name: 'django-bundle-stats-dev',
    apply: 'serve',
    configureServer(server) {
        const write = () => {
            const origin = devOrigin.replace(/\/$/, '');
            const specs = [
                {
                    chunk: 'common',
                    files: [
                        {
                            name: '@vite/client.js',
                            publicPath: `${origin}/@vite/client`,
                            path: '',
                        },
                        {
                            name: 'common.js',
                            publicPath: `${origin}/${rollupInputs.common}`,
                            path: entryPoints.common,
                        },
                    ],
                },
                {
                    chunk: 'iaso',
                    files: [
                        {
                            name: 'iaso.js',
                            publicPath: `${origin}/${rollupInputs.iaso}`,
                            path: entryPoints.iaso,
                        },
                    ],
                },
                {
                    chunk: 'superset',
                    files: [
                        {
                            name: 'superset.js',
                            publicPath: `${origin}/${rollupInputs.superset}`,
                            path: entryPoints.superset,
                        },
                    ],
                },
            ];
            const chunks: Record<string, string[]> = {};
            const assets: Record<string, StatsAsset> = {};
            for (const spec of specs) {
                chunks[spec.chunk] = spec.files.map(file => file.name);
                for (const file of spec.files) {
                    assets[file.name] = file;
                }
            }
            writeDjangoStats(
                path.join(outDir, DEV_STATS_FILE),
                chunks,
                assets,
                `${origin}/`,
            );
        };
        write();
        server.httpServer?.once('listening', write);
    },
});