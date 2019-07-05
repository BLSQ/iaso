const SET_INSTANCES = 'SET_INSTANCES';


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


export const instancesInitialState = {
    fetching: true,
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

        default:
            return state;
    }
};
