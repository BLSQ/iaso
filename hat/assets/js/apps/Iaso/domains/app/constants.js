import { LANGUAGE_CONFIGS } from 'IasoModules/language/configs';

// Get available locales from the generated config
export const APP_LOCALES = Object.entries(LANGUAGE_CONFIGS).map(
    ([code, config]) => ({
        code,
        label: config.label,
    }),
);

export const DEFAULT_LANGUAGE = 'en';

export const THOUSAND = 'thousand';
export const LAKH = 'lakh';
export const WAN = 'wan';

// Get thousand group styles from the generated config
export const THOUSAND_GROUP_STYLES = Object.entries(LANGUAGE_CONFIGS).reduce(
    (acc, [code, config]) => {
        acc[code] = config.thousandGroupStyle;
        return acc;
    },
    {},
);
