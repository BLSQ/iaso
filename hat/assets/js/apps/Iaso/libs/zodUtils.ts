import * as z from 'zod';

// todo : lazy import per locale instead and (switch to something more recent (vite/next.js/..) or fix webpack not picking lazy imports correctly)
const zodLocales = {
    en: () => import('zod/v4/locales/en.js'),
    fr: () => import('zod/v4/locales/fr.js'),
    es: () => import('zod/v4/locales/es.js'),
    pt: () => import('zod/v4/locales/pt.js'),
};

// this could be done in many other ways :
// 1. pass a messages.id in customError + override all form component to formatMessage using that message.id=> this imply modifying all input components
// 2. switch react-i18n that would allow us to pass a message id directly in that loadZodLocale function
// 3. switch react-i18n + upgrade react-query + upgrade orval that now supports overriding zod mocks
// 4. this hacky way :)
const zodMessages = {
    required: {
        en: 'This field is required.',
        fr: 'Ce champ est obligatoire.',
        es: 'Este campo es obligatorio.',
        pt: 'Este campo é obrigatório.',
    },
};

export async function loadZodLocale(locale: keyof typeof zodLocales) {
    const loader = zodLocales[locale] ?? zodLocales.en;

    const { default: importLocale } = await loader();

    z.config({
        ...importLocale(),
        customError: issue => {
            if (
                issue.code === 'invalid_type' &&
                issue.expected === 'string' &&
                !issue.input
            ) {
                return zodMessages.required?.[locale];
            }
            if (
                issue.code === 'too_small' &&
                issue.origin === 'array' &&
                issue.minimum === 1
            ) {
                return zodMessages.required?.[locale];
            }
            return undefined;
        },
    });
}
