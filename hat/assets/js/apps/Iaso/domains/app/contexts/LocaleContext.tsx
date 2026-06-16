import React, {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { LangOptions } from 'bluesquare-components';
import moment from 'moment';
import { loadZodLocale } from 'Iaso/libs/zodUtils';
import { LANGUAGE_CONFIGS } from 'IasoModules/language/configs';

const LocaleContext = createContext({
    locale: moment.locale(),
    setLocale: (_locale: LangOptions) => {
        /* noop */
    },
});

const updateMomentLocale = (newLocale: LangOptions) => {
    moment.locale(newLocale);
    // Use LANGUAGE_CONFIGS for date formats with fallback to English
    const dateFormats =
        LANGUAGE_CONFIGS[newLocale]?.dateFormats ||
        LANGUAGE_CONFIGS.en?.dateFormats;
    moment.updateLocale(newLocale, {
        longDateFormat: dateFormats,
        week: {
            dow: 1,
        },
    });
};
export const useLocale = () => useContext(LocaleContext);
const defaultLanguage = 'en';
export const LocaleProvider = ({ children }) => {
    const [locale, setLocale] = useState<LangOptions>(defaultLanguage);

    useEffect(() => {
        updateMomentLocale(defaultLanguage);
    }, []);

    useEffect(() => {
        loadZodLocale(locale).catch(() =>
            console.warn(`Failed to load zod locale data for ${locale}`),
        );
    }, [locale]);

    const value: {
        locale: LangOptions;
        setLocale: (newLocale: LangOptions) => void;
    } = useMemo(
        () => ({
            locale,
            setLocale: (newLocale: LangOptions) => {
                updateMomentLocale(newLocale);
                setLocale(newLocale);
            },
        }),
        [locale],
    );

    return (
        <LocaleContext.Provider value={value}>
            {children}
        </LocaleContext.Provider>
    );
};
