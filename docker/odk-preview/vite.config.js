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
            exposes: {
                './mount': './src/mount.ts',
            },
            shared: {},
        }),
    ],
    base: isProd ? '/static/odk-preview/' : '/',
    build: {
        target: 'esnext',
        minify: isProd,
        cssCodeSplit: false,
        outDir: '../../iaso/static/odk-preview',
        emptyOutDir: true,
        modulePreload: false,
    },
    optimizeDeps: {
        esbuildOptions: {
            target: 'esnext',
        },
    },
    server: {
        host: '0.0.0.0',
        port: 8009,
        cors: true,
        origin: 'http://localhost:8009',
        fs: {
            allow: ['/'],
            strict: false,
        },
    },
});
