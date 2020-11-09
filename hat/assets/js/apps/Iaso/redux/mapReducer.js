import tiles from '../constants/mapTiles';

const SET_CURRENT_TILE = 'SET_CURRENT_TILE';
const TOGGLE_CLUSTER = 'TOGGLE_CLUSTER';
const RESET_REDUCER = 'RESET_REDUCER';

export const setCurrentTile = currentTile => ({
    type: SET_CURRENT_TILE,
    payload: currentTile,
});

export const toggleCluster = () => ({
    type: TOGGLE_CLUSTER,
});

export const resetMapReducer = () => ({
    type: RESET_REDUCER,
});

export const mapInitialState = {
    currentTile: tiles.osm,
    isClusterActive: true,
};

export const mapReducer = (state = mapInitialState, action = {}) => {
    switch (action.type) {
        case SET_CURRENT_TILE: {
            const currentTile = action.payload;
            return {
                ...state,
                currentTile,
            };
        }
        case TOGGLE_CLUSTER: {
            return {
                ...state,
                isClusterActive: !state.isClusterActive,
            };
        }
        case RESET_REDUCER: {
            return mapInitialState;
        }
        default:
            return state;
    }
};
