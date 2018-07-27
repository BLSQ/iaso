export const SHOW_PLANNINGS = 'hat/microplanning/planning/SHOW_PLANNINGS';
export const FETCH_PLANNINGS = 'hat/microplanning/planning/FETCH_PLANNINGS';

const req = require('superagent');

export const showPlannings = plannings => ({
    type: SHOW_PLANNINGS,
    payload: plannings,
});

export const fetchPlannings = (dispatch) => {
    req
        .get('/api/plannings/')
        .then((result) => {
            dispatch(showPlannings(result.body));
        })
        .catch(err => (console.error(`Error while fetching plannings ${err}`)));
    return ({
        type: FETCH_PLANNINGS,
    });
};


export const planningActions = {
    showPlannings,
    fetchPlannings,
};

export const planningReducer = (state = {}, action = {}) => {
    switch (action.type) {
        case SHOW_PLANNINGS: {
            const list = action.payload;
            return { ...state, list };
        }
        case FETCH_PLANNINGS: {
            return state;
        }

        default:
            return state;
    }
};
