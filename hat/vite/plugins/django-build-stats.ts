import fs from 'node:fs';
import path from 'node:path';

import type { Plugin } from 'vite';

import {
    entryPoints,
    manifestEntryKeys,
    outDir,
} from '../context';
import {
    assetRecord,
    collectManifestCss,
    writeDjangoStats,
} from '../django-stats/write';
import type { StatsAsset, ViteManifestChunk } from '../django-stats/types';

export const djangoBuildStats = (statsFile: string): Plugin => ({
    name: 'django-bundle-stats',
    apply: 'build',
    closeBundle() {
        const manifestPath = path.join(outDir, '.vite', 'manifest.json');
        if (!fs.existsSync(manifestPath)) {
            return;
        }
        const manifest = JSON.parse(
            fs.readFileSync(manifestPath, 'utf8'),
        ) as Record<string, ViteManifestChunk>;
        const chunks: Record<string, string[]> = {};
        const assets: Record<string, StatsAsset> = {};
        for (const entryName of Object.keys(entryPoints) as Array<
            keyof typeof entryPoints
        >) {
            const entryKey = manifestEntryKeys[entryName];
            const entryChunk = manifest[entryKey];
            const entryJs = entryChunk?.file ? [entryChunk.file] : [];
            const files = [
                ...new Set(
                    [
                        ...collectManifestCss(manifest, entryKey),
                        ...entryJs,
                    ].filter(fileName => !fileName.endsWith('.map')),
                ),
            ];
            if (!files.length) continue;
            chunks[entryName] = files;
            for (const fileName of files) {
                assets[fileName] = assetRecord(
                    fileName,
                    path.join(outDir, fileName),
                );
            }
        }
        writeDjangoStats(statsFile, chunks, assets);
    },
});