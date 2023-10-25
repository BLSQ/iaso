import React, { FunctionComponent } from 'react';
import { Router, Link } from 'react-router';
import { SnackbarProvider } from 'notistack';
import { LinkProvider, LoadingSpinner } from 'bluesquare-components';
import SnackBarContainer from '../../components/snackBars/SnackBarContainer';
import LocalizedApp from './components/LocalizedAppComponent';

import { useRoutes } from './hooks/useRoutes';

type Props = {
    history: Record<string, any>;
    userHomePage?: string;
};

const App: FunctionComponent<Props> = ({ history, userHomePage }) => {
    const { routes, isLoadingRoutes } = useRoutes(userHomePage);
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
