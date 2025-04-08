/* eslint-disable import/no-relative-packages */
import React, { FunctionComponent, useContext, ReactNode } from 'react';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

import enLibrary from 'bluesquare-components/dist/locale/en.json';
import frLibrary from 'bluesquare-components/dist/locale/fr.json';
import { IntlProvider } from 'react-intl';
import translations from 'IasoModules/translations/configs';
import { PluginsContext } from '../../../plugins/context';
import { Plugin } from '../../../plugins/types';
import { useLocale } from '../contexts/LocaleContext';

type Props = {
    children: ReactNode;
};

const extractTranslations = (
    plugins: Plugin[],
    key: string,
): Record<string, string> => {
    return plugins
        .map(plugin => plugin.translations[key])
        .reduce((v1, v2) => ({ ...v1, ...v2 }), {});
};

const LocalizedAppComponent: FunctionComponent<Props> = ({ children }) => {
    const { plugins } = useContext(PluginsContext);
    const frPlugins = extractTranslations(plugins, 'fr');
    const enPlugins = extractTranslations(plugins, 'en');
    const messages = {
        fr: { ...translations.fr, ...frLibrary, ...frPlugins },
        en: { ...translations.en, ...enLibrary, ...enPlugins },
    };
    const { locale } = useLocale();
    const onError = (msg: string): void => console.warn(msg);

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
