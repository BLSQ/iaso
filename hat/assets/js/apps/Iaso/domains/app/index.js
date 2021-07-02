import React from 'react';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import { Router, Link } from 'react-router';
import { SnackbarProvider } from 'notistack';
import { LinkProvider } from 'bluesquare-components';
import SnackBarContainer from '../../components/snackBars/SnackBarContainer';
import LocalizedApp from './components/LocalizedAppComponent';

export default function App({ store, routes, history }) {
    return (
        <Provider store={store}>
            <LocalizedApp>
                <LinkProvider linkComponent={Link}>
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
                </LinkProvider>
            </LocalizedApp>
        </Provider>
    );
}
App.propTypes = {
    store: PropTypes.object.isRequired,
    routes: PropTypes.array.isRequired,
    history: PropTypes.object.isRequired,
};
