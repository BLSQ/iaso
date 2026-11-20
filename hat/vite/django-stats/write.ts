import fs from 'node:fs';
import path from 'node:path';

import type { StatsAsset, ViteManifestChunk } from './types';

export const assetRecord = (
    fileName: string,
    filePath: string,
    publicBase?: string,
): StatsAsset => {
    const record: StatsAsset = {
        name: fileName,
        path: filePath,
    };
    if (publicBase) {
        const base = publicBase.endsWith('/') ? publicBase : `${publicBase}/`;
        record.publicPath = `${base}${fileName}`;
    }
    return record;
};

export const writeDjangoStats = (
    statsFile: string,
    chunks: Record<string, string[]>,
    assets: Record<string, StatsAsset>,
    publicPath = '',
) => {
    fs.mkdirSync(path.dirname(statsFile), { recursive: true });
    fs.writeFileSync(
        statsFile,
        JSON.stringify({
            status: 'done',
            publicPath,
            chunks,
            assets,
        }),
    );
};

export const collectManifestCss = (
    manifest: Record<string, ViteManifestChunk>,
    entryKey: string,
    seen = new Set<string>(),
): string[] => {
    if (seen.has(entryKey)) return [];
    seen.add(entryKey);
    const chunk = manifest[entryKey];
    if (!chunk) return [];
    const css = chunk.css ?? [];
    const childKeys = [
        ...(chunk.imports ?? []),
        ...(chunk.dynamicImports ?? []),
    ];
    const nested = childKeys.flatMap(importKey =>
        collectManifestCss(manifest, importKey, seen),
    );
    return [...css, ...nested];
};