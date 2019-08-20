import tiles from '../constants/mapTiles';

const SET_CURRENT_TILE = 'SET_FORMS';


export const setCurrentTile = currentTile => ({
    type: SET_CURRENT_TILE,
    payload: currentTile,
});

export const mapInitialState = {
    currentTile: tiles['arcgis-satellite'],
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
        default:
            return state;
    }
};
