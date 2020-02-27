const SET_PERIODS = 'SET_PERIODS';
const SET_PERIOD_TYPES = 'SET_PERIOD_TYPES';

export const setPeriods = list => ({
    type: SET_PERIODS,
    payload: list,
});

export const setPeriodTypes = periodTypes => ({
    type: SET_PERIOD_TYPES,
    payload: {
        periodTypes,
    },
});


export const periodsInitialState = {
    list: [],
    periodTypes: [],
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

        case SET_PERIOD_TYPES: {
            const {
                periodTypes,
            } = action.payload;
            return {
                ...state,
                periodTypes,
            };
        }

        default:
            return state;
    }
};
