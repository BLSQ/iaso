export const FETCH_ACTION = 'hat/home/FETCH_ACTION';
export const SET_GEO_ZONES = 'hat/home/SET_GEO_ZONES';
export const SET_ZONES = 'hat/home/SET_ZONES';

const req = require('superagent');

const setGeoZones = payload => ({
    type: SET_GEO_ZONES,
    payload,
});

const setZones = payload => ({
    type: SET_ZONES,
    payload,
});


export const fetchGeoZones = (dispatch) => {
    const currentYear = new Date().getFullYear() - 1;
    const years = [1, 2, 3].map(i => currentYear - i);
    req
        .get(`/api/home/?years=${years}&with_geo_json=true`)
        .set('Content-Type', 'application/json')
        .then((res) => {
            dispatch(setZones(res.body));
            req
                .get('/api/home/?geojson=true')
                .set('Content-Type', 'application/json')
                .then((resGoe) => {
                    dispatch(setGeoZones(resGoe.body));
                })
                .catch((err) => {
                    console.error(`Error while loading geo zones: ${err}`);
                });
        })
        .catch((err) => {
            console.error(`Error while loading zones: ${err}`);
        });
    return ({
        type: FETCH_ACTION,
    });
};

export const homeInitialState = {
    geoZones: null,
    zones: [],
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

        case SET_ZONES: {
            const zones = action.payload;
            return {
                ...state,
                zones,
            };
        }

        default:
            return state;
    }
};
