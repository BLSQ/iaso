import React, { FunctionComponent, ReactNode } from 'react';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { IntlProvider } from 'react-intl';
import translations from 'IasoModules/translations/configs';
import { useLocale } from '../contexts/LocaleContext';

type Props = {
    children: ReactNode;
};

const LocalizedAppComponent: FunctionComponent<Props> = ({ children }) => {
    const { locale } = useLocale();
    const onError = (err: any): void => console.warn(err);
    const messages = translations as unknown as Record<
        string,
        Record<string, string>
    >;
    return (
        <IntlProvider
            onError={onError}
            key={locale}
            locale={locale}
            messages={messages[locale]}
        >
            <LocalizationProvider
                dateAdapter={AdapterMoment}
                adapterLocale={locale}
            >
                {children}
            </LocalizationProvider>
        </IntlProvider>
    );
};

export default LocalizedAppComponent;
