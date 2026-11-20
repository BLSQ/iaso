import * as z from 'zod';
import {
    LANGUAGE_CONFIGS,
    ZOD_LOCALE_LOADERS,
    ZOD_REQUIRED_FIELD_MESSAGES,
} from 'IasoModules/language/configs';

type AppLocale = keyof typeof LANGUAGE_CONFIGS;

type ZodV4LocaleModule = {
    default: () => NonNullable<Parameters<typeof z.config>[0]>;
};

// Until zod can use react-intl message ids, override a few errors with app copy.
export const loadZodLocale = async (locale: AppLocale): Promise<void> => {
    const loader =
        ZOD_LOCALE_LOADERS[locale as keyof typeof ZOD_LOCALE_LOADERS] ??
        ZOD_LOCALE_LOADERS.en;
    if (!loader) {
        return;
    }

    const { default: importLocale } = (await loader()) as ZodV4LocaleModule;
    const requiredMessage =
        ZOD_REQUIRED_FIELD_MESSAGES[locale] ?? ZOD_REQUIRED_FIELD_MESSAGES.en;

    z.config({
        ...importLocale(),
        customError: issue => {
            if (
                issue.code === 'invalid_type' &&
                issue.expected === 'string' &&
                !issue.input
            ) {
                return requiredMessage;
            }
            if (
                issue.code === 'too_small' &&
                issue.origin === 'array' &&
                issue.minimum === 1
            ) {
                return requiredMessage;
            }
            return undefined;
        },
    });
};
