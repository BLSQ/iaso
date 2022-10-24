import React from 'react';
import PropTypes from 'prop-types';
import { Router, Link } from 'react-router';
import { SnackbarProvider } from 'notistack';
import { LinkProvider } from 'bluesquare-components';
import SnackBarContainer from '../../components/snackBars/SnackBarContainer';
import LocalizedApp from './components/LocalizedAppComponent';

import { useAddRoutes } from '../../routing/redirections';

export default function App({
    baseRoutes,
    history,
    userHomePage,
    overrideLanding,
}) {
    const routes = useAddRoutes(baseRoutes, userHomePage || overrideLanding);
    return (
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
                    <Router routes={baseRoutes} history={history} />
                </SnackbarProvider>
            </LinkProvider>
        </LocalizedApp>
    );
}
App.propTypes = {
    store: PropTypes.object.isRequired,
    baseRoutes: PropTypes.array.isRequired,
    history: PropTypes.object.isRequired,
    userHomePage: PropTypes.string.isRequired,
    overrideLanding: PropTypes.string.isRequired,
};
