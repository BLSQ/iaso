export const formSuccessFullMessageKey = 'successful';
export const formErrorMessageKey = 'error';
export const formWarningMessageKey = 'warning';
export const buttonReloadMessageKey = 'reload';
export const reloadPageMessageKey = 'reloadPage';

export const succesfullSnackBar = (
    messageKey = formSuccessFullMessageKey,
    messageObject,
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
    messageObject,
    errorLog,
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
    messageObject,
    id,
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
    buttonAction: () => window.location.reload(true),
});
