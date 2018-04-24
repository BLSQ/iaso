/*
 * Includes the actions and state necessary for the selection process
 */

export const SELECTION_DISABLED = 'hat/microplanning/selection/SELECTION_DISABLED';
export const SELECTION_MODE_CHANGE = 'hat/microplanning/selection/SELECTION_MODE_CHANGE';
export const SELECTION_EXECUTE = 'hat/microplanning/selection/EXECUTE';

export const BUFFER_SIZE_CHANGE = 'hat/microplanning/selection/BUFFER_SIZE_CHANGE';
export const HIGHLIGHT_BUFFER_SIZE_CHANGE = 'hat/microplanning/selection/HIGHLIGHT_BUFFER_SIZE_CHANGE';

export const SELECT_ITEMS = 'hat/microplanning/selection/SELECT_ITEMS';
export const DESELECT_ITEMS = 'hat/microplanning/selection/DESELECT_ITEMS';

export const DISPLAY_ITEM = 'hat/microplanning/selection/DISPLAY_ITEM';
export const TOGGLE_GEO_SCOPE = 'hat/microplanning/selection/TOGGLE_GEO_SCOPE';
export const UPDATE_GEO_SCOPE = 'hat/microplanning/selection/UPDATE_GEO_SCOPE';

export const selectionModes = {
    none: 0,
    select: 1,
    deselect: -1,
};

// Note: `TypeError: Object.values is not a function` in tests :'(
const validSelectionModes = Object.keys(selectionModes).map(key => selectionModes[key]);

const calculateAssignations = (mode, patchAssignations, existingAssignations) => {
    switch (mode) {
        case selectionModes.select: {
            const result = patchAssignations;
            const patchIds = {};

            for (let j = 0; j < patchAssignations.length; j += 1) {
                patchIds[patchAssignations[j].village_id] = true;
            }

            for (let i = 0; i < existingAssignations.length; i += 1) {
                const existingAssignation = existingAssignations[i];
                if (!patchIds[existingAssignation.village_id]) {
                    result.push(existingAssignation);
                }
            }

            return result;
        }
            break;
        case selectionModes.deselect: {
            // no suggested means remove ALL
            if (patchAssignations.length === 0) {
                return [];
            }
            // otherwise, remove indicated
            const ids = patchAssignations.map(item => item.village_id);

            const res = existingAssignations.filter(item => (ids.indexOf(item.village_id) === -1));
            return res;
        }
        default: {
            break;
        }
    }

    return existingAssignations;
};

export const changeMode = mode => ({
    type: SELECTION_MODE_CHANGE,
    payload: mode,
});

export const disableSelection = () => (changeMode(selectionModes.none));

export const changeBufferSize = size => ({
    type: BUFFER_SIZE_CHANGE,
    payload: parseInt(size, 10),
});

export const changeHighlightBufferSize = size => ({
    type: HIGHLIGHT_BUFFER_SIZE_CHANGE,
    payload: parseInt(size, 10),
});

export const executeSelection = items => ({
    type: SELECTION_EXECUTE,
    payload: items,
});

export const selectItems = (items, activateSaveButton = true) => ({
    type: SELECT_ITEMS,
    payload: items,
    activateSaveButton,
});

export const updateGeoScope = geoScope => ({
    type: UPDATE_GEO_SCOPE,
    payload: geoScope,
});

export const toggleGeoScope = showGeoScope => ({
    type: TOGGLE_GEO_SCOPE,
    payload: showGeoScope,
});

export const deselectItems = (items, activateSaveButton = true) => ({
    type: DESELECT_ITEMS,
    payload: items,
    activateSaveButton,
});

export const displayItem = item => ({
    type: DISPLAY_ITEM,
    payload: item,
});

export const selectionActions = {
    changeBufferSize,
    changeHighlightBufferSize,
    changeMode,
    deselectItems,
    selectItems,
    updateGeoScope,
    toggleGeoScope,
    disableSelection,
    displayItem,
    executeSelection,
};

export const selectionInitialState = {
    mode: selectionModes.none,
    bufferSize: 3,
    highlightBufferSize: 0,
    assignations: [],
    displayedItem: null,
    geoScope: {},
    showGeoScope: false,
};

export const selectionReducer = (state = selectionInitialState, action = {}) => {
    switch (action.type) {
        case SELECTION_MODE_CHANGE: {
            const mode = action.payload;
            if (validSelectionModes.indexOf(mode) === -1) {
                return state;
            }

            return { ...state, mode };
        }


        case BUFFER_SIZE_CHANGE: {
            const bufferSize = action.payload;
            if (bufferSize < 0) {
                return state;
            }

            return { ...state, bufferSize };
        }

        case HIGHLIGHT_BUFFER_SIZE_CHANGE: {
            const highlightBufferSize = action.payload;
            if (highlightBufferSize < 0) {
                return state;
            }

            return { ...state, highlightBufferSize };
        }

        case SELECTION_EXECUTE: {
            return {
                ...state,
                isSelectionModified: true,
                assignations: calculateAssignations(
                    state.mode,
                    action.payload || [],
                    state.assignations,
                ),
            };
        }
        case SELECT_ITEMS: {
            return {
                ...state,
                isSelectionModified: action.activateSaveButton,
                assignations: calculateAssignations(
                    selectionModes.select,
                    action.payload || [],
                    state.assignations,
                ),
            };
        }

        case DESELECT_ITEMS: {
            const newState = {
                ...state,
                isSelectionModified: action.activateSaveButton,
                assignations: calculateAssignations(
                    selectionModes.deselect,
                    action.payload || [],
                    state.assignations,
                ),
            };

            return newState;
        }

        case TOGGLE_GEO_SCOPE: {
            const showGeoScope = action.payload;
            return { ...state, showGeoScope };
        }

        case UPDATE_GEO_SCOPE: {
            const newState = {
                ...state,
                geoScope: action.payload,
            };
            return newState;
        }

        case DISPLAY_ITEM: {
            return { ...state, displayedItem: action.payload };
        }

        default:
            return state;
    }
};
