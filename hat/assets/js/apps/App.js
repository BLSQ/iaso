/* global __LOCALE */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { IntlProvider, addLocaleData } from 'react-intl';
import { Provider } from 'react-redux';
import { Router } from 'react-router';
import { SnackbarProvider } from 'notistack';

// the intl paths get rewritten by webpack depending on the locale
import messages from '__intl/messages'; // eslint-disable-line
import localeData from '__intl/localeData'; // eslint-disable-line

import SnackBarContainer from './Iaso/components/snackBars/SnackBarContainer';

addLocaleData(localeData);
const locale = __LOCALE;

export default class App extends Component {
    render() {
        const { store, routes, history } = this.props;
        return (
            <IntlProvider locale={locale} messages={messages}>
                <Provider store={store}>
                    <SnackbarProvider
                        maxSnack={3}
                        autoHideDuration={4000}
                        anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'center',
                        }}
                    >
                        <SnackBarContainer />
                        <Router
                            routes={routes}
                            history={history}
                        />
                    </SnackbarProvider>
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
