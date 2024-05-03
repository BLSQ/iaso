import React, { FunctionComponent } from 'react';
import { BrowserRouter, Link } from 'react-router-dom';
import { LinkProvider, LoadingSpinner } from 'bluesquare-components';
import { useSnackBars } from '../../components/snackBars/useSnackBars';
import { useRoutes } from './hooks/useRoutes';
// import { router } from '../../routing/router';

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
                    {/* <RouterProvider router={router} /> */}
                    <BrowserRouter basename="/dashboard">
                        {routes}
                    </BrowserRouter>
                </LinkProvider>
            )}
        </>
    );
};

export default App;
