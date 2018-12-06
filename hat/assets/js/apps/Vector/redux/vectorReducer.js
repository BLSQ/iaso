/*
 * Includes the actions and state necessary for the vector process
 */

export const LOAD_TRAPS = 'hat/vector/LOAD_TRAPS';
export const LOAD_TARGETS = 'hat/vector/LOAD_TARGETS';
export const LOAD_NON_ENDEMIC_VILLAGES = 'hat/vector/LOAD_NON_ENDEMIC_VILLAGES';
export const LOAD_ENDEMIC_VILLAGES = 'hat/vector/LOAD_ENDEMIC_VILLAGES';
export const SELECT_TYPE = 'hat/vector/SELECT_TYPE';
export const FETCH_ACTION = 'hat/vector/FETCH_ACTION';


export const loadTraps = payload => ({
    type: LOAD_TRAPS,
    payload,
});

export const loadTargets = payload => ({
    type: LOAD_TARGETS,
    payload,
});

export const loadNonEndemicVillages = payload => ({
    type: LOAD_NON_ENDEMIC_VILLAGES,
    payload,
});
export const loadEndemicVillages = payload => ({
    type: LOAD_ENDEMIC_VILLAGES,
    payload,
});

export const selectType = newType => ({
    type: SELECT_TYPE,
    payload: newType,
});

export const vectorActions = {
    selectType,
    loadTraps,
    loadTargets,
    loadNonEndemicVillages,
    loadEndemicVillages,
};

export const vectorInitialState = {
    currentTypes: ['YES'],
    traps: null,
    targets: null,
    endemicVillages: undefined,
    nonEndemicVillages: undefined,
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
        case LOAD_ENDEMIC_VILLAGES: {
            const endemicVillages = action.payload;
            return { ...state, endemicVillages };
        }
        case LOAD_NON_ENDEMIC_VILLAGES: {
            const nonEndemicVillages = action.payload;
            return { ...state, nonEndemicVillages };
        }
        case SELECT_TYPE: {
            const currentTypes = action.payload;
            return { ...state, currentTypes };
        }


        default:
            return state;
    }
};
