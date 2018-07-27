export const LOAD_LOCATIONS = 'hat/management/LOAD_LOCATIONS';
export const LOAD_COORDINATIONS = 'hat/management/LOAD_COORDINATIONS';


export const loadLocations = payload => ({
    type: LOAD_LOCATIONS,
    payload,
});

export const loadCoordinations = payload => ({
    type: LOAD_COORDINATIONS,
    payload,
});


export const coordinationsActions = {
    loadLocations,
    loadCoordinations,
};

export const coordinationsInitialState = {
    locations: [],
    list: [],
};

export const coordinationsReducer = (state = coordinationsInitialState, action = {}) => {
    switch (action.type) {
        case LOAD_LOCATIONS: {
            const locations = action.payload;
            return { ...state, locations };
        }
        case LOAD_COORDINATIONS: {
            const list = action.payload;
            return { ...state, list };
        }

        default:
            return state;
    }
};
