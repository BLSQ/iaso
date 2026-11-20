import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';
import * as esbuild from 'esbuild';
import { defineConfig } from 'vite';
import type { Plugin } from 'vite';

import {
    generateCombinedConfig,
    generateCombinedTranslations,
    generateLanguageConfigs,
    generatePluginKeysFile,
} from './assets/js/apps/Iaso/bundle/generators.js';

const hatDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(hatDir, '..');

// Repo-root `.env` for Node-side config (ports, LIVE_COMPONENTS, Orval, …).
// `envDir` below exposes only `VITE_*` to client code via `import.meta.env`.
dotenv.config({ path: path.resolve(repoRoot, '.env') });
const repoNodeModules = path.resolve(repoRoot, 'node_modules');
const pdfjsDistDir = fs.existsSync(
    path.join(repoNodeModules, 'pdfjs-dist/package.json'),
)
    ? path.join(repoNodeModules, 'pdfjs-dist')
    : path.join(repoNodeModules, 'react-pdf/node_modules/pdfjs-dist');
const pdfWorkerFileName = 'iaso-pdf.worker.min.mjs';
const pdfWorkerSourcePath = path.join(
    pdfjsDistDir,
    'build/pdf.worker.min.mjs',
);

const LOCALE = 'en';

const devPort = Number(process.env.VITE_PORT || 3000);
const devProtocol = process.env.VITE_PROTOCOL || 'http';
const devHost = process.env.VITE_HOST || 'localhost';
const devOrigin = `${devProtocol}://${devHost}:${devPort}`;

const outDir = process.env.VITE_OUT_DIR || path.resolve(hatDir, 'assets/frontend');
const liveComponents = process.env.LIVE_COMPONENTS === 'true';
const bluesquareComponentsLiveSrc = /bluesquare-components\/src\//;

/** Pre-compile bluesquare-components source when LIVE_COMPONENTS aliases to ../src. */
const bluesquareLiveSrcPlugin = (): Plugin => ({
    name: 'iaso:bluesquare-live-src',
    enforce: 'pre',
    async transform(code, id) {
        if (process.env.LIVE_COMPONENTS !== 'true') {
            return;
        }
        const filePath = id.split('?')[0];
        if (!bluesquareComponentsLiveSrc.test(filePath)) {
            return;
        }
        const ext = path.extname(filePath);
        const loader: esbuild.Loader | undefined =
            ext === '.tsx' || ext === '.jsx'
                ? 'tsx'
                : ext === '.ts'
                  ? 'ts'
                  : ext === '.js'
                    ? 'jsx'
                    : undefined;
        if (!loader) {
            return;
        }
        const result = await esbuild.transform(code, {
            loader,
            format: 'esm',
            sourcemap: true,
            jsx: 'transform',
            jsxFactory: 'React.createElement',
            jsxFragment: 'React.Fragment',
            target: 'esnext',
            tsconfigRaw: {
                compilerOptions: { jsx: 'react' },
            },
        });
        return {
            code: result.code,
            map: result.map,
        };
    },
});
const usePolling = process.env.VITE_POLL === 'true';
const devStatsFile = 'bundle-stats.json';
const prodStatsFile = 'bundle-stats-prod.json';

const combinedTranslationsPath = generateCombinedTranslations(hatDir);
const combinedConfigPath = generateCombinedConfig(hatDir);
const pluginKeysPath = generatePluginKeysFile(hatDir);
const languageConfigsPath = generateLanguageConfigs(hatDir);

const entryPoints = {
    common: path.resolve(hatDir, 'vite-common-entry.js'),
    iaso: path.resolve(hatDir, 'assets/js/apps/Iaso/index.tsx'),
    superset: path.resolve(hatDir, 'assets/js/supersetSDK.tsx'),
} as const;

type StatsAsset = {
    name: string;
    path: string;
    publicPath?: string;
};

const assetRecord = (
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

const writeDjangoStats = (
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

type ViteManifestChunk = {
    file: string;
    css?: string[];
    imports?: string[];
    dynamicImports?: string[];
    isEntry?: boolean;
};

const rollupInputs = {
    common: 'vite-common-entry.js',
    iaso: 'assets/js/apps/Iaso/index.tsx',
    superset: 'assets/js/supersetSDK.tsx',
} as const;

const manifestEntryKeys: Record<keyof typeof entryPoints, string> = {
    common: rollupInputs.common,
    iaso: rollupInputs.iaso,
    superset: rollupInputs.superset,
};

const collectManifestCss = (
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

const djangoBuildStats = (statsFile: string): Plugin => ({
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

/** Serve/copy pdf.js worker at a stable URL (react-pdf default path breaks under Vite). */
const pdfWorkerPlugin = (): Plugin => ({
    name: 'iaso:pdfjs-worker',
    configureServer(server) {
        server.middlewares.use((req, res, next) => {
            if (req.url?.split('?')[0] === `/${pdfWorkerFileName}`) {
                res.setHeader('Content-Type', 'application/javascript');
                fs.createReadStream(pdfWorkerSourcePath).pipe(res);
                return;
            }
            next();
        });
    },
    closeBundle() {
        fs.copyFileSync(
            pdfWorkerSourcePath,
            path.join(outDir, pdfWorkerFileName),
        );
    },
});

/** Pre-transform entries on server start (Vite runs optimizeDeps automatically during warmup). */
const devWarmupPlugin = (): Plugin => ({
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

const djangoDevStats = (): Plugin => ({
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
                path.join(outDir, devStatsFile),
                chunks,
                assets,
                `${origin}/`,
            );
        };
        write();
        server.httpServer?.once('listening', write);
    },
});

export default defineConfig(({ mode, command }) => {
    const isProd = mode === 'production';
    const statsFile = path.join(
        outDir,
        isProd ? prodStatsFile : devStatsFile,
    );

    return {
        // Django serves HTML; only bundle entry files are Vite inputs.
        root: hatDir,
        envDir: repoRoot,
        appType: 'custom',
        base: command === 'serve' ? '/' : './',
        publicDir: false,
        define: {
            __LOCALE: JSON.stringify(LOCALE),
            'process.env.ORVAL_API_BASE_URL': JSON.stringify(
                process.env.ORVAL_API_BASE_URL ?? '',
            ),
            ...(command === 'serve' && {
                'import.meta.env.VITE_PDF_WORKER_URL': JSON.stringify(
                    `${devOrigin}/${pdfWorkerFileName}`,
                ),
            }),
        },
        plugins: [
            ...(liveComponents ? [bluesquareLiveSrcPlugin()] : []),
            react({
                jsxRuntime: 'classic',
                ...(liveComponents && {
                    exclude: [/node_modules/, bluesquareComponentsLiveSrc],
                }),
                // Django serves HTML from another origin/port than the Vite dev server.
                ...(command === 'serve' && {
                    reactRefreshHost: devOrigin.replace(/\/$/, ''),
                }),
                babel: {
                    plugins: [
                        [
                            'formatjs',
                            isProd
                                ? {
                                      messagesDir: path.join(
                                          hatDir,
                                          'assets/messages',
                                      ),
                                  }
                                : {},
                        ],
                    ],
                },
            }),
            // IasoModules/* imports resolve via aliases (same as vitest).
            pdfWorkerPlugin(),
            djangoDevStats(),
            devWarmupPlugin(),
            djangoBuildStats(statsFile),
        ],
        resolve: {
            alias: {
                'react/jsx-runtime.js': 'react/jsx-runtime',
                'pdfjs-dist': pdfjsDistDir,
                Iaso: path.resolve(hatDir, 'assets/js/apps/Iaso'),
                'IasoModules/plugins/configs': combinedConfigPath,
                'IasoModules/plugins/keys': pluginKeysPath,
                'IasoModules/translations/configs': combinedTranslationsPath,
                'IasoModules/language/configs': languageConfigsPath,
                ...(liveComponents && {
                    'bluesquare-components': path.resolve(
                        repoRoot,
                        '../bluesquare-components/src/',
                    ),
                    react: path.resolve(repoNodeModules, 'react'),
                    'react-dom': path.resolve(repoNodeModules, 'react-dom'),
                    'react-router': path.resolve(repoNodeModules, 'react-router'),
                    'react-router-dom': path.resolve(
                        repoNodeModules,
                        'react-router-dom',
                    ),
                    'react-intl': path.resolve(repoNodeModules, 'react-intl'),
                    '@mui/material': path.resolve(repoNodeModules, '@mui/material'),
                    '@mui/styles': path.resolve(repoNodeModules, '@mui/styles'),
                    '@mui/x-date-pickers': path.resolve(
                        repoNodeModules,
                        '@mui/x-date-pickers',
                    ),
                    '@emotion/react': path.resolve(
                        repoNodeModules,
                        '@emotion/react',
                    ),
                    '@emotion/styled': path.resolve(
                        repoNodeModules,
                        '@emotion/styled',
                    ),
                    'react-query': path.resolve(repoNodeModules, 'react-query'),
                }),
            },
            dedupe: [
                'react',
                'react-dom',
                'react-router',
                'react-router-dom',
                'react-intl',
                '@mui/material',
            ],
            preserveSymlinks: false,
        },
        optimizeDeps: {
            // Do not crawl repo-wide *.html (Django templates, docs, emails, …).
            entries: Object.values(entryPoints),
            holdUntilCrawlEnd: true,
            include: [
                'react',
                'react-dom',
                'react-intl',
                '@mui/material',
                '@mui/lab',
                '@mui/x-date-pickers',
                'lodash',
                'moment',
                'leaflet',
                'leaflet-draw',
                'react-query',
                'formik',
                'react-pdf',
                'warning',
                ...(liveComponents ? [] : ['bluesquare-components']),
            ],
            ...(liveComponents ? { exclude: ['bluesquare-components'] } : {}),
        },
        server: {
            host: '0.0.0.0',
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
                protocol: devProtocol === 'https' ? 'wss' : 'ws',
            },
        },
        build: {
            outDir,
            emptyOutDir: true,
            manifest: true,
            sourcemap: true,
            minify: isProd,
            cssCodeSplit: true,
            modulePreload: false,
            target: process.env.OLD_BROWSER === 'true' ? 'chrome55' : 'es2020',
            chunkSizeWarningLimit: 4000,
            reportCompressedSize: false,
            rollupOptions: {
                input: {
                    common: entryPoints.common,
                    iaso: entryPoints.iaso,
                    superset: entryPoints.superset,
                },
                output: {
                    entryFileNames: isProd ? '[name]-[hash].js' : '[name].js',
                    chunkFileNames: isProd
                        ? 'chunks/[name]-[hash].js'
                        : 'chunks/[name].js',
                    assetFileNames: isProd
                        ? 'assets/[name]-[hash][extname]'
                        : 'assets/[name][extname]',
                },
            },
        },
    };
});
