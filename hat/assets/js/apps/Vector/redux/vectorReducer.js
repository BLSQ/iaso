/*
 * Includes the actions and state necessary for the vector process
 */

export const LOAD_TRAPS = 'hat/vector/LOAD_TRAPS';
export const LOAD_TARGETS = 'hat/vector/LOAD_TARGETS';
export const LOAD_VILLAGES = 'hat/vector/LOAD_VILLAGES';
export const LOAD_LOCATIONS = 'hat/vector/LOAD_LOCATIONS';
export const SELECT_TYPE = 'hat/vector/SELECT_TYPE';

export const loadTraps = payload => ({
    type: LOAD_TRAPS,
    payload,
});

export const loadTargets = payload => ({
    type: LOAD_TARGETS,
    payload,
});

export const loadVillages = payload => ({
    type: LOAD_VILLAGES,
    payload,
});

export const loadLocations = payload => ({
    type: LOAD_LOCATIONS,
    payload,
});

export const selectType = newType => ({
    type: SELECT_TYPE,
    payload: newType,
});


export const vectorActions = {
    loadTraps,
    loadTargets,
    loadVillages,
    loadLocations,
    selectType,
};

export const vectorInitialState = {
    currentTypes: ['YES'],
    traps: [],
    targets: [],
    villages: {},
};

export const vectorReducer = (state = vectorInitialState, action = {}) => {
    switch (action.type) {
        case LOAD_TRAPS: {
            const traps = action.payload;
            return { ...state, traps };
        }
        case LOAD_TARGETS: {
            const targets = action.payload;
            return { ...state, targets };
        }
        case LOAD_VILLAGES: {
            const villages = action.payload;
            return { ...state, villages };
        }
        case LOAD_LOCATIONS: {
            const locations = action.payload;
            return { ...state, locations };
        }
        case SELECT_TYPE: {
            const currentTypes = action.payload;
            return { ...state, currentTypes };
        }


        default:
            return state;
    }
};
