export const LOAD_COORDINATIONS = 'hat/management/LOAD_COORDINATIONS';
export const LOAD_TEAMS = 'hat/lmanagement/LOAD_TEAMS';

export const loadCoordinations = payload => ({
    type: LOAD_COORDINATIONS,
    payload,
});
export const loadTeams = payload => ({
    type: LOAD_TEAMS,
    payload,
});

export const teamsActions = {
    loadCoordinations,
    loadTeams,
};

export const teamsInitialState = {
    coordinations: [],
    teams: [],
};

export const teamsReducer = (state = teamsInitialState, action = {}) => {
    switch (action.type) {
        case LOAD_COORDINATIONS: {
            const coordinations = action.payload;
            return { ...state, coordinations };
        }
        case LOAD_TEAMS: {
            const list = action.payload;
            return { ...state, list };
        }

        default:
            return state;
    }
};
