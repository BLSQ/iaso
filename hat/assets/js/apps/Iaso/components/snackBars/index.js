export const formSuccessFullMessageKey = 'successful';
export const formErrorMessageKey = 'error';
export const buttonReloadMessageKey = 'reload';
export const reloadPageMessageKey = 'reloadPage';


export const succesfullSnackBar = (messageKey = formSuccessFullMessageKey) => ({
    messageKey,
    options: {
        variant: 'success',
        persist: false,
    },
});

export const errorSnackBar = (messageKey = formErrorMessageKey) => ({
    messageKey,
    options: {
        variant: 'error',
        persist: false,
    },
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
