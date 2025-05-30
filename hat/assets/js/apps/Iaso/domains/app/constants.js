import { LANGUAGE_CONFIGS } from 'IasoModules/language/configs';
import { mapObject } from '../../utils/objectUtils';

// Get available locales from the generated config
export const useAppLocales = () => {
    return Object.entries(LANGUAGE_CONFIGS)
        .map(([code, config]) => ({
            code,
            label: config.label,
        }))
        .filter(({ code: langCode }) =>
            window.AVAILABLE_LANGUAGES.includes(langCode),
        );
};

export const DEFAULT_LANGUAGE = 'en';

export const THOUSAND = 'thousand';
export const LAKH = 'lakh';
export const WAN = 'wan';

// Get thousand group styles from the generated config
export const THOUSAND_GROUP_STYLES = mapObject(
    LANGUAGE_CONFIGS,
    'thousandGroupStyle',
);
