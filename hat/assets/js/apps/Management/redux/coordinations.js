export const LOAD_LOCATIONS = 'hat/locator/cases/LOAD_LOCATIONS';


export const loadLocations = payload => ({
    type: LOAD_LOCATIONS,
    payload,
});

export const coordinationsActions = {
    loadLocations,
};

export const coordinationsInitialState = {
    locations: [],
};

export const coordinationsReducer = (state = coordinationsInitialState, action = {}) => {
    switch (action.type) {
        case LOAD_LOCATIONS: {
            const locations = action.payload;
            return { ...state, locations };
        }

        default:
            return state;
    }
};
