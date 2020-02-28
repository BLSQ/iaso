const SET_INSTANCES = 'SET_INSTANCES';
const SET_INSTANCES_SMALL_DICT = 'SET_INSTANCES_SMALL_DICT';
const SET_INSTANCES_FETCHING = 'SET_INSTANCES_FETCHING';
const SET_CURRENT_INSTANCE = 'SET_CURRENT_INSTANCE';
const SET_INSTANCE_STATUS = 'SET_INSTANCE_STATUS';


export const setInstances = (list, showPagination, params, count, pages) => ({
    type: SET_INSTANCES,
    payload: {
        list,
        showPagination,
        params,
        count,
        pages,
    },
});

export const setInstancesSmallDict = instances => ({
    type: SET_INSTANCES_SMALL_DICT,
    payload: instances,
});


export const setInstancesFetching = isFetching => ({
    type: SET_INSTANCES_FETCHING,
    payload: isFetching,
});

export const setCurrentInstance = instance => ({
    type: SET_CURRENT_INSTANCE,
    payload: instance,
});

export const setInstanceStatus = instanceStatus => ({
    type: SET_INSTANCE_STATUS,
    payload: {
        instanceStatus,
    },
});


export const instancesInitialState = {
    fetching: false,
    instancesSmall: [],
    instancesPage: {
        list: null,
        showPagination: false,
        params: {},
        count: 0,
        pages: 0,
    },
    current: null,
    instanceStatus: [],
    onlyMetas: true,
};

export const instancesReducer = (state = instancesInitialState, action = {}) => {
    switch (action.type) {
        case SET_INSTANCES: {
            const {
                list, showPagination, params, count, pages,
            } = action.payload;
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

        case SET_INSTANCES_SMALL_DICT: {
            const instancesSmall = action.payload;
            return { ...state, instancesSmall };
        }

        case SET_INSTANCES_FETCHING: {
            const fetching = action.payload;
            return { ...state, fetching };
        }

        case SET_CURRENT_INSTANCE: {
            const current = action.payload;
            return { ...state, current };
        }

        case SET_INSTANCE_STATUS: {
            const {
                instanceStatus,
            } = action.payload;
            return {
                ...state,
                instanceStatus,
            };
        }

        default:
            return state;
    }
};
