import { LangOptions } from 'bluesquare-components';
import moment from 'moment';
import React, { createContext, useContext, useMemo, useState } from 'react';
import { longDateFormats } from '../../../utils/dates';

const LocaleContext = createContext({
    locale: moment.locale(),
    // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
    setLocale: (locale: LangOptions) => {
        /* noop */
    },
});

export const useLocale = () => useContext(LocaleContext);

export const LocaleProvider = ({ children }) => {
    const [locale, setLocale] = useState<LangOptions>(
        moment.locale() as LangOptions,
    );

    const value: {
        locale: LangOptions;
        // eslint-disable-next-line no-unused-vars
        setLocale: (newLocale: LangOptions) => void;
    } = useMemo(
        () => ({
            locale,
            setLocale: (newLocale: LangOptions) => {
                moment.locale(newLocale);
                moment.updateLocale(newLocale, {
                    longDateFormat: longDateFormats[newLocale],
                    week: {
                        dow: 1,
                    },
                });
                setLocale(newLocale as LangOptions);
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
