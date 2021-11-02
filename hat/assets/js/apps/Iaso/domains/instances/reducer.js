import {
    SET_INSTANCES,
    SET_INSTANCES_FETCHING,
    SET_CURRENT_INSTANCE,
    SET_INSTANCES_FILTER_UDPATED,
    RESET_INSTANCES,
} from './actions';

export const instancesInitialState = {
    fetching: true,
    instancesPage: {
        list: null,
        showPagination: false,
        params: {},
        count: 0,
        pages: 0,
    },
    current: null,
    isInstancesFilterUpdated: false,
};

export const instancesReducer = (
    state = instancesInitialState,
    action = {},
) => {
    switch (action.type) {
        case SET_INSTANCES: {
            const { list, showPagination, params, count, pages } =
                action.payload;
            return {
                ...state,
                instancesPage: {
                    list,
                    showPagination,
                    params,
                    count,
                    pages,
                },
            };
        }

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

        case RESET_INSTANCES: {
            return instancesInitialState;
        }

        default:
            return state;
    }
};
