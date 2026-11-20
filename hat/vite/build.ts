import { entryPoints, outDir } from './context';

export const buildConfig = (isProd: boolean) => ({
    outDir,
    emptyOutDir: true,
    manifest: true,
    sourcemap: true,
    minify: isProd,
    cssCodeSplit: true,
    modulePreload: false,
    target:
        (process.env.OLD_BROWSER === 'true' ? 'chrome55' : 'es2020') as
            | 'chrome55'
            | 'es2020',
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
});