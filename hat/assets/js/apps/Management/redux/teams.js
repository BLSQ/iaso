export const LOAD_COORDINATIONS = 'hat/management/LOAD_COORDINATIONS';
export const LOAD_TEAM_TYPES = 'hat/management/LOAD_TEAM_TYPES';
export const LOAD_TEAMS = 'hat/lmanagement/LOAD_TEAMS';

export const loadCoordinations = payload => ({
    type: LOAD_COORDINATIONS,
    payload,
});

export const loadTeamTypes = payload => ({
    type: LOAD_TEAM_TYPES,
    payload,
});

export const loadTeams = payload => ({
    type: LOAD_TEAMS,
    payload,
});

export const teamsActions = {
    loadCoordinations,
    loadTeamTypes,
    loadTeams,
};

export const teamsInitialState = {
    coordinations: [],
    teamTypes: [],
    teams: [],
};

export const teamsReducer = (state = teamsInitialState, action = {}) => {
    switch (action.type) {
        case LOAD_COORDINATIONS: {
            const coordinations = action.payload;
            return { ...state, coordinations };
        }
        case LOAD_TEAM_TYPES: {
            const teamTypes = action.payload;
            const mappedTeamTypes = [];
            teamTypes.forEach((type) => {
                mappedTeamTypes.push({
                    label: type[1],
                    value: type[0],
                });
            });
            return { ...state, teamTypes: mappedTeamTypes };
        }
        case LOAD_TEAMS: {
            const list = action.payload;
            return { ...state, list };
        }

        default:
            return state;
    }
};
