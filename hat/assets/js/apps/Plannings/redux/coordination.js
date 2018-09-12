import { loadActions } from '../../../redux/load';

export const SHOW_COORDINATION = 'hat/macroplanning/coordination/SHOW_COORDINATION';
export const SHOW_COORDINATION_DETAIL = 'hat/macroplanning/coordination/SHOW_COORDINATION_DETAIL';
export const SELECT_AS = 'hat/macroplanning/coordination/SELECT_AS';
export const SELECT_WORKZONE = 'hat/macroplanning/coordination/SELECT_AS';
export const FETCH_ACTION = 'hat/macroplanning/coordination/FETCH_ACTION';

const req = require('superagent');

export const showCoordinations = coordinations => ({
    type: SHOW_COORDINATION,
    payload: coordinations,
});

export const selectArea = area => ({
    type: SELECT_AS,
    payload: area,
});

export const showCoordinationsDetail = datas => ({
    type: SHOW_COORDINATION_DETAIL,
    payload: datas,
});

export const fetchWorkZones = (dispatch, planningId, coordinationId, coordination, areaId, years) => {
    req
        .get(`/api/workzones/?planning_id=${planningId}&coordination_id=${coordinationId}&years=${years}`)
        .then((result) => {
            dispatch(showCoordinationsDetail({
                current: coordination,
                workzones: result.body,
            }));
            if (areaId) {
                dispatch(selectArea(coordination.areas.filter(a => a.properties.pk === areaId)[0].properties));
            }
            dispatch(loadActions.successLoadingNoData());
        })
        .catch(err => (console.error(`Error while fetching coordination detail ${err}`)));
    return ({
        type: FETCH_ACTION,
    });
};
export const fetchCoordinationsDetails = (dispatch, planningId, coordinationId, areaId, years) => {
    req
        .get(`/api/coordinations/${coordinationId}?geojson=true`)
        .then((result) => {
            dispatch(fetchWorkZones(dispatch, planningId, coordinationId, result.body, areaId, years));
        })
        .catch(err => (console.error(`Error while fetching coordination detail ${err}`)));
    return ({
        type: FETCH_ACTION,
    });
};


export const selectWorkzone = (dispatch, planningId, coordinationId, workzoneId, areaId, zoneId, action, years) => {
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
            dispatch(fetchCoordinationsDetails(dispatch, planningId, coordinationId, areaId, years));
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


export const coordinationActions = {
    showCoordinations,
    fetchCoordinations,
    fetchCoordinationsDetails,
    selectArea,
    selectWorkzone,
};

export const coordinationReducer = (state = {}, action = {}) => {
    switch (action.type) {
        case SHOW_COORDINATION: {
            const list = action.payload;
            return { ...state, list };
        }
        case SELECT_AS: {
            const currentArea = action.payload;
            return { ...state, currentArea };
        }
        case SHOW_COORDINATION_DETAIL: {
            const current = action.payload;
            return { ...state, current };
        }
        case SELECT_WORKZONE:
        case FETCH_ACTION: {
            return state;
        }
        default:
            return state;
    }
};
