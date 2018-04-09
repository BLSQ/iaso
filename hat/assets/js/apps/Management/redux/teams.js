export const LOAD_COORDINATIONS = 'hat/locator/cases/LOAD_COORDINATIONS';


export const loadCoordinations = payload => ({
    type: LOAD_COORDINATIONS,
    payload,
});

export const teamsActions = {
    loadCoordinations,
};

export const teamsInitialState = {
    coordinations: [],
};

export const teamsReducer = (state = teamsInitialState, action = {}) => {
    switch (action.type) {
        case LOAD_COORDINATIONS: {
            const coordinations = action.payload;
            return { ...state, coordinations };
        }

        default:
            return state;
    }
};
