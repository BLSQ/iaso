const SET_INSTANCES = 'SET_INSTANCES';
const SET_INSTANCES_LOCATIONS = 'SET_INSTANCES_LOCATIONS';


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

export const setInstancesLocations = instances => ({
    type: SET_INSTANCES_LOCATIONS,
    payload: instances,
});


export const instancesInitialState = {
    fetching: true,
    instancesLocations: [],
    instancesPage: {
        list: null,
        showPagination: false,
        params: {},
        count: 0,
        pages: 0,
    },
};

export const instancesReducer = (state = instancesInitialState, action = {}) => {
    switch (action.type) {
        case SET_INSTANCES: {
            const {
                list, showPagination, params, count, pages,
            } = action.payload;
            return {
                ...state,
                fetching: false,
                instancesPage: {
                    list,
                    showPagination,
                    params,
                    count,
                    pages,
                },
            };
        }

        case SET_INSTANCES_LOCATIONS: {
            const instancesLocations = action.payload;
            return { ...state, instancesLocations };
        }

        default:
            return state;
    }
};
