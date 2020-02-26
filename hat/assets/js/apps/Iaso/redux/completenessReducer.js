const SET_COMPLETENESS = 'SET_COMPLETENESS';
const SET_PERIOD_TYPES = 'SET_PERIOD_TYPES';
const SET_IS_FETCHING = 'SET_IS_FETCHING';

export const setCompletenessData = data => ({
    type: SET_COMPLETENESS,
    payload: {
        data,
    },
});

export const setPeriodTypes = periodTypes => ({
    type: SET_PERIOD_TYPES,
    payload: {
        periodTypes,
    },
});


export const setIsFetching = isFetching => ({
    type: SET_IS_FETCHING,
    payload: isFetching,
});

export const completenessInitialState = {
    fetching: false,
    data: null,
    periodTypes: [],
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
        case SET_PERIOD_TYPES: {
            const {
                periodTypes,
            } = action.payload;
            return {
                ...state,
                periodTypes,
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
