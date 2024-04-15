import React, { FunctionComponent } from 'react';
import { Link, RouterProvider } from 'react-router-dom';
import { LinkProvider, LoadingSpinner } from 'bluesquare-components';
import { useSnackBars } from '../../components/snackBars/useSnackBars';
import { useRoutes } from './hooks/useRoutes';
import { router } from '../../routing/router';

type Props = {
    userHomePage?: string;
};

const App: FunctionComponent<Props> = ({ userHomePage }) => {
    const { routes, isLoadingRoutes } = useRoutes(
        userHomePage && userHomePage !== '' ? userHomePage : undefined,
    );
    useSnackBars();
    return (
        <>
            {isLoadingRoutes && <LoadingSpinner />}
            {!isLoadingRoutes && (
                <LinkProvider linkComponent={Link}>
                    {/* <Router routes={routes} history={history} /> */}
                    <RouterProvider router={router} />
                </LinkProvider>
            )}
        </>
    );
};

export default App;
