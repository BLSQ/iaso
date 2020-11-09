import { SWITCH_LOCALE } from './actions';
import { APP_LOCALES } from './constants';

function findLocale(code) {
    const locale = APP_LOCALES.find(l => l.code === code);
    if (locale === undefined) {
        return APP_LOCALES[0];
    }

    return locale;
}

function appInitialState() {
    const storedLocaleCode = localStorage.getItem('iaso_locale');
    const code =
        storedLocaleCode !== null
            ? storedLocaleCode
            : navigator.language.split('-')[0];

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
