
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


export const fetchDetails = (dispatch, detailId, url) => {
    dispatch(loadActions.startLoading());
    req
        .get(url)
        .then((result) => {
            dispatch(loadCurrentDetail(result.body));
        })
        .catch(err => (console.error(`Error while fetching detail ${err}`)));
    return ({
        type: FETCH_ACTION,
    });
};

export const saveDevice = (dispatch, device) => {
    dispatch(loadActions.startLoading());
    req
        .patch(`/api/devices/${device.id}/`)
        .set('Content-Type', 'application/json')
        .send(device)
        .then((result) => {
            dispatch(loadActions.successLoadingNoData());
            dispatch(loadCurrentDetail(result.body));
        })
        .catch((err) => {
            dispatch(loadActions.errorLoading(err));
            console.error('Error when saving device', err);
        });
    return ({
        type: FETCH_ACTION,
    });
};

export const fetchDetailsVillages = (
    dispatch,
    detailKey,
    detailId,
    from = null,
    to = null,
    grouping,
    stopLoading = false,
) => {
    let url = `/api/teststats/?${detailKey}=${detailId}&grouping=${grouping}`;
    if (from) {
        url += `&from=${from}`;
    }
    if (to) {
        url += `&to=${to}`;
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
                dispatch(loadDetailsVillagesYear({ list, detailId }));
            }
            if (grouping === 'month') {
                dispatch(loadDetailsVillagesMonth({ list, detailId }));
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
    saveDevice,
};

export const detailsInitialState = {
    current: undefined,
    list: [],
    villages: [],
    villagesYear: {
        list: [],
        detailId: null,
    },
    villagesMonth: {
        list: [],
        detailId: null,
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
            const detailId = action.payload;
            return {
                ...state,
                villagesYear: {
                    list,
                    detailId,
                },
            };
        }

        case LOAD_DETAIL_VILLAGES_MONTH: {
            const list = action.payload.list.result;
            const detailId = action.payload;
            const { total } = action.payload.list;
            return {
                ...state,
                villagesMonth: {
                    list,
                    detailId,
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
