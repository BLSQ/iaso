import { setCookie, getCookie } from '../../utils/cookies';
import { setLocale } from '../../utils/dates';
import { SWITCH_LOCALE } from './actions';

// Set locale in browser cookies and moment since side effect are forbidden in redux
export const localeMiddleware = storeAPI => next => action => {
    if (action.type === SWITCH_LOCALE) {
        const { localeCode } = action.payload;
        if (getCookie('django_language') !== localeCode) {
            setCookie('django_language', localeCode);
        }
        setLocale(localeCode);
    }
    return next(action);
};
