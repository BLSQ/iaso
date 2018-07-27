
export const SHOW_TEAMS = 'hat/microplanning/team/SHOW_TEAMS';
export const FETCH_TEAMS = 'hat/microplanning/team/FETCH_TEAMS';

const req = require('superagent');

export const showTeams = teams => ({
    type: SHOW_TEAMS,
    payload: teams,
});

export const fetchTeams = (dispatch) => {
    req
        .get('/api/teams/')
        .then((result) => {
            dispatch(showTeams(result.body));
        })
        .catch(err => (console.error(`Error while fetching teams ${err}`)));
    return ({
        type: FETCH_TEAMS,
    });
};

export const teamActions = {
    showTeams,
    fetchTeams,
};

export const teamReducer = (state = {}, action = {}) => {
    switch (action.type) {
        case SHOW_TEAMS: {
            const list = action.payload;
            return { ...state, list };
        }
        case FETCH_TEAMS: {
            return state;
        }
        default:
            return state;
    }
};
