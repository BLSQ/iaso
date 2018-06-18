export const SHOW_PROVINCES = 'hat/locator/list/SHOW_PROVINCES';
export const FETCH_ACTION = 'hat/locator/list/FETCH_ACTION';
export const SHOW_ZONES = 'hat/locator/list/SHOW_ZONES';
export const SHOW_AREAS = 'hat/locator/list/SHOW_AREAS';
export const SHOW_TEAMS = 'hat/locator/list/SHOW_TEAMS';

const req = require('superagent');

export const showZones = zs => ({
    type: SHOW_ZONES,
    payload: zs,
});

export const fetchZones = (dispatch) => {
    req
        .get('/api/zs/')
        .then((result) => {
            dispatch(showZones(result.body));
        })
        .catch(err => (console.error(`Error while fetching zs ${err}`)));
    return ({
        type: FETCH_ACTION,
    });
};


export const showProvinces = provinces => ({
    type: SHOW_PROVINCES,
    payload: provinces,
});

export const fetchProvinces = (dispatch) => {
    req
        .get('/api/provinces/')
        .then((result) => {
            dispatch(showProvinces(result.body));
        })
        .catch(err => (console.error(`Error while fetching provinces ${err}`)));
    return ({
        type: FETCH_ACTION,
    });
};


export const showAreas = areas => ({
    type: SHOW_AREAS,
    payload: areas,
});

export const fetchAreas = (dispatch) => {
    req
        .get('/api/as/')
        .then((result) => {
            dispatch(showAreas(result.body));
        })
        .catch(err => (console.error(`Error while fetching areas ${err}`)));
    return ({
        type: FETCH_ACTION,
    });
};


export const showTeams = teams => ({
    type: SHOW_TEAMS,
    payload: teams,
});

export const fetchTeams = (dispatch) => {
    req
        .get('/api/teams/')
        .then((result) => {
            dispatch(showTeams(result.body));
        })
        .catch(err => (console.error(`Error while fetching teams ${err}`)));
    return ({
        type: FETCH_ACTION,
    });
};


export const listLocatorActions = {
    fetchZones,
    fetchProvinces,
    fetchAreas,
    fetchTeams,
};
export const listLocatorInitialState = {
    provinces: [],
    zones: [],
    areas: [],
    teams: [],
};

export const listLocatorReducer = (state = listLocatorInitialState, action = {}) => {
    switch (action.type) {
        case SHOW_ZONES: {
            const zones = action.payload;
            return { ...state, zones };
        }
        case SHOW_PROVINCES: {
            const provinces = action.payload;
            return { ...state, provinces };
        }
        case SHOW_AREAS: {
            const areas = action.payload;
            return { ...state, areas };
        }
        case SHOW_TEAMS: {
            const teams = action.payload;
            return { ...state, teams };
        }
        case FETCH_ACTION: {
            return state;
        }

        default:
            return state;
    }
};
