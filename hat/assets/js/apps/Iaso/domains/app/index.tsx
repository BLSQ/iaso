import React, { FunctionComponent } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { LoadingSpinner } from 'bluesquare-components';
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
                <BrowserRouter basename="/dashboard">{routes}</BrowserRouter>
            )}
        </>
    );
};

export default App;
