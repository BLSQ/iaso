import { LOCATION_CHANGE } from 'react-router-redux';

export const routerInitialState = {
    prevPathname: null,
};

export const routerReducer = (state = routerInitialState, action = {}) => {
    switch (action.type) {
        case LOCATION_CHANGE: {
            return {
                prevPathname: action.payload.action === 'PUSH'
                    ? action.payload.pathname : state.prevPathname,
            };
        }

        default:
            return state;
    }
};
