import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { IntlProvider } from 'react-intl';
import { useSelector } from 'react-redux';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

// the intl paths get rewritten by webpack depending on the locale
import fr from '__intl/messages/fr'; // eslint-disable-line
import en from '__intl/messages/en'; // eslint-disable-line
import frLibrary from '../../../../../../../../node_modules/bluesquare-components/dist/locale/fr.json';
import enLibrary from '../../../../../../../../node_modules/bluesquare-components/dist/locale/en.json';
import { PluginsContext } from '../../../utils';

const extractTranslations = (plugins, key) => {
    return plugins
        .map(plugin => plugin.translations[key])
        .reduce((v1, v2) => ({ ...v1, ...v2 }), {});
};
export default function LocalizedAppComponent({ children }) {
    const { plugins } = useContext(PluginsContext);
    const frPlugins = extractTranslations(plugins, 'fr');
    const enPlugins = extractTranslations(plugins, 'en');
    const messages = {
        fr: { ...fr, ...frLibrary, ...frPlugins },
        en: { ...en, ...enLibrary, ...enPlugins },
    };
    const activeLocale = useSelector(state => state.app.locale);
    const onError = msg => console.warn(msg);
    return (
        <IntlProvider
            onError={onError}
            key={activeLocale.code}
            locale={activeLocale.code}
            messages={messages[activeLocale.code]}
        >
            <LocalizationProvider
                dateAdapter={AdapterDayjs}
                adapterLocale={activeLocale.code}
            >
                {children}
            </LocalizationProvider>
        </IntlProvider>
    );
}
LocalizedAppComponent.propTypes = {
    children: PropTypes.node.isRequired,
};
