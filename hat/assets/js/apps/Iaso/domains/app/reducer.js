import { SWITCH_LOCALE } from './actions';
import { APP_LOCALES } from './constants';

function findLocale(code) {
    const locale = APP_LOCALES.find(l => l.code === code);
    if (locale === undefined) {
        console.warn(`Could not find locale with code ${code}`);
        return APP_LOCALES[0];
    }

    return locale;
}

const appInitialState = () => ({
    locale: findLocale(localStorage.getItem('iaso_locale')),
});

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
