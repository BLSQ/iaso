import { LoadingSpinner } from 'bluesquare-components';
import { SnackbarProvider } from 'notistack';
import React, { FunctionComponent, ReactElement } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useSnackBars } from '../../components/snackBars/useSnackBars';
import LocalizedAppComponent from './components/LocalizedAppComponent';
import { useRoutes } from './hooks/useRoutes';
// import { router } from '../../routing/router';

type routesProps = {
    routes?: ReactElement | null;
};

const Routes: FunctionComponent<routesProps> = ({ routes }) => {
    useSnackBars();
    return <BrowserRouter basename="/dashboard">{routes}</BrowserRouter>;
};

type Props = {
    userHomePage?: string;
};
const App: FunctionComponent<Props> = ({ userHomePage }) => {
    const { routes, isLoadingRoutes } = useRoutes(
        userHomePage && userHomePage !== '' ? userHomePage : undefined,
    );

    return (
        <>
            {isLoadingRoutes && <LoadingSpinner />}
            {!isLoadingRoutes && (
                <LocalizedAppComponent>
                    <SnackbarProvider
                        maxSnack={3}
                        autoHideDuration={4000}
                        anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'center',
                        }}
                    >
                        <Routes routes={routes} />
                    </SnackbarProvider>
                </LocalizedAppComponent>
            )}
        </>
    );
};

export default App;
