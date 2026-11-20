import { entryPoints, liveComponents } from './context';

export const optimizeDepsConfig = () => ({
    // Do not crawl repo-wide *.html (Django templates, docs, emails, …).
    entries: Object.values(entryPoints),
    holdUntilCrawlEnd: true,
    include: [
        'react',
        'react-dom',
        'react-intl',
        '@mui/material',
        '@mui/lab',
        '@mui/x-date-pickers',
        'lodash',
        'moment',
        'leaflet',
        'leaflet-draw',
        'react-query',
        'formik',
        'react-pdf',
        'warning',
        ...(liveComponents ? [] : ['bluesquare-components']),
    ],
    ...(liveComponents ? { exclude: ['bluesquare-components'] } : {}),
});