const TOGGLE_SIDEBAR = 'TOGGLE_SIDEBAR';

export const toggleSidebarMenu = () => ({
    type: TOGGLE_SIDEBAR,
});

export const sidebarMenuInitialState = {
    isOpen: false,
};

export const sidebarMenuReducer = (
    state = sidebarMenuInitialState,
    action = {},
) => {
    switch (action.type) {
        case TOGGLE_SIDEBAR: {
            return {
                ...state,
                isOpen: !state.isOpen,
            };
        }

        default:
            return state;
    }
};
