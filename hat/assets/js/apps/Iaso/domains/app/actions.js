import { APP_LOCALES } from './constants';
import { setCookie } from '../../utils/cookies';

export const SWITCH_LOCALE = 'APP_SWITCH_LOCALE';

export const switchLocale = localeCode => {
    if (!APP_LOCALES.map(l => l.code).includes(localeCode)) {
        throw new Error(`Invalid locale code ${localeCode}`);
    }
    setCookie('django_language', localeCode);

    return {
        type: SWITCH_LOCALE,
        payload: { localeCode },
    };
};
