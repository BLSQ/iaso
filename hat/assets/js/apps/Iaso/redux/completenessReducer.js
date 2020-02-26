const SET_COMPLETENESS = 'SET_COMPLETENESS';
const SET_PERIOD_TYPE = 'SET_PERIOD_TYPE';
const SET_IS_FETCHING = 'SET_IS_FETCHING';

export const setCompletenessData = data => ({
    type: SET_COMPLETENESS,
    payload: {
        data,
    },
});

export const setPeriodType = periodType => ({
    type: SET_PERIOD_TYPE,
    payload: {
        periodType,
    },
});


export const setIsFetching = isFetching => ({
    type: SET_IS_FETCHING,
    payload: isFetching,
});

export const completenessInitialState = {
    fetching: false,
    data: null,
    periodType: 'quarterly',
};

export const completenessReducer = (state = completenessInitialState, action = {}) => {
    switch (action.type) {
        case SET_COMPLETENESS: {
            const {
                data,
            } = action.payload;
            return {
                ...state,
                data,
            };
        }
        case SET_PERIOD_TYPE: {
            const {
                periodType,
            } = action.payload;
            return {
                ...state,
                periodType,
            };
        }

        case SET_IS_FETCHING: {
            const fetching = action.payload;
            return { ...state, fetching };
        }

        default:
            return state;
    }
};
