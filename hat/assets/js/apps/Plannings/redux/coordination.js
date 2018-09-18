import { loadActions } from '../../../redux/load';

export const SHOW_COORDINATION = 'hat/macroplanning/coordination/SHOW_COORDINATION';
export const SHOW_COORDINATION_DETAIL = 'hat/macroplanning/coordination/SHOW_COORDINATION_DETAIL';
export const SELECT_AS = 'hat/macroplanning/coordination/SELECT_AS';
export const SELECT_WORKZONE = 'hat/macroplanning/coordination/SELECT_AS';
export const FETCH_ACTION = 'hat/macroplanning/coordination/FETCH_ACTION';
export const SAVE_WORKZONE_COLOR = 'hat/macroplanning/SAVE_WOORKZONE_COLOR';
export const SET_WORK_ZONES = 'hat/macroplanning/SET_WORK_ZONES';

const req = require('superagent');

export const showCoordinations = coordinations => ({
    type: SHOW_COORDINATION,
    payload: coordinations,
});

export const selectArea = area => ({
    type: SELECT_AS,
    payload: area,
});

export const setWorkZones = workzones => ({
    type: SET_WORK_ZONES,
    payload: workzones,
});

export const showCoordinationsDetail = coordination => ({
    type: SHOW_COORDINATION_DETAIL,
    payload: coordination,
});

export const fetchWorkZones = (dispatch, planningId, coordinationId, coordination, areaId, years) => {
    req
        .get(`/api/workzones/?planning_id=${planningId}&coordination_id=${coordinationId}&years=${years}`)
        .then((result) => {
            dispatch(loadActions.successLoadingNoData());
            dispatch(setWorkZones(result.body));
            if (areaId) {
                dispatch(selectArea(coordination.areas.features.filter(a => a.properties.pk === areaId)[0].properties));
            }
        })
        .catch(err => (console.error(`Error while fetching workzone ${err}`)));
    return ({
        type: FETCH_ACTION,
    });
};

export const fetchCoordinationsDetails = (dispatch, planningId, coordinationId, areaId, years) => {
    dispatch(loadActions.startLoading());
    req
        .get(`/api/coordinations/${coordinationId}?geojson=true&endemic_population=true&years=${years}`)
        .then((res) => {
            const newCoordination = res.body;
            dispatch(showCoordinationsDetail(newCoordination));
            dispatch(fetchWorkZones(dispatch, planningId, coordinationId, newCoordination, areaId, years));
        })
        .catch(err => (console.error(`Error while fetching coordination detail ${err}`)));
    return ({
        type: FETCH_ACTION,
    });
};


export const selectWorkzone = (dispatch, planningId, coordinationId, workzoneId, areaId, zoneId, action, years, coordination) => {
    dispatch(loadActions.startLoading());
    let data = {};
    if (areaId && !zoneId) {
        data = {
            action,
            as: [areaId],
        };
    }
    if (zoneId) {
        data = {
            action,
            zs: [zoneId],
        };
    }
    req
        .patch(`/api/workzones/${workzoneId}/`)
        .set('Content-Type', 'application/json')
        .send(data)
        .then(() => {
            dispatch(fetchWorkZones(dispatch, planningId, coordinationId, coordination, areaId, years));
        })
        .catch((err) => {
            console.error(`Error while updating workzone: ${err}`);
        });
    return ({
        type: SELECT_WORKZONE,
    });
};

export const fetchCoordinations = (dispatch) => {
    req
        .get('/api/coordinations/')
        .then((result) => {
            dispatch(showCoordinations(result.body));
        })
        .catch(err => (console.error(`Error while fetching coordinations ${err}`)));
    return ({
        type: FETCH_ACTION,
    });
};

export const saveWorkZoneColor = (dispatch, color, workzoneId, workzones) => {
    dispatch(loadActions.startLoading());
    req
        .patch(`/api/workzones/${workzoneId}/`)
        .set('Content-Type', 'application/json')
        .send({
            color,
        })
        .then((res) => {
            const workZone = res.body;
            const newWorkZones = workzones.slice();
            workzones.map((w, index) => {
                if (w.id === workZone.id) {
                    newWorkZones[index] = workZone;
                }
                return null;
            });
            dispatch(setWorkZones(newWorkZones));
            dispatch(loadActions.successLoadingNoData());
        })
        .catch(err => (console.error(`Error while saving workzone color: ${err}`)));
    return ({
        type: SAVE_WORKZONE_COLOR,
    });
};


export const coordinationActions = {
    showCoordinations,
    fetchCoordinations,
    fetchCoordinationsDetails,
    selectArea,
    selectWorkzone,
    saveWorkZoneColor,
};
export const coordinationInitialState = {
    list: [],
    current: {},
    workzones: [],
};

export const coordinationReducer = (state = coordinationInitialState, action = {}) => {
    switch (action.type) {
        case SET_WORK_ZONES: {
            const workzones = action.payload;
            return { ...state, workzones };
        }
        case SHOW_COORDINATION: {
            const list = action.payload;
            return { ...state, list };
        }
        case SELECT_AS: {
            const currentArea = action.payload;
            return { ...state, currentArea };
        }
        case SHOW_COORDINATION_DETAIL: {
            const newCurrent = action.payload;
            return { ...state, current: newCurrent };
        }
        case SAVE_WORKZONE_COLOR:
        case SELECT_WORKZONE:
        case FETCH_ACTION: {
            return state;
        }
        default:
            return state;
    }
};
