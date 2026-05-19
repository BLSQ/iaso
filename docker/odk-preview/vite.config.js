import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import federation from '@originjs/vite-plugin-federation';

const isProd = process.env.NODE_ENV === 'production';

export default defineConfig({
    plugins: [
        vue(),
        federation({
            name: 'odkPreview',
            filename: 'remoteEntry.js',
            exposes: { './mount': './src/mount.ts' },
            shared: {},
        }),
    ],
    base: isProd ? '/static/odk-preview/' : '/',
    esbuild: {
        // @getodk/web-forms uses top-level await
        target: 'esnext',
    },
    optimizeDeps: {
        esbuildOptions: {
            target: 'esnext',
        },
    },
    build: {
        target: 'esnext',
        minify: isProd,
        cssCodeSplit: false,
        outDir: '../../iaso/static/odk-preview',
        emptyOutDir: true,
        modulePreload: false,
    },
    server: {
        host: '0.0.0.0',
        port: 8009,
        cors: true,
    },
});
