import { SET_INSTANCES_FILTER_UDPATED } from './actions';

export const instancesInitialState = {
    isInstancesFilterUpdated: false,
};

export const instancesReducer = (
    state = instancesInitialState,
    action = {},
) => {
    switch (action.type) {
        case SET_INSTANCES_FILTER_UDPATED: {
            const isInstancesFilterUpdated = action.payload;
            return { ...state, isInstancesFilterUpdated };
        }

        default:
            return state;
    }
};
