import { SWITCH_LOCALE } from './actions';
import { APP_LOCALES, DEFAULT_LANGUAGE } from './constants';
import { getCookie } from '../../utils/cookies';
import { setLocale } from '../../utils/dates.ts';

function findLocale(code) {
    const locale = APP_LOCALES.find(l => l.code === code);
    if (locale === undefined) {
        return APP_LOCALES[0];
    }

    return locale;
}

export function appInitialState() {
    const supportedLanguages = [DEFAULT_LANGUAGE, 'fr'];
    let code = getCookie('django_language') || navigator.language.split('-')[0];
    if (!supportedLanguages.includes(code)) {
        code = DEFAULT_LANGUAGE;
    }
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
