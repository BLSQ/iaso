import React, { FunctionComponent } from 'react';
import { Router, Link } from 'react-router';
import { LinkProvider, LoadingSpinner } from 'bluesquare-components';
import { useSnackBars } from '../../components/snackBars/useSnackBars';
import { useRoutes } from './hooks/useRoutes';

type Props = {
    history: Record<string, any>;
    userHomePage?: string;
};

const App: FunctionComponent<Props> = ({ history, userHomePage }) => {
    const { routes, isLoadingRoutes } = useRoutes(
        userHomePage && userHomePage !== '' ? userHomePage : undefined,
    );
    useSnackBars();
    return (
        <>
            {isLoadingRoutes && <LoadingSpinner />}
            {!isLoadingRoutes && (
                <LinkProvider linkComponent={Link}>
                    <Router routes={routes} history={history} />
                </LinkProvider>
            )}
        </>
    );
};

export default App;
