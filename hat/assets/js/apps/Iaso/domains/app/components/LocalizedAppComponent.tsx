import React, { FunctionComponent, ReactNode, useMemo } from 'react';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { LoadingSpinner } from 'bluesquare-components';
import { IntlProvider } from 'react-intl';
import { baseUrls } from 'Iaso/constants/urls';
import { useGetCurrentUser } from 'Iaso/domains/users/hooks/useGetCurrentUser';
import { usePluginsRouteConfigs } from 'Iaso/plugins/hooks/routes';
import { LANGUAGE_CONFIGS } from 'IasoModules/language/configs';
import translationsConfig from 'IasoModules/translations/configs';
import { useLocale } from '../contexts/LocaleContext';
import { useCurrentRoute, useGetRoutesConfigs } from '../hooks/useRoutes';

type Props = {
    children: ReactNode;
    userHomePage?: string;
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
const LocalizedAppComponent: FunctionComponent<Props> = ({
    children,
    userHomePage,
}) => {
    const { locale } = useLocale();
    const onError = (err: any): void => console.warn(err);

    const { pluginRoutes } = usePluginsRouteConfigs();
    const routesConfigs = useGetRoutesConfigs({ userHomePage, pluginRoutes });
    const currentRoute = useCurrentRoute(routesConfigs);
    const { data: currentUser, isFetching: isFetchingCurrentUser } =
        useGetCurrentUser(
            !currentRoute?.allowAnonymous ||
                currentRoute?.baseUrl === baseUrls.home,
            false,
        );
    const allowDisplay =
        currentRoute?.allowAnonymous ||
        (!isFetchingCurrentUser && Boolean(currentUser));

    const messages = useMemo(() => {
        const baseMessages = translationsConfig as unknown as Record<
            string,
            Record<string, string>
        >;
        if (!currentRoute?.allowAnonymous && currentUser) {
            const customTranslations = currentUser.account?.custom_translations;
            if (customTranslations) {
                Object.keys(customTranslations).forEach(lang => {
                    baseMessages[lang] = {
                        ...baseMessages[lang],
                        ...customTranslations[lang],
                    };
                });
            }
        }
        return baseMessages;
    }, [currentUser, currentRoute?.allowAnonymous]);

    if (!allowDisplay) {
        return <LoadingSpinner />;
    }
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
