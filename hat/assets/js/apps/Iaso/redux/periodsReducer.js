const SET_PERIODS = 'SET_PERIODS';

export const setPeriods = list => ({
    type: SET_PERIODS,
    payload: list,
});

export const periodsInitialState = {
    list: [],
};

export const periodsReducer = (state = periodsInitialState, action = {}) => {
    switch (action.type) {
        case SET_PERIODS: {
            const list = action.payload;
            return {
                ...state,
                list,
            };
        }

        default:
            return state;
    }
};
