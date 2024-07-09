import { LoadingSpinner } from 'bluesquare-components';
import React, { FunctionComponent } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useSnackBars } from '../../components/snackBars/useSnackBars';
import { useRoutes } from './hooks/useRoutes';

type Props = {
    userHomePage?: string;
};

const dashboardBasename = '/dashboard';

const App: FunctionComponent<Props> = ({ userHomePage }) => {
    const { nonDashboardRoutes, routes, isLoadingRoutes } = useRoutes(
        userHomePage && userHomePage !== '' ? userHomePage : undefined,
    );
    useSnackBars();

    const isDashboardPath =
        window.location.pathname.includes(dashboardBasename);
    if (isLoadingRoutes) {
        return <LoadingSpinner />;
    }
    return isDashboardPath ? (
        <BrowserRouter basename={dashboardBasename}>{routes}</BrowserRouter>
    ) : (
        <BrowserRouter>{nonDashboardRoutes}</BrowserRouter>
    );
};

export default App;
