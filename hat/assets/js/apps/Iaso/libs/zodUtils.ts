import * as z from 'zod';

// todo : lazy import per locale instead and (switch to something more recent (vite/next.js/..) or fix webpack not picking lazy imports correctly)
const zodLocales = {
    en: () => import('zod/v4/locales/en.js'),
    fr: () => import('zod/v4/locales/fr.js'),
    es: () => import('zod/v4/locales/es.js'),
    pt: () => import('zod/v4/locales/pt.js'),
};

export async function loadZodLocale(locale: keyof typeof zodLocales) {
    const loader = zodLocales[locale] ?? zodLocales.en;

    const { default: importLocale } = await loader();

    z.config(importLocale());
}
