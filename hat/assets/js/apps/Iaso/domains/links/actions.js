export const SET_LINKS = 'SET_LINKS';
export const SET_RUNS = 'SET_RUNS';
export const SET_ALGO_LIST = 'SET_ALGO_LIST';
export const SET_ALGO_RUNS_LIST = 'SET_ALGO_RUNS_LIST';
export const SET_IS_FETCHING = 'SET_IS_FETCHING';

export const setLinks = (list, showPagination, params, count, pages) => ({
    type: SET_LINKS,
    payload: {
        list,
        showPagination,
        params,
        count,
        pages,
    },
});

export const setRuns = (list, showPagination, params, count, pages) => ({
    type: SET_RUNS,
    payload: {
        list,
        showPagination,
        params,
        count,
        pages,
    },
});

export const setAlgorithms = algoList => ({
    type: SET_ALGO_LIST,
    payload: algoList,
});

export const setAlgorithmRuns = algoRunsList => ({
    type: SET_ALGO_RUNS_LIST,
    payload: algoRunsList,
});

export const setIsFetching = isFetching => ({
    type: SET_IS_FETCHING,
    payload: isFetching,
});
