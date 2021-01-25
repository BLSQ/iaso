import React from 'react';
import PropTypes from 'prop-types';
import { IntlProvider } from 'react-intl';
import { useSelector } from 'react-redux';

// the intl paths get rewritten by webpack depending on the locale
import fr from '__intl/messages/fr'; // eslint-disable-line
import en from '__intl/messages/en'; // eslint-disable-line

const messages = {
    fr,
    en,
};

export default function LocalizedAppComponent({ children }) {
    const activeLocale = useSelector(state => state.app.locale);
    const onError = msg => console.warn(msg);
    return (
        <IntlProvider
            onError={onError}
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
