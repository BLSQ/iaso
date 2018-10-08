import { loadActions } from '../../../redux/load';

export const FETCH_ACTION = 'hat/management/villages/FETCH_ACTION';
export const FETCH_ACTION_NO_UPDATE = 'hat/management/villages/FETCH_ACTION_NO_UPDATE';
export const SET_VILLAGES = 'hat/management/villages/SET_VILLAGES';
export const VILLAGE_UPDATED = 'hat/management/villages/VILLAGE_UPDATED';
export const SELECT_VILLAGE = 'hat/management/villages/SELECT_VILLAGE';
export const UPDATE_CURRENT_VILLAGE = 'hat/management/villages/UPDATE_CURRENT_VILLAGE';
export const SET_GEO_PROVINCES = 'hat/management/villages/SET_GEO_PROVINCES';

const req = require('superagent');

export const setVillages = payload => ({
    type: SET_VILLAGES,
    payload,
});


export const villageUpdated = payload => ({
    type: VILLAGE_UPDATED,
    payload,
});

export const updateCurrentVillage = payload => ({
    type: UPDATE_CURRENT_VILLAGE,
    payload,
});


export const selectVillage = payload => ({
    type: SELECT_VILLAGE,
    payload,
});

export const setGeoProvinces = payload => ({
    type: SET_GEO_PROVINCES,
    payload,
});

export const updateVillage = (dispatch, village) => {
    dispatch(loadActions.startLoading());
    req
        .patch(`/api/villages/${village.id}/`) // partial_update
        .set('Content-Type', 'application/json')
        .send(village)
        .then(() => {
            dispatch(villageUpdated(true));
            dispatch(loadActions.successLoadingNoData());
        })
        .catch((err) => {
            dispatch(loadActions.errorLoading(err));
        });
    return ({
        type: FETCH_ACTION,
    });
};

export const createVillage = (dispatch, village) => {
    dispatch(loadActions.startLoading());
    req
        .post('/api/villages/')
        .set('Content-Type', 'application/json')
        .send(village)
        .then((res) => {
            dispatch(villageUpdated(true));
            dispatch(selectVillage(res.body));
            dispatch(loadActions.successLoadingNoData());
        })
        .catch((err) => {
            dispatch(loadActions.errorLoading(err));
            console.error('Error when creating village', err);
        });
    return ({
        type: FETCH_ACTION,
    });
};


export const deleteVillage = (dispatch, village) => {
    console.log('Do not erase, update tu is_erased = true');
    // dispatch(loadActions.startLoading());
    // req
    //     .delete(`/api/villages/${village.id}/`)
    //     .set('Content-Type', 'application/json')
    //     .then(() => {
    //         dispatch(villageUpdated(true));
    //         dispatch(loadActions.successLoadingNoData());
    //     })
    //     .catch((err) => {
    //         dispatch(loadActions.errorLoading(err));
    //         console.error('Error when deleting village', err);
    //     });
    return ({
        type: FETCH_ACTION,
    });
};


export const fetchGeoProvinces = (dispatch) => {
    dispatch(loadActions.startLoading());
    req
        .get('/api/provinces/?geojson=true') // partial_update
        .set('Content-Type', 'application/json')
        .then((res) => {
            dispatch(setGeoProvinces(res.body));
            dispatch(loadActions.successLoadingNoData());
        })
        .catch((err) => {
            dispatch(loadActions.errorLoading(err));
        });
    return ({
        type: FETCH_ACTION,
    });
};

export const villagesInitialState = {
    isUpdated: false,
    list: [],
    current: null,
    geoProvinces: {},
};

export const villageActions = {
    updateVillage,
    setVillages,
    villageUpdated,
    deleteVillage,
    createVillage,
    selectVillage,
    updateCurrentVillage,
    fetchGeoProvinces,
};


export const villageReducer = (state = villagesInitialState, action = {}) => {
    switch (action.type) {
        case SET_VILLAGES: {
            const list = action.payload;
            return {
                ...state,
                list,
            };
        }

        case SELECT_VILLAGE: {
            const current = action.payload;
            return {
                ...state,
                current,
            };
        }

        case VILLAGE_UPDATED: {
            const isUpdated = action.payload;
            return {
                ...state,
                isUpdated,
            };
        }

        case FETCH_ACTION: {
            return {
                ...state,
            };
        }

        case FETCH_ACTION_NO_UPDATE: {
            return {
                ...state,
            };
        }

        case UPDATE_CURRENT_VILLAGE: {
            const current = action.payload;
            return {
                ...state,
                current,
            };
        }

        case SET_GEO_PROVINCES: {
            const geoProvinces = action.payload;
            return {
                ...state,
                geoProvinces,
            };
        }

        default:
            return state;
    }
};
