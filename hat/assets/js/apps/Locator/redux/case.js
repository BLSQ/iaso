/*
 * Includes the actions and state necessary for the villageFilters process
 */

export const SET_CASE = 'hat/locator/cases/SET_CASE';
export const SET_LIST = 'hat/locator/cases/SET_LIST';

// Note: `TypeError: Object.values is not a function` in tests :'(

export const setList = list => ({
    type: SET_LIST,
    payload: list,
});

export const setCase = kase => ({
    type: SET_CASE,
    payload: kase,
});

export const caseActions = {
    setCase,
    setList,
};

export const caseReducer = (state = {}, action = {}) => {
    switch (action.type) {
        case SET_CASE: {
            const newCase = action.payload;
            return { ...state, case: newCase };
        }
        case SET_LIST: {
            const list = action.payload;
            return { ...state, list };
        }
        default:
            return state;
    }
};
