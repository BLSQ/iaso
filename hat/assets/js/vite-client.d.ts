/// <reference types="vite/client" />

interface ImportMetaEnv {
    /** Set in hat/vite.config.ts during `vite serve` (Django HTML + Vite bundles). */
    readonly VITE_PDF_WORKER_URL?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}