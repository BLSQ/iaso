import { loadActions } from '../../../redux/load';
import { enqueueSnackbar } from '../../../redux/snackBarsReducer';
import { succesfullSnackBar, errorSnackBar } from '../../../utils/constants/snackBars';

export const FETCH_ACTION = 'hat/management/areas/FETCH_ACTION';
export const FETCH_ACTION_NO_UPDATE = 'hat/management/areas/FETCH_ACTION_NO_UPDATE';
export const SET_AREAS = 'hat/management/areas/SET_AREAS';
export const AREA_UPDATED = 'hat/management/areas/AREA_UPDATED';
export const SELECT_AREA = 'hat/management/areas/SELECT_AREA';
export const UPDATE_CURRENT_AREA = 'hat/management/areas/UPDATE_CURRENT_AREA';
export const RESET_SHAPE_ITEM = 'hat/management/areas/RESET_SHAPE_ITEM';
export const SET_AREA_SHAPE = 'hat/management/areas/SET_AREA_SHAPE';

const req = require('superagent');

export const setAreas = payload => ({
    type: SET_AREAS,
    payload,
});


export const areaUpdated = payload => ({
    type: AREA_UPDATED,
    payload,
});

export const updateCurrentArea = payload => ({
    type: UPDATE_CURRENT_AREA,
    payload,
});


export const selectArea = payload => ({
    type: SELECT_AREA,
    payload,
});

export const resetShapeItem = () => ({
    type: RESET_SHAPE_ITEM,
});

export const setAreaShape = payload => ({
    type: SET_AREA_SHAPE,
    payload,
});


export const updateArea = (dispatch, area) => {
    dispatch(loadActions.startLoading());
    req
        .patch(`/api/as/${area.id}/`) // partial_update
        .set('Content-Type', 'application/json')
        .send(area)
        .then(() => {
            dispatch(enqueueSnackbar(succesfullSnackBar()));
            dispatch(areaUpdated(true));
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

export const deleteArea = (dispatch, area) => {
    const erasedArea = {
        ...area,
        is_erased: true,
    };
    dispatch(loadActions.startLoading());
    req
        .patch(`/api/as/${area.id}/`) // partial_update
        .set('Content-Type', 'application/json')
        .send(erasedArea)
        .then(() => {
            dispatch(areaUpdated(true));
            dispatch(loadActions.successLoadingNoData());
        })
        .catch((err) => {
            dispatch(loadActions.errorLoading(err));
            console.error('Error when deleting area', err);
        });
    return ({
        type: FETCH_ACTION,
    });
};

export const fetchAreaDetail = (dispatch, areaId) => {
    dispatch(loadActions.startLoading());
    req
        .get(`/api/as/${areaId}/`)
        .set('Content-Type', 'application/json')
        .then((res) => {
            dispatch(setAreaShape(res.body));
            dispatch(loadActions.successLoadingNoData());
        })
        .catch((err) => {
            dispatch(loadActions.errorLoading(err));
        });
    return ({
        type: FETCH_ACTION,
    });
};


export const areasInitialState = {
    isUpdated: false,
    list: [],
    current: null,
    geoProvinces: {},
    geoZones: {},
    geoAreas: {},
    selectedShapeItem: null,
};

export const areaActions = {
    updateArea,
    setAreas,
    areaUpdated,
    deleteArea,
    selectArea,
    updateCurrentArea,
    fetchAreaDetail,
    resetShapeItem,
};


export const areaReducer = (state = areasInitialState, action = {}) => {
    switch (action.type) {
        case SET_AREAS: {
            const list = action.payload;
            return {
                ...state,
                list,
            };
        }

        case SELECT_AREA: {
            const current = action.payload;
            return {
                ...state,
                current,
            };
        }

        case AREA_UPDATED: {
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

        case UPDATE_CURRENT_AREA: {
            const current = action.payload;
            return {
                ...state,
                current,
            };
        }

        case SET_AREA_SHAPE: {
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
