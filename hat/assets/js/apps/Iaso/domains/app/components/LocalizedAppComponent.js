import React from 'react';
import PropTypes from 'prop-types';
import { IntlProvider, addLocaleData } from 'react-intl';
import { useSelector } from 'react-redux';

// the intl paths get rewritten by webpack depending on the locale
import fr from '__intl/messages/fr'; // eslint-disable-line
import en from '__intl/messages/en'; // eslint-disable-line
import localeDataFr from '__intl/localeData/fr'; // eslint-disable-line
import localeDataEn from '__intl/localeData/en'; // eslint-disable-line

const messages = {
    fr,
    en,
};
addLocaleData([...localeDataEn, ...localeDataFr]);

export default function LocalizedAppComponent({ children }) {
    const activeLocale = useSelector(state => state.app.locale);

    return (
        <IntlProvider
            key={activeLocale.code}
            locale={activeLocale.code}
            messages={messages[activeLocale.code]}
        >
            {children}
        </IntlProvider>
    );
}
LocalizedAppComponent.propTypes = {
    children: PropTypes.node.isRequired,
};
