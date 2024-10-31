import { LoadingSpinner } from 'bluesquare-components';
import React, { FunctionComponent } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useSnackBars } from '../../components/snackBars/useSnackBars';
import { SentryProvider } from './contexts/SentryProvider';
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
    return (
        <SentryProvider>
            <BrowserRouter
                basename={isDashboardPath ? dashboardBasename : undefined}
            >
                {isDashboardPath ? routes : nonDashboardRoutes}
            </BrowserRouter>
        </SentryProvider>
    );
};

export default App;
