import React, { useEffect, useCallback, useState } from 'react';
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

const translateMessage = (notification, formatMessage) => {
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

export const useSnackBars = (): void => {
    const [displayed, setDisplayed] = useState<Notification[]>([]);

    const saveDisplayedSnackBar = useCallback((snackBar: Notification) => {
        setDisplayed(prevDisplayed => [...prevDisplayed, snackBar]);
    }, []);
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

            if (notification.errorLog) {
                options.action = (
                    <SnackBarErrorMessage
                        errorLog={notification.errorLog}
                        id={notification.id ? notification.id.toString() : null}
                    />
                );
            }
            const id = enqueueSnackbar(
                translateMessage(notification, formatMessage),
                options,
            );

            saveDisplayedSnackBar({
                key: notification.key,
                messageKey: notification.messageKey,
                options,
                id,
            });
        },
        [enqueueSnackbar, saveDisplayedSnackBar, formatMessage],
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
    }, [notifications, closeSnackbar, displayed]);

    useEffect(() => {
        notifications.forEach(notification => {
            if (!displayed.find(s => s.key === notification.key)) {
                displaySnackBars(notification);
                if (!notification.options.persist) {
                    dispatch(removeSnackbar(notification.key));
                }
            }
        });
        closePersistingSnackBars();
    }, [
        notifications,
        dispatch,
        closePersistingSnackBars,
        displaySnackBars,
        displayed,
    ]);
};
