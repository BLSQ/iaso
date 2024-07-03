import { LoadingSpinner } from 'bluesquare-components';
import React, { FunctionComponent } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { useSnackBars } from '../../components/snackBars/useSnackBars';
import { useRoutes } from './hooks/useRoutes';

type Props = {
    userHomePage?: string;
};

const App: FunctionComponent<Props> = ({ userHomePage }) => {
    const { nonDashboardRoutes, routes, isLoadingRoutes } = useRoutes(
        userHomePage && userHomePage !== '' ? userHomePage : undefined,
    );
    useSnackBars();
    return (
        <>
            {isLoadingRoutes && <LoadingSpinner />}
            {!isLoadingRoutes && (
                <BrowserRouter>
                    <Routes>
                        <Route path="/dashboard/*" element={routes} />
                        <Route path="/*" element={nonDashboardRoutes} />
                    </Routes>
                </BrowserRouter>
            )}
        </>
    );
};

export default App;
