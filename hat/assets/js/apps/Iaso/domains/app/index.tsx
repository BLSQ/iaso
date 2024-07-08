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
    const { routes, isLoadingRoutes, removeIasoRoutes } = useRoutes(
        userHomePage && userHomePage !== '' ? userHomePage : undefined,
    );
    useSnackBars();

    if (isLoadingRoutes) {
        return <LoadingSpinner />;
    }

    return (
        <BrowserRouter
            basename={removeIasoRoutes ? undefined : dashboardBasename}
        >
            {routes}
        </BrowserRouter>
    );
};

export default App;
