export const SET_LINKS = 'SET_LINKS';
export const SET_ALGO_LIST = 'SET_ALGO_LIST';
export const SET_ALGO_RUNS_LIST = 'SET_ALGO_RUNS_LIST';

export const setAlgorithms = algoList => ({
    type: SET_ALGO_LIST,
    payload: algoList,
});

export const setAlgorithmRuns = algoRunsList => ({
    type: SET_ALGO_RUNS_LIST,
    payload: algoRunsList,
});
