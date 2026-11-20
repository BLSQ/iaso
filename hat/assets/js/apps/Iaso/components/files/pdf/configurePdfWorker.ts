// @ts-nocheck — import.meta is valid in Vite/Vitest; root tsconfig still targets commonJS for legacy tooling.

const PDF_WORKER_FILE = 'iaso-pdf.worker.min.mjs';

type ReactPdfJs = typeof import('react-pdf').pdfjs;

/** Call immediately after importing `react-pdf` (it resets workerSrc to `pdf.worker.mjs`). */
export const configurePdfWorker = (pdfjs: ReactPdfJs): void => {
    const workerSrc = import.meta.env.DEV
        ? import.meta.env.VITE_PDF_WORKER_URL
        : new URL(`./${PDF_WORKER_FILE}`, import.meta.url).href;

    if (typeof workerSrc !== 'string' || workerSrc === '') {
        return;
    }

    pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
};
