import { LangOptions } from 'bluesquare-components';
import moment from 'moment';
import React, {
    createContext,
    useCallback,
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

export const useLocale = () => useContext(LocaleContext);
const defaultLanguage = 'en';
export const LocaleProvider = ({ children }) => {
    const [locale, setLocale] = useState<LangOptions>(defaultLanguage);

    const updateLocale = useCallback((newLocale: LangOptions) => {
        moment.locale(newLocale);
        moment.updateLocale(newLocale, {
            longDateFormat: longDateFormats[newLocale],
            week: {
                dow: 1,
            },
        });
        setLocale(newLocale);
    }, []);

    useEffect(() => {
        updateLocale(defaultLanguage);
    }, [locale, updateLocale]);

    const value: {
        locale: LangOptions;
        // eslint-disable-next-line no-unused-vars
        setLocale: (newLocale: LangOptions) => void;
    } = useMemo(
        () => ({
            locale,
            setLocale: updateLocale,
        }),
        [locale, updateLocale],
    );

    return (
        <LocaleContext.Provider value={value}>
            {children}
        </LocaleContext.Provider>
    );
};
