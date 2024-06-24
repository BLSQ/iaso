import { useSnackbar } from 'notistack';
import React, { useEffect } from 'react';

import { useSafeIntl } from 'bluesquare-components';
import SnackBarButton from './SnackBarButton';
import SnackBarErrorMessage from './SnackBarErrorMessage';

import { dispatcher } from './EventDispatcher';
import MESSAGES from './messages';

type Notification = {
    key: string;
    messageKey: string;
    message?: any;
    messageObject?: string | { id: string };
    buttonMessageKey?: string;
    buttonAction?: () => void;
    errorLog?: string;
    id: string;
    options: {
        persist?: boolean;
        action?: React.ReactNode;
    };
};

export const useTranslateMessage = () => {
    const { formatMessage } = useSafeIntl();

    return (notification: Notification) => {
        if (notification.messageObject) {
            if (typeof notification.messageObject === 'string') {
                return notification.messageObject;
            }
            if (notification.messageObject.id) {
                return formatMessage(notification.messageObject);
            }
            console.error(
                `Invalid translation message for snackbar ${notification.messageObject}`,
            );
            return formatMessage(MESSAGES.error); // some message here
        }
        if (notification.messageKey) {
            if (MESSAGES[notification.messageKey]) {
                return formatMessage(MESSAGES[notification.messageKey]);
            }
            console.error(
                `Translation ${notification.messageKey} not present in SnackBar messages`,
            );
        }
        return formatMessage(MESSAGES.error); // handle case with no messageKey  and no messageObject
    };
};

export const useSnackBars = () => {
    const { enqueueSnackbar } = useSnackbar();
    const translateMessage = useTranslateMessage();
    useEffect(() => {
        const handleSnackbarEvent = (notification: Notification) => {
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
            enqueueSnackbar(translateMessage(notification), options);
        };

        dispatcher.addEventListener('snackbar', handleSnackbarEvent);

        return () => {
            dispatcher.removeEventListener('snackbar', handleSnackbarEvent);
        };
    }, [enqueueSnackbar, translateMessage]);
};
