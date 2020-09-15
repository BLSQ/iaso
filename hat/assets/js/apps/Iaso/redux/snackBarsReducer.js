const ENQUEUE_SNACKBAR = 'ENQUEUE_SNACKBAR';
const REMOVE_SNACKBAR = 'REMOVE_SNACKBAR';
const CLOSE_FIXED_SNACKBAR = 'CLOSE_FIXED_SNACKBAR';

export const enqueueSnackbar = notification => ({
    type: ENQUEUE_SNACKBAR,
    notification: {
        key: new Date().getTime() + Math.random(),
        ...notification,
    },
});

export const removeSnackbar = key => ({
    type: REMOVE_SNACKBAR,
    key,
});

export const closeFixedSnackbar = id => ({
    type: CLOSE_FIXED_SNACKBAR,
    id,
});

export const snackBarsInitialState = {
    notifications: [],
};

export const snackBarsReducer = (
    state = snackBarsInitialState,
    action = {},
) => {
    switch (action.type) {
        case ENQUEUE_SNACKBAR:
            return {
                ...state,
                notifications: [
                    ...state.notifications,
                    {
                        ...action.notification,
                    },
                ],
            };

        case CLOSE_FIXED_SNACKBAR:
            return {
                ...state,
                notifications: state.notifications.filter(
                    notification =>
                        notification.options.persist &&
                        notification.id !== action.id,
                ),
            };

        case REMOVE_SNACKBAR:
            return {
                ...state,
                notifications: state.notifications.filter(
                    notification => notification.key !== action.key,
                ),
            };

        default:
            return state;
    }
};
