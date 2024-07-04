import { LangOptions } from 'bluesquare-components';
import moment from 'moment';
import React, {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { longDateFormats } from '../../../utils/dates';

const LocaleContext = createContext({
    locale: moment.locale(),
    // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
    setLocale: (locale: LangOptions) => {
        /* noop */
    },
});

const updateMomentLocale = (newLocale: LangOptions) => {
    moment.locale(newLocale);
    moment.updateLocale(newLocale, {
        longDateFormat: longDateFormats[newLocale],
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

    const value: {
        locale: LangOptions;
        // eslint-disable-next-line no-unused-vars
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
