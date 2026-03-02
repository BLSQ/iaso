import moment from 'moment/moment';
import { LANGUAGE_CONFIGS } from 'IasoModules/language/configs';

export const setLocale = (code: string): void => {
    moment.locale(code);
    moment.updateLocale(code, {
        longDateFormat:
            LANGUAGE_CONFIGS[code]?.dateFormats ||
            LANGUAGE_CONFIGS.en?.dateFormats ||
            {},
        week: {
            dow: 1,
        },
    });
};