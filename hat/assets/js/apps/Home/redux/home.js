export const FETCH_ACTION = 'hat/home/FETCH_ACTION';
export const SET_GEO_ZONES = 'hat/home/SET_GEO_ZONES';

const req = require('superagent');

export const setGeoZones = payload => ({
    type: SET_GEO_ZONES,
    payload,
});


export const fetchGeoZones = (dispatch) => {
    req
        .get('/api/zs/?geojson=true')
        .set('Content-Type', 'application/json')
        .then((res) => {
            dispatch(setGeoZones(res.body));
        })
        .catch((err) => {
            console.error(`Error while loading areas: ${err}`);
        });
    return ({
        type: FETCH_ACTION,
    });
};

export const homeInitialState = {
    geoZones: null,
};

export const homeActions = {
    fetchGeoZones,
};


export const homeReducer = (state = homeInitialState, action = {}) => {
    switch (action.type) {
        case FETCH_ACTION: {
            return {
                ...state,
            };
        }

        case SET_GEO_ZONES: {
            const geoZones = action.payload;
            return {
                ...state,
                geoZones,
            };
        }

        default:
            return state;
    }
};
