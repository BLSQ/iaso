
import { loadActions } from '../../../redux/load';

export const LOAD_CURRENT_DETAIL = 'hat/locator/detail/LOAD_CURRENT_DETAIL';
export const LOAD_DETAIL = 'hat/locator/detail/LOAD_DETAIL';
export const LOAD_DETAIL_VILLAGES = 'hat/locator/detail/LOAD_DETAIL_VILLAGES';
export const LOAD_DETAIL_VILLAGES_YEAR = 'hat/locator/detail/LOAD_DETAIL_VILLAGES_YEAR';
export const LOAD_DETAIL_VILLAGES_MONTH = 'hat/locator/detail/LOAD_DETAIL_VILLAGES_MONTH';
export const FETCH_ACTION = 'hat/locator/detail/FETCH_ACTION';
export const RESET_DETAIL = 'hat/locator/detail/RESET_DETAIL';


const req = require('superagent');

export const resetDetails = () => ({
    type: RESET_DETAIL,
});

export const loadCurrentDetail = payload => ({
    type: LOAD_CURRENT_DETAIL,
    payload,
});

export const loadDetails = (payload, deviceId = null, dispatch = () => { }) => {
    if (deviceId) {
        const currentDevice = payload.filter(device => device.id === deviceId)[0];
        dispatch(loadCurrentDetail(currentDevice));
    }
    return ({
        type: LOAD_DETAIL,
        payload,
    });
};

export const loadDetailsVillages = payload => ({
    type: LOAD_DETAIL_VILLAGES,
    payload,
});


export const loadDetailsVillagesYear = payload => ({
    type: LOAD_DETAIL_VILLAGES_YEAR,
    payload,
});


export const loadDetailsVillagesMonth = payload => ({
    type: LOAD_DETAIL_VILLAGES_MONTH,
    payload,
});


export const fetchDetails = (dispatch, deviceId) => {
    req
        .get('/api/datasets/device_status')
        .then((result) => {
            const allDetails = result.body;
            dispatch(loadDetails(allDetails, deviceId, dispatch));
        })
        .catch(err => (console.error(`Error while fetching detail ${err}`)));
    return ({
        type: FETCH_ACTION,
    });
};


export const fetchDetailsVillages = (
    dispatch,
    deviceId,
    from = null,
    to = null,
    teamId = null,
    grouping,
    stopLoading = false,
) => {
    let url = `/api/teststats/?device_id=${deviceId}&grouping=${grouping}`;
    if (from) {
        url += `&from=${from}`;
    }
    if (to) {
        url += `&to=${to}`;
    }
    if (teamId) {
        url += `&team_id=${teamId}`;
    }
    dispatch(loadActions.startLoading());
    req
        .get(url)
        .then((result) => {
            const list = result.body;
            if (stopLoading) {
                dispatch(loadActions.successLoadingNoData());
            }
            if (grouping === 'villageyear') {
                dispatch(loadDetailsVillagesYear({ list, deviceId }));
            }
            if (grouping === 'month') {
                dispatch(loadDetailsVillagesMonth({ list, deviceId }));
            }
        })
        .catch((err) => {
            dispatch(loadActions.errorLoading(err));
            console.error(`Error while fetching detail ${err}`);
        });
    return ({
        type: FETCH_ACTION,
    });
};


export const detailsActions = {
    loadCurrentDetail,
    fetchDetails,
    fetchDetailsVillages,
    resetDetails,
    loadDetailsVillages,
};

export const detailsInitialState = {
    current: undefined,
    list: [],
    villages: [],
    villagesYear: {
        list: [],
        deviceId: null,
    },
    villagesMonth: {
        list: [],
        deviceId: null,
    },
    total: null,
};

export const detailsReducer = (state = detailsInitialState, action = {}) => {
    switch (action.type) {
        case LOAD_CURRENT_DETAIL: {
            const current = action.payload;
            return { ...state, current };
        }

        case LOAD_DETAIL_VILLAGES: {
            const villages = action.payload;
            return {
                ...state,
                villages,
            };
        }

        case LOAD_DETAIL_VILLAGES_YEAR: {
            const list = action.payload.list.result;
            const deviceId = action.payload;
            return {
                ...state,
                villagesYear: {
                    list,
                    deviceId,
                },
            };
        }

        case LOAD_DETAIL_VILLAGES_MONTH: {
            const list = action.payload.list.result;
            const deviceId = action.payload;
            const { total } = action.payload.list;
            return {
                ...state,
                villagesMonth: {
                    list,
                    deviceId,
                    total,
                },
            };
        }

        case FETCH_ACTION: {
            return state;
        }

        case RESET_DETAIL: {
            return detailsInitialState;
        }

        default:
            return state;
    }
};
