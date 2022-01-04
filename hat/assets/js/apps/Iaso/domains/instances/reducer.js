import {
    SET_INSTANCES_FETCHING,
    SET_CURRENT_INSTANCE,
    SET_INSTANCES_FILTER_UDPATED,
} from './actions';

export const instancesInitialState = {
    fetching: true,
    current: null,
    isInstancesFilterUpdated: false,
};

export const instancesReducer = (
    state = instancesInitialState,
    action = {},
) => {
    switch (action.type) {
        case SET_INSTANCES_FETCHING: {
            const fetching = action.payload;
            return { ...state, fetching };
        }

        case SET_CURRENT_INSTANCE: {
            const current = action.payload;
            return { ...state, current };
        }

        case SET_INSTANCES_FILTER_UDPATED: {
            const isInstancesFilterUpdated = action.payload;
            return { ...state, isInstancesFilterUpdated };
        }

        default:
            return state;
    }
};
