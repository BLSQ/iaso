/*
 * Includes the actions and state necessary for the selection process
 */
import { loadActions } from '../../../redux/load';

export const BUFFER_SIZE_CHANGE = 'hat/microplanning/selection/BUFFER_SIZE_CHANGE';
export const HIGHLIGHT_BUFFER_SIZE_CHANGE = 'hat/microplanning/selection/HIGHLIGHT_BUFFER_SIZE_CHANGE';

export const SELECT_ITEMS = 'hat/microplanning/selection/SELECT_ITEMS';
export const DESELECT_ITEMS = 'hat/microplanning/selection/DESELECT_ITEMS';

export const DISPLAY_ITEM = 'hat/microplanning/selection/DISPLAY_ITEM';
export const UPDATE_GEO_SCOPE = 'hat/microplanning/selection/UPDATE_GEO_SCOPE';

export const GET_TEAM_DETAIL = 'hat/microplanning/selection/GET_TEAM_DETAIL';
export const SAVE_AREA_IN_GEOLOC = 'hat/microplanning/selection/SAVE_AREA_IN_GEOLOC';
export const CHANGE_SELECTION_MODIFIED = 'hat/microplanning/selection/CHANGE_SELECTION_MODIFIED';

const request = require('superagent');

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

export const changeBufferSize = size => ({
    type: BUFFER_SIZE_CHANGE,
    payload: parseInt(size, 10),
});

export const chageSelectionModified = isSelectionModified => ({
    type: CHANGE_SELECTION_MODIFIED,
    payload: isSelectionModified,
});

export const changeHighlightBufferSize = size => ({
    type: HIGHLIGHT_BUFFER_SIZE_CHANGE,
    payload: parseInt(size, 10),
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

export const getTeamDetails = (dispatch, teamId, planningId, stopLoading = false) => {
    request
        .get(`/api/teams/${teamId}?planning_id=${planningId}`)
        .then((result) => {
            const geoScope = {};
            result.body.AS.map((aire) => {
                geoScope[aire.id] = aire;
                return true;
            });
            if (stopLoading) {
                dispatch(loadActions.successLoadingNoData());
            }
            dispatch(updateGeoScope(geoScope));
        })
        .catch((err) => {
            console.error(err);
            console.error('Error when fetching geo scope');
        });
    return ({
        type: GET_TEAM_DETAIL,
    });
};

export function saveAreaInGeoloc(dispatch, asId, team, planningId, stopLoading = false) {
    request
        .put(`/api/as/${asId}/`)
        .set('Content-Type', 'application/json')
        .send(team) // PUT = {"team_id"}  / DELETE = {"team_id": 2, "delete": true}
        .then(() => {
            dispatch(getTeamDetails(dispatch, team.team_id, planningId, stopLoading));
        })
        .catch((err) => {
            console.error(err);
            console.error('Error when saving geo scope');
        });
    return ({
        type: SAVE_AREA_IN_GEOLOC,
    });
}

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
    changeHighlightBufferSize,
    deselectItems,
    selectItems,
    updateGeoScope,
    displayItem,
    getTeamDetails,
    saveAreaInGeoloc,
    chageSelectionModified,
};

export const selectionInitialState = {
    mode: selectionModes.none,
    highlightBufferSize: 0,
    assignations: [],
    displayedItem: null,
    geoScope: {},
    isSelectionModified: undefined,
};

export const selectionReducer = (state = selectionInitialState, action = {}) => {
    switch (action.type) {
        case HIGHLIGHT_BUFFER_SIZE_CHANGE: {
            const highlightBufferSize = action.payload;
            if (highlightBufferSize < 0) {
                return state;
            }

            return { ...state, highlightBufferSize };
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

        case UPDATE_GEO_SCOPE: {
            const newState = {
                ...state,
                geoScope: action.payload,
            };
            return newState;
        }

        case DISPLAY_ITEM: {
            return {
                ...state,
                displayedItem: action.payload,
            };
        }

        case CHANGE_SELECTION_MODIFIED: {
            return {
                ...state,
                isSelectionModified: action.payload,
            };
        }

        default:
            return state;
    }
};
