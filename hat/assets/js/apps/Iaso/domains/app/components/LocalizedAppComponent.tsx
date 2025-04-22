import React, { FunctionComponent, ReactNode } from 'react';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { IntlProvider } from 'react-intl';
import { LANGUAGE_CONFIGS } from 'IasoModules/language/configs';
import translationsConfig from 'IasoModules/translations/configs';
import { useLocale } from '../contexts/LocaleContext';

type Props = {
    children: ReactNode;
};
// Load locale data for available languages
Object.keys(LANGUAGE_CONFIGS).forEach(lang => {
    if (lang !== 'en') {
        // English is included by default
        import(`moment/locale/${lang}`).catch(() => {
            console.warn(`Failed to load locale data for ${lang}`);
        });
    }
});
const LocalizedAppComponent: FunctionComponent<Props> = ({ children }) => {
    const { locale } = useLocale();
    const onError = (err: any): void => console.warn(err);
    const messages = translationsConfig as unknown as Record<
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
