const SET_COMPLETENESS = 'SET_COMPLETENESS';
const SET_INSTANCE_STATUS = 'SET_INSTANCE_STATUS';
const SET_IS_FETCHING = 'SET_IS_FETCHING';

export const setCompletenessData = data => ({
    type: SET_COMPLETENESS,
    payload: {
        data,
    },
});

export const setInstanceStatus = instanceStatus => ({
    type: SET_INSTANCE_STATUS,
    payload: {
        instanceStatus,
    },
});


export const setIsFetching = isFetching => ({
    type: SET_IS_FETCHING,
    payload: isFetching,
});

export const completenessInitialState = {
    fetching: false,
    data: null,
    instanceStatus: [],
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

        case SET_INSTANCE_STATUS: {
            const {
                instanceStatus,
            } = action.payload;
            return {
                ...state,
                instanceStatus,
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
