import React, { useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useSnackbar } from 'notistack';

import { useSafeIntl } from 'bluesquare-components';
import { removeSnackbar } from '../../redux/snackBarsReducer';
import SnackBarButton from './SnackBarButton';
import SnackBarErrorMessage from './SnackBarErrorMessage';

import MESSAGES from './messages';

type Notification = {
    key: string;
    messageKey: string;
    message?: any;
    messageObject?: string | { id: string };
    buttonMessageKey?: string;
    buttonAction?: () => void;
    errorLog?: string;
    id?: string | number | undefined;
    options: {
        persist?: boolean;
        action?: React.ReactNode;
    };
};

let displayed: Notification[] = [];
const saveDisplayedSnackBar = (snackBar: Notification) => {
    displayed = [...displayed, snackBar];
};

export const useSnackBars = (): void => {
    const notifications = useSelector(
        (state: { snackBar?: { notifications: Notification[] } }) =>
            state.snackBar ? state.snackBar.notifications : [],
    );
    const { formatMessage } = useSafeIntl();
    const dispatch = useDispatch();
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    const displaySnackBars = useCallback(
        (notification: Notification) => {
            const options = {
                ...notification.options,
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

            let message;
            if (notification.messageObject) {
                if (typeof notification.messageObject === 'string') {
                    message = notification.messageObject;
                } else if (notification.messageObject.id) {
                    message = formatMessage(notification.messageObject);
                } else {
                    console.error(
                        `Invalid translation message for snackbar ${notification.messageObject}`,
                    );
                    message = 'Error';
                }
            } else if (MESSAGES[notification.messageKey]) {
                message = formatMessage(MESSAGES[notification.messageKey]);
            } else {
                console.warn(
                    `Translation ${notification.messageKey} not present in SnackBar messages`,
                );
                message = 'Error';
            }

            if (notification.errorLog) {
                options.action = (
                    <SnackBarErrorMessage
                        errorLog={notification.errorLog}
                        id={notification.id ? notification.id.toString() : null}
                    />
                );
            }
            const id = enqueueSnackbar(message, options);

            saveDisplayedSnackBar({
                key: notification.key,
                messageKey: notification.messageKey,
                options,
                id,
            });
        },
        [enqueueSnackbar, formatMessage],
    );

    const closePersistingSnackBars = useCallback(() => {
        displayed.forEach(displayedNotification => {
            if (
                displayedNotification.options.persist &&
                !notifications.find(n => n.key === displayedNotification.key)
            ) {
                closeSnackbar(displayedNotification.id);
            }
        });
    }, [notifications, closeSnackbar]);

    useEffect(() => {
        notifications.forEach(notification => {
            if (displayed.find(s => s.key === notification.key)) return;

            displaySnackBars(notification);
            if (!notification.options.persist) {
                dispatch(removeSnackbar(notification.key));
            }
        });
        closePersistingSnackBars();
    }, [notifications, dispatch, closePersistingSnackBars, displaySnackBars]);
};
