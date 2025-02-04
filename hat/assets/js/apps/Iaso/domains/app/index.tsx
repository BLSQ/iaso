import { LoadingSpinner } from 'bluesquare-components';
import React, { FunctionComponent } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useSnackBars } from '../../components/snackBars/useSnackBars';
import { InputContextProvider } from './contexts/InputContext';
import { SentryProvider } from './contexts/SentryProvider';
import { useRoutes } from './hooks/useRoutes';

type Props = {
    userHomePage?: string;
};

const dashboardBasename = '/dashboard';

const App: FunctionComponent<Props> = ({ userHomePage }) => {
    const {
        nonDashboardRoutes,
        routes,
        isLoadingRoutes,
        isCurrentRouteAnonymous,
    } = useRoutes(
        userHomePage && userHomePage !== '' ? userHomePage : undefined,
    );
    useSnackBars();

    const isDashboardPath =
        window.location.pathname.includes(dashboardBasename);
    if (isLoadingRoutes) {
        return <LoadingSpinner />;
    }
    return (
        <SentryProvider isCurrentRouteAnonymous={isCurrentRouteAnonymous}>
            <BrowserRouter
                basename={isDashboardPath ? dashboardBasename : undefined}
            >
                <InputContextProvider>
                    {isDashboardPath ? routes : nonDashboardRoutes}
                </InputContextProvider>
            </BrowserRouter>
        </SentryProvider>
    );
};

export default App;
