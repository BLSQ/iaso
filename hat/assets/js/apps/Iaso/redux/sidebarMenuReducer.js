const TOGGLE_SIDEBAR = 'TOGGLE_SIDEBAR';

export const toggleSidebarMenu = anchor => ({
    type: TOGGLE_SIDEBAR,
    anchor,
});

export const sidebarMenuInitialState = {
    isOpen: false,
    anchor: 'left',
};

export const sidebarMenuReducer = (
    state = sidebarMenuInitialState,
    action = {},
) => {
    switch (action.type) {
        case TOGGLE_SIDEBAR: {
            console.log(action);
            return {
                ...state,
                isOpen: !state.isOpen,
                anchor: action.anchor ?? state.anchor,
            };
        }

        default:
            return state;
    }
};
