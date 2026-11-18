import { IntlMessage } from 'bluesquare-components';

// A snack bar can receive a descriptor, or a string already produced by formatMessage.
type SnackBarMessage = string | IntlMessage | null;

export const formSuccessFullMessageKey = 'successful';
export const formErrorMessageKey = 'error';
export const formWarningMessageKey = 'warning';
export const buttonReloadMessageKey = 'reload';
export const reloadPageMessageKey = 'reloadPage';

export const succesfullSnackBar = (
    messageKey = formSuccessFullMessageKey,
    messageObject?: SnackBarMessage,
) => ({
    messageKey,
    messageObject,
    options: {
        variant: 'success',
        persist: false,
    },
});
export const successfullSnackBarWithButtons = ({
    messageKey = formSuccessFullMessageKey,
    messageObject,
    persist,
    buttonMessageKey,
    buttonAction,
}: {
    messageKey?: string;
    messageObject?: SnackBarMessage;
    persist?: boolean;
    buttonMessageKey?: string;
    buttonAction?: () => void;
}) => ({
    messageKey,
    messageObject,
    options: {
        variant: 'success',
        persist,
    },
    buttonMessageKey,
    buttonAction,
});

export const errorSnackBar = (
    messageKey = formErrorMessageKey,
    messageObject?: SnackBarMessage,
    errorLog?: unknown,
) => ({
    messageKey,
    messageObject,
    options: {
        variant: 'error',
        persist: Boolean(errorLog),
    },
    errorLog,
    id: `${messageKey}-${Date.now()}`,
});

export const warningSnackBar = (
    messageKey = formWarningMessageKey,
    messageObject?: SnackBarMessage,
    id?: string,
) => ({
    messageKey,
    messageObject,
    options: {
        maxsnack: 1, // always display snackBar
        variant: 'warning',
        persist: true,
    },
    id: id || messageKey,
});

export const reloadPageSnackBar = (
    buttonMessageKey = buttonReloadMessageKey,
    messageKey = reloadPageMessageKey,
) => ({
    messageKey,
    type: 'reload',
    options: {
        maxsnack: 0, // always display snackBar
        variant: 'warning',
        persist: true,
    },
    buttonMessageKey,
    // forceGet arg is legacy; kept for same call shape
    buttonAction: () =>
        (window.location.reload as (forceGet?: boolean) => void)(true),
});
