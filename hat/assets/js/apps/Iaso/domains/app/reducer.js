import { SWITCH_LOCALE } from './actions';
import { APP_LOCALES } from './constants';
import { getCookie } from '../../utils/cookies';
import { setLocale } from '../../utils/dates';

function findLocale(code) {
    const locale = APP_LOCALES.find(l => l.code === code);
    if (locale === undefined) {
        return APP_LOCALES[0];
    }

    return locale;
}

export function appInitialState() {
    const storedLocaleCode = getCookie('django_language');
    const code =
        storedLocaleCode !== null
            ? storedLocaleCode
            : navigator.language.split('-')[0];
    setLocale(code);

    return {
        locale: findLocale(code),
    };
}

export default function appReducer(state = appInitialState(), action = {}) {
    switch (action.type) {
        case SWITCH_LOCALE: {
            const { localeCode } = action.payload;

            return {
                ...state,
                locale: findLocale(localeCode),
            };
        }

        default:
            return state;
    }
}
