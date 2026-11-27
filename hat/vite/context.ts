import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import dotenv from 'dotenv';

import {
    generateCombinedConfig,
    generateCombinedTranslations,
    generateLanguageConfigs,
    generatePluginKeysFile,
} from '../assets/js/apps/Iaso/bundle/generators.js';

export const LOCALE = 'en';
export const PDF_WORKER_FILE_NAME = 'iaso-pdf.worker.min.mjs';
export const DEV_STATS_FILE = 'bundle-stats.json';
export const PROD_STATS_FILE = 'bundle-stats-prod.json';

export const bluesquareComponentsLiveSrc = /bluesquare-components\/src\//;

const hatDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
export const repoRoot = path.resolve(hatDir, '..');

dotenv.config({ path: path.resolve(repoRoot, '.env') });

export { hatDir };

export const repoNodeModules = path.resolve(repoRoot, 'node_modules');

export const pdfjsDistDir = fs.existsSync(
    path.join(repoNodeModules, 'pdfjs-dist/package.json'),
)
    ? path.join(repoNodeModules, 'pdfjs-dist')
    : path.join(repoNodeModules, 'react-pdf/node_modules/pdfjs-dist');

export const pdfWorkerSourcePath = path.join(
    pdfjsDistDir,
    'build/pdf.worker.min.mjs',
);

export const outDir =
    process.env.VITE_OUT_DIR || path.resolve(hatDir, 'assets/frontend');

export const devPort = Number(process.env.VITE_PORT || 3000);
export const devProtocol = process.env.VITE_PROTOCOL || 'http';
export const devHost = process.env.VITE_HOST || 'localhost';
export const devOrigin = `${devProtocol}://${devHost}:${devPort}`;

export const liveComponents = process.env.LIVE_COMPONENTS === 'true';
export const usePolling = process.env.VITE_POLL === 'true';

export const entryPoints = {
    common: path.resolve(hatDir, 'vite-common-entry.js'),
    iaso: path.resolve(hatDir, 'assets/js/apps/Iaso/index.tsx'),
    superset: path.resolve(hatDir, 'assets/js/supersetSDK.tsx'),
} as const;

export const rollupInputs = {
    common: 'vite-common-entry.js',
    iaso: 'assets/js/apps/Iaso/index.tsx',
    superset: 'assets/js/supersetSDK.tsx',
} as const;

export const manifestEntryKeys: Record<keyof typeof entryPoints, string> = {
    common: rollupInputs.common,
    iaso: rollupInputs.iaso,
    superset: rollupInputs.superset,
};

export const iasoModuleAliases = {
    combinedTranslationsPath: generateCombinedTranslations(hatDir),
    combinedConfigPath: generateCombinedConfig(hatDir),
    pluginKeysPath: generatePluginKeysFile(hatDir),
    languageConfigsPath: generateLanguageConfigs(hatDir),
};