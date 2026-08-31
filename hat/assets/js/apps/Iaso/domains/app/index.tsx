import React, { FunctionComponent } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useSnackBars } from '../../components/snackBars/useSnackBars';
import ProductFruitsComponent from './components/ProductFruits';
import SiteAnnouncementBanner from './components/SiteAnnouncementBanner';
import { InputContextProvider } from './contexts/InputContext';
import { SentryProvider } from './contexts/SentryProvider';
import { useRoutes } from './hooks/useRoutes';

type Props = {
    userHomePage?: string;
};

const dashboardBasename = '/dashboard';

const App: FunctionComponent<Props> = ({ userHomePage }) => {
    const { nonDashboardRoutes, routes, isCurrentRouteAnonymous } = useRoutes(
        userHomePage && userHomePage !== '' ? userHomePage : undefined,
    );
    useSnackBars();

    const isDashboardPath =
        window.location.pathname.includes(dashboardBasename);
    return (
        <SentryProvider isCurrentRouteAnonymous={isCurrentRouteAnonymous}>
            <BrowserRouter
                basename={isDashboardPath ? dashboardBasename : undefined}
            >
                <InputContextProvider>
                    <SiteAnnouncementBanner />
                    {isDashboardPath && <ProductFruitsComponent />}
                    {isDashboardPath ? routes : nonDashboardRoutes}
                </InputContextProvider>
            </BrowserRouter>
        </SentryProvider>
    );
};

export default App;
