import path from 'node:path';

import * as esbuild from 'esbuild';
import type { Plugin } from 'vite';

import { bluesquareComponentsLiveSrc } from '../context';

/** Pre-compile bluesquare-components source when LIVE_COMPONENTS aliases to ../src. */
export const bluesquareLiveSrcPlugin = (): Plugin => ({
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