import React, { useMemo, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { Router, Link } from 'react-router';
import { SnackbarProvider } from 'notistack';
import { LinkProvider } from 'bluesquare-components';
import SnackBarContainer from '../../components/snackBars/SnackBarContainer';
import LocalizedApp from './components/LocalizedAppComponent';

import { useAddRoutes } from '../../routing/redirections';
import { useCurrentUser } from '../../utils/usersUtils.ts';
import { fetchCurrentUser } from '../users/actions';

export default function App({
    baseRoutes,
    history,
    userHomePage,
    overrideLanding,
}) {
    const getRoutes = useAddRoutes(baseRoutes, userHomePage || overrideLanding);
    const dispatch = useDispatch();
    // on first load this is undefined, it will be updated when fetchCurrentUser is done
    const currentUser = useCurrentUser();
    useEffect(() => {
        dispatch(fetchCurrentUser());
    }, [dispatch]);
    const routes = useMemo(() => {
        if (!currentUser) {
            return [];
        }
        return getRoutes();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser]);
    if (!currentUser || routes.length === 0) return null;
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
                    <Router routes={routes} history={history} />
                </SnackbarProvider>
            </LinkProvider>
        </LocalizedApp>
    );
}
App.propTypes = {
    baseRoutes: PropTypes.array.isRequired,
    history: PropTypes.object.isRequired,
    userHomePage: PropTypes.string.isRequired,
    overrideLanding: PropTypes.string.isRequired,
};
