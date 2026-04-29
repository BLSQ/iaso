import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
    plugins: [vue()],
    base: './',
    build: {
        target: 'esnext',
        outDir: '../../iaso/static/odk-preview',
        emptyOutDir: true,
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
        fs: {
            allow: ['/'],
            strict: false,
        },
    },
});
