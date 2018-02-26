export const SET_DASHBOARD_INFO = 'hat/locator/cases/SET_DASHBOARD_INFO';


// Note: `TypeError: Object.values is not a function` in tests :'(

export const setDashboardInfo = infos => ({
    type: SET_DASHBOARD_INFO,
    payload: infos,
});

export const dashboardActions = {
    setDashboardInfo,
};

export const dashboardReducer = (state = {}, action = {}) => {
    switch (action.type) {
        case SET_DASHBOARD_INFO: {
            const newState = action.payload;
            return { ...newState };
        }

        default:
            return state;
    }
};
