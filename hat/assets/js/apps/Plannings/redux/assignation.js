import { loadActions } from '../../../redux/load';

export const SHOW_ASSIGNATIONS = 'hat/microplanning/assignation/SHOW_ASSIGNATIONS';
export const FETCH_ASSIGNATIONS = 'hat/microplanning/assignation/FETCH_ASSIGNATIONS';
export const UPDATE_ASSIGNATIONS = 'hat/microplanning/assignation/UPDATE_ASSIGNATIONS';

const req = require('superagent');

export const showAssignations = assignations => ({
    type: SHOW_ASSIGNATIONS,
    payload: assignations,
});

export const fetchAssignations = (params, dispatch, withTestsCount = false) => {
    dispatch(loadActions.startLoading());
    const teamId = params.team_id;
    const planningId = params.planning_id;
    let url = `/api/assignations/?${planningId ?
        `&planning_id=${planningId}` : ''}${teamId ?
        `&team_id=${teamId}` : ''}&show_case_count=true`;
    if (withTestsCount) {
        url += '&show_tests_count=true';
    }
    req
        .get(url)
        .then((result) => {
            dispatch(loadActions.successLoadingNoData());
            dispatch(showAssignations(result.body));
        })
        .catch((err) => {
            dispatch(loadActions.errorLoading(err));
            console.error(`Error while fetching assignations: ${err}`);
        });
    return ({
        type: FETCH_ASSIGNATIONS,
    });
};


export const updateAssignation = (index, month, assignationId, dispatch, withTestsCount = false) => {
    const data = {
        index,
        month,
    };
    if (withTestsCount) {
        data.show_tests_count = true;
    }
    dispatch(loadActions.startLoading());
    req
        .patch(`/api/assignations/${assignationId}/`)
        .set('Content-Type', 'application/json')
        .send(data)
        .then((result) => {
            dispatch(loadActions.successLoadingNoData());
            dispatch(showAssignations(result.body));
        })
        .catch((err) => {
            dispatch(loadActions.errorLoading(err));
            console.error(`Error while updating assignations: ${err}`);
        });
    return ({
        type: UPDATE_ASSIGNATIONS,
    });
};


export const assignationActions = {
    showAssignations,
    fetchAssignations,
    updateAssignation,
};

export const assignationReducer = (state = {}, action = {}) => {
    switch (action.type) {
        case SHOW_ASSIGNATIONS: {
            const list = action.payload;
            return { ...state, list };
        }
        case FETCH_ASSIGNATIONS: {
            return state;
        }
        case UPDATE_ASSIGNATIONS: {
            return state;
        }

        default:
            return state;
    }
};
