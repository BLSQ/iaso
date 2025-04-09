/* eslint-disable import/no-relative-packages */
import React, { FunctionComponent, useContext, ReactNode } from 'react';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

import enLibrary from 'bluesquare-components/dist/locale/en.json';
import frLibrary from 'bluesquare-components/dist/locale/fr.json';
import { IntlProvider } from 'react-intl';
import { useCurrentUser } from 'Iaso/utils/usersUtils';
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
    const currentUser = useCurrentUser();
    console.log('currentUser', currentUser);
    // TODO: add default langages to the account filed, with fr and en as default
    // TODO: handle the case where we don't have user at all, public routes and use only en and fr
    // TODO: quid of bluesquare-components translations ?

    const messages = {
        fr: { ...translations.fr, ...frLibrary, ...frPlugins },
        en: { ...translations.en, ...enLibrary, ...enPlugins },
    };
    const { locale } = useLocale();
    const onError = (err: any): void => console.warn(err);

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
