import { loadActions } from '../../../redux/load';
import { enqueueSnackbar } from '../../../redux/snackBarsReducer';
import { succesfullSnackBar, errorSnackBar } from '../../../utils/constants/snackBars';

export const FETCH_ACTION = 'hat/management/zones/FETCH_ACTION';
export const FETCH_ACTION_NO_UPDATE = 'hat/management/zones/FETCH_ACTION_NO_UPDATE';
export const SET_ZONES = 'hat/management/zones/SET_ZONES';
export const ZONE_UPDATED = 'hat/management/zones/ZONE_UPDATED';
export const SELECT_ZONE = 'hat/management/zones/SELECT_ZONE';
export const UPDATE_CURRENT_ZONE = 'hat/management/zones/UPDATE_CURRENT_ZONE';
export const SET_ZONE_SHAPE = 'hat/management/zones/SET_ZONE_SHAPE';
export const RESET_SHAPE_ITEM = 'hat/management/zones/RESET_SHAPE_ITEM';

const req = require('superagent');

export const setZones = payload => ({
    type: SET_ZONES,
    payload,
});


export const zoneUpdated = payload => ({
    type: ZONE_UPDATED,
    payload,
});

export const updateCurrentZone = payload => ({
    type: UPDATE_CURRENT_ZONE,
    payload,
});


export const selectZone = payload => ({
    type: SELECT_ZONE,
    payload,
});

export const setZoneShape = payload => ({
    type: SET_ZONE_SHAPE,
    payload,
});

export const resetShapeItem = () => ({
    type: RESET_SHAPE_ITEM,
});

export const updateZone = (dispatch, zone) => {
    dispatch(loadActions.startLoading());
    req
        .patch(`/api/zs/${zone.id}/`) // partial_update
        .set('Content-Type', 'application/json')
        .send(zone)
        .then(() => {
            dispatch(enqueueSnackbar(succesfullSnackBar()));
            dispatch(zoneUpdated(true));
            dispatch(loadActions.successLoadingNoData());
        })
        .catch((err) => {
            dispatch(enqueueSnackbar(errorSnackBar()));
            dispatch(loadActions.errorLoading(err));
        });
    return ({
        type: FETCH_ACTION,
    });
};

export const createZone = (dispatch, zone) => {
    dispatch(loadActions.startLoading());
    req
        .post('/api/zs/') // create
        .set('Content-Type', 'application/json')
        .send(zone)
        .then(() => {
            dispatch(enqueueSnackbar(succesfullSnackBar()));
            dispatch(zoneUpdated(true));
            dispatch(loadActions.successLoadingNoData());
        })
        .catch((err) => {
            dispatch(enqueueSnackbar(errorSnackBar()));
            dispatch(loadActions.errorLoading(err));
        });
    return ({
        type: FETCH_ACTION,
    });
};

// Delete action will only mark it as erased

export const deleteZone = (dispatch, zone) => {
    const erasedZone = {
        ...zone,
        is_erased: true,
    };
    dispatch(loadActions.startLoading());
    req
        .patch(`/api/zs/${zone.id}/`) // partial_update
        .set('Content-Type', 'application/json')
        .send(erasedZone)
        .then(() => {
            dispatch(zoneUpdated(true));
            dispatch(loadActions.successLoadingNoData());
        })
        .catch((err) => {
            dispatch(loadActions.errorLoading(err));
            console.error('Error when deleting zone', err);
        });
    return ({
        type: FETCH_ACTION,
    });
};

export const fetchZoneDetail = (dispatch, zoneId) => {
    dispatch(loadActions.startLoading());
    req
        .get(`/api/zs/${zoneId}/`)
        .set('Content-Type', 'application/json')
        .then((res) => {
            dispatch(setZoneShape(res.body));
            dispatch(loadActions.successLoadingNoData());
        })
        .catch((err) => {
            dispatch(loadActions.errorLoading(err));
        });
    return ({
        type: FETCH_ACTION,
    });
};


export const zonesInitialState = {
    isUpdated: false,
    list: [],
    current: null,
    selectedShapeItem: null,
};

export const zoneActions = {
    updateZone,
    createZone,
    setZones,
    zoneUpdated,
    deleteZone,
    selectZone,
    updateCurrentZone,
    fetchZoneDetail,
    resetShapeItem,
};


export const zoneReducer = (state = zonesInitialState, action = {}) => {
    switch (action.type) {
        case SET_ZONES: {
            const list = action.payload;
            return {
                ...state,
                list,
            };
        }

        case SELECT_ZONE: {
            const current = action.payload;
            return {
                ...state,
                current,
            };
        }

        case ZONE_UPDATED: {
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

        case UPDATE_CURRENT_ZONE: {
            const current = action.payload;
            return {
                ...state,
                current,
            };
        }

        case SET_ZONE_SHAPE: {
            const selectedShapeItem = action.payload;
            return {
                ...state,
                selectedShapeItem,
            };
        }

        case RESET_SHAPE_ITEM: {
            return {
                ...state,
                selectedShapeItem: null,
            };
        }

        default:
            return state;
    }
};
