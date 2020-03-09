export const SET_INSTANCES = 'SET_INSTANCES';
export const SET_INSTANCES_SMALL_DICT = 'SET_INSTANCES_SMALL_DICT';
export const SET_INSTANCES_FETCHING = 'SET_INSTANCES_FETCHING';
export const SET_CURRENT_INSTANCE = 'SET_CURRENT_INSTANCE';


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
