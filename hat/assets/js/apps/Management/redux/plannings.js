export const LOAD_PLANNINGS = 'hat/management/LOAD_PLANNINGS';


export const loadPlannings = payload => ({
    type: LOAD_PLANNINGS,
    payload,
});


export const planningsActions = {
    loadPlannings,
};

export const planningsInitialState = {
    list: [],
};

export const planningsReducer = (state = planningsInitialState, action = {}) => {
    switch (action.type) {
        case LOAD_PLANNINGS: {
            const list = action.payload;
            return { ...state, list };
        }

        default:
            return state;
    }
};
