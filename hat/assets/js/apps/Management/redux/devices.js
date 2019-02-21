export const SET_DEVICES_LIST = 'hat/management/devices/SET_DEVICES_LIST';

export const setDevicesList = (list, showPagination, params, count, pages) => ({
    type: SET_DEVICES_LIST,
    payload: {
        list,
        showPagination,
        params,
        count,
        pages,
    },
});

export const devicesActions = {
    setDevicesList,
};

export const devicesInitialState = {
    devicesPage: {
        list: null,
        showPagination: false,
        params: {},
        count: 0,
        pages: 0,
    },
};

export const devicesReducer = (state = devicesInitialState, action = {}) => {
    switch (action.type) {
        case SET_DEVICES_LIST: {
            const {
                list, showPagination, params, count, pages,
            } = action.payload;
            return {
                ...state,
                devicesPage: {
                    list,
                    showPagination,
                    params,
                    count,
                    pages,
                },
            };
        }
        default:
            return state;
    }
};
