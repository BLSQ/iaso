import fs from 'node:fs';
import path from 'node:path';

import type { Plugin } from 'vite';

import {
    PDF_WORKER_FILE_NAME,
    outDir,
    pdfWorkerSourcePath,
} from '../context';

/** Serve/copy pdf.js worker at a stable URL (react-pdf default path breaks under Vite). */
export const pdfWorkerPlugin = (): Plugin => ({
    name: 'iaso:pdfjs-worker',
    configureServer(server) {
        server.middlewares.use((req, res, next) => {
            if (req.url?.split('?')[0] === `/${PDF_WORKER_FILE_NAME}`) {
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
            path.join(outDir, PDF_WORKER_FILE_NAME),
        );
    },
});