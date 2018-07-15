
import { loadActions } from '../../../redux/load';

export const LOAD_CURRENT_DEVICE = 'hat/locator/devices/LOAD_CURRENT_DEVICE';
export const LOAD_DEVICES = 'hat/locator/devices/LOAD_DEVICES';
export const LOAD_DEVICES_VILLAGES = 'hat/locator/devices/LOAD_DEVICES_VILLAGES';
export const LOAD_DEVICES_VILLAGES_YEAR = 'hat/locator/devices/LOAD_DEVICES_VILLAGES_YEAR';
export const LOAD_DEVICES_VILLAGES_MONTH = 'hat/locator/devices/LOAD_DEVICES_VILLAGES_MONTH';
export const FETCH_ACTION = 'hat/locator/devices/FETCH_ACTION';
export const RESET_DEVICES = 'hat/locator/devices/RESET_DEVICES';


const req = require('superagent');

export const resetDevices = () => ({
    type: RESET_DEVICES,
});

export const loadCurrentDevice = payload => ({
    type: LOAD_CURRENT_DEVICE,
    payload,
});

export const loadDevices = (payload, deviceId = null, dispatch = () => { }) => {
    if (deviceId) {
        const currentDevice = payload.filter(device => device.id === deviceId)[0];
        dispatch(loadCurrentDevice(currentDevice));
    }
    return ({
        type: LOAD_DEVICES,
        payload,
    });
};

export const loadDevicesVillages = payload => ({
    type: LOAD_DEVICES_VILLAGES,
    payload,
});


export const loadDevicesVillagesYear = payload => ({
    type: LOAD_DEVICES_VILLAGES_YEAR,
    payload,
});


export const loadDevicesVillagesMonth = payload => ({
    type: LOAD_DEVICES_VILLAGES_MONTH,
    payload,
});


export const fetchDevices = (dispatch, deviceId) => {
    req
        .get('/api/datasets/device_status')
        .then((result) => {
            const allDevices = result.body;
            dispatch(loadDevices(allDevices, deviceId, dispatch));
        })
        .catch(err => (console.error(`Error while fetching devices ${err}`)));
    return ({
        type: FETCH_ACTION,
    });
};


export const fetchDevicesVillages = (
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
                dispatch(loadDevicesVillagesYear({ list, deviceId }));
            }
            if (grouping === 'month') {
                dispatch(loadDevicesVillagesMonth({ list, deviceId }));
            }
        })
        .catch((err) => {
            dispatch(loadActions.errorLoading(err));
            console.error(`Error while fetching devices ${err}`);
        });
    return ({
        type: FETCH_ACTION,
    });
};


export const devicesActions = {
    loadCurrentDevice,
    fetchDevices,
    fetchDevicesVillages,
    resetDevices,
    loadDevicesVillages,
};

export const devicesInitialState = {
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

export const devicesReducer = (state = devicesInitialState, action = {}) => {
    switch (action.type) {
        case LOAD_CURRENT_DEVICE: {
            const current = action.payload;
            return { ...state, current };
        }

        case LOAD_DEVICES_VILLAGES: {
            const villages = action.payload;
            return {
                ...state,
                villages,
            };
        }

        case LOAD_DEVICES_VILLAGES_YEAR: {
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

        case LOAD_DEVICES_VILLAGES_MONTH: {
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

        case RESET_DEVICES: {
            return devicesInitialState;
        }

        default:
            return state;
    }
};
