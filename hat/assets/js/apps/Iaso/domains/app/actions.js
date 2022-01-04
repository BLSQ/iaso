import { APP_LOCALES } from './constants';

export const SWITCH_LOCALE = 'APP_SWITCH_LOCALE';

export const switchLocale = localeCode => {
    if (!APP_LOCALES.map(l => l.code).includes(localeCode)) {
        throw new Error(`Invalid locale code ${localeCode}`);
    }

    return {
        type: SWITCH_LOCALE,
        payload: { localeCode },
    };
};
