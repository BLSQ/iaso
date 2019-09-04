const SET_ORG_UNITS_LEVEL = 'SET_ORG_UNITS_LEVEL';

export const setOrgUnitsLevel = (orgUnitlist, level) => ({
    type: SET_ORG_UNITS_LEVEL,
    payload: {
        orgUnitlist,
        level,
    },
});

export const orgUnitsLevelsInitialState = {
    fetching: false,
    list: [],
};

export const orgUnitsLevelsReducer = (state = orgUnitsLevelsInitialState, action = {}) => {
    switch (action.type) {
        case SET_ORG_UNITS_LEVEL: {
            const {
                orgUnitlist, level,
            } = action.payload;
            const list = [];
            state.list.forEach((l, i) => {
                if (i < level) {
                    list.push(state.list[i]);
                }
            });
            list[level] = orgUnitlist;
            return {
                ...state,
                list,
            };
        }

        default:
            return state;
    }
};
