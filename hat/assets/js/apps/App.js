/* global __LOCALE */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { IntlProvider, addLocaleData } from 'react-intl';
import { Provider } from 'react-redux';
import { Router } from 'react-router';
import { SnackbarProvider } from 'notistack';

// the intl paths get rewritten by webpack depending on the locale
import fr from '__intl/messages/fr'; // eslint-disable-line
import en from '__intl/messages/en'; // eslint-disable-line
import localeDataFr from '__intl/localeData/fr'; // eslint-disable-line
import localeDataEn from '__intl/localeData/en'; // eslint-disable-line

import SnackBarContainer from './Iaso/components/snackBars/SnackBarContainer';

const messages = {
    fr,
    en,
};
addLocaleData([...localeDataEn, ...localeDataFr]);
const locale = __LOCALE;

class App extends Component {
    render() {
        const { store, routes, history } = this.props;
        return (
            <IntlProvider locale={locale} messages={messages[locale]}>
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
                        <Router routes={routes} history={history} />
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

export default App;
