import React, { FunctionComponent, useEffect } from 'react';
import { Router, Link } from 'react-router';
import { SnackbarProvider } from 'notistack';
import { LinkProvider, LoadingSpinner } from 'bluesquare-components';
import SnackBarContainer from '../../components/snackBars/SnackBarContainer';
import LocalizedApp from './components/LocalizedAppComponent';

import { baseUrls } from '../../constants/urls';
import { dispatch } from '../../redux/store';
import { redirectToReplace } from '../../routing/actions';
import { useRoutes } from './hooks/useRoutes';

type Props = {
    history: Record<string, any>;
    userHomePage?: string;
};

const App: FunctionComponent<Props> = ({ history, userHomePage }) => {
    const { routes, isLoadingRoutes } = useRoutes(userHomePage);

    // Redirect on load if user specify a home url in his profile
    useEffect(() => {
        if (
            userHomePage &&
            userHomePage !== '' &&
            window.location.pathname.includes(`/${baseUrls.home}/`)
        ) {
            dispatch(redirectToReplace(userHomePage));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <>
            {isLoadingRoutes && <LoadingSpinner />}
            {!isLoadingRoutes && (
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
            )}
        </>
    );
};

export default App;
