import { LOCATION_CHANGE } from 'react-router-redux';

export const routerInitialState = {
    prevPathname: null,
    currentPathname: null,
};

export const routerReducer = (state = routerInitialState, action = {}) => {
    switch (action.type) {
        case LOCATION_CHANGE: {
            if (action.payload.action === 'PUSH') {
                return {
                    currentPathname: action.payload.pathname,
                    prevPathname:
                        state.currentPathname || action.payload.pathname,
                };
            }
            return state;
        }

        default:
            return state;
    }
};
