import { LoadingSpinner, useSafeIntl } from 'bluesquare-components';
import { useSnackbar } from 'notistack';
import React, { FunctionComponent, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { dispatcher } from '../../components/snackBars/EventDispatcher';
import SnackBarButton from '../../components/snackBars/SnackBarButton';
import SnackBarErrorMessage from '../../components/snackBars/SnackBarErrorMessage';
import { translateMessage } from '../../components/snackBars/useSnackBars';
import { useRoutes } from './hooks/useRoutes';
// import { router } from '../../routing/router';

type Props = {
    userHomePage?: string;
};

const App: FunctionComponent<Props> = ({ userHomePage }) => {
    const { routes, isLoadingRoutes } = useRoutes(
        userHomePage && userHomePage !== '' ? userHomePage : undefined,
    );
    const { enqueueSnackbar } = useSnackbar();
    const { formatMessage } = useSafeIntl();

    useEffect(() => {
        const handleSnackbarEvent = notification => {
            console.log('notification', notification);
            const options = {
                ...notification?.options,
                key: notification.id,
            };

            if (notification.buttonMessageKey && notification.buttonAction) {
                options.action = (
                    <SnackBarButton
                        messageKey={notification.buttonMessageKey}
                        onClick={() =>
                            notification.buttonAction &&
                            notification.buttonAction()
                        }
                    />
                );
            }

            if (notification.errorLog) {
                options.action = (
                    <SnackBarErrorMessage
                        errorLog={notification.errorLog}
                        id={notification.id}
                    />
                );
            }
            enqueueSnackbar(
                translateMessage(notification, formatMessage),
                options,
            );
        };

        dispatcher.addEventListener('snackbar', handleSnackbarEvent);

        return () => {
            dispatcher.removeEventListener('snackbar', handleSnackbarEvent);
        };
    }, [enqueueSnackbar, formatMessage]);
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
