import {
    LOCALE,
    PDF_WORKER_FILE_NAME,
    devOrigin,
} from './context';

export const clientDefine = (command: string) => ({
    __LOCALE: JSON.stringify(LOCALE),
    'process.env.ORVAL_API_BASE_URL': JSON.stringify(
        process.env.ORVAL_API_BASE_URL ?? '',
    ),
    ...(command === 'serve' && {
        'import.meta.env.VITE_PDF_WORKER_URL': JSON.stringify(
            `${devOrigin}/${PDF_WORKER_FILE_NAME}`,
        ),
    }),
});