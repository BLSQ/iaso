/* global __LOCALE */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { IntlProvider, addLocaleData } from 'react-intl';
import { Provider } from 'react-redux';
import { Router } from 'react-router';

// the intl paths get rewritten by webpack depending on the locale
import messages from '__intl/messages'; // eslint-disable-line
import localeData from '__intl/localeData'; // eslint-disable-line

addLocaleData(localeData);
const locale = __LOCALE;

export default class App extends Component {
    render() {
        const { store, routes, history } = this.props;
        return (
            <IntlProvider locale={locale} messages={messages}>
                <Provider store={store}>
                    <Router
                        routes={routes}
                        history={history}
                    />
                </Provider>
            </IntlProvider>
        );
    }
}

App.propTypes = {
    store: PropTypes.object.isRequired,
    routes: PropTypes.array.isRequired,
    history: PropTypes.object.isRequired,
};
