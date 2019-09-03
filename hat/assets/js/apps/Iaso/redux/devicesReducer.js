const SET_DEVICES = 'SET_DEVICES';
const SET_DEVICES_OWNERSHIP = 'SET_DEVICES_OWNERSHIP';

export const setDevicesList = devicesList => ({
    type: SET_DEVICES,
    payload: devicesList,
});

export const setDevicesOwnershipList = devicesOwnershipsList => ({
    type: SET_DEVICES_OWNERSHIP,
    payload: devicesOwnershipsList,
});

export const devicesInitialState = {
    list: [],
    ownershipList: [],
};

export const devicesReducer = (state = devicesInitialState, action = {}) => {
    switch (action.type) {
        case SET_DEVICES: {
            const list = action.payload;
            return {
                ...state,
                list,
            };
        }

        case SET_DEVICES_OWNERSHIP: {
            const ownershipList = action.payload;
            return {
                ...state,
                ownershipList,
            };
        }

        default:
            return state;
    }
};
