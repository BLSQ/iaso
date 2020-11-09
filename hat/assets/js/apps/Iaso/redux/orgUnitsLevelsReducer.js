const SET_ORG_UNITS_LEVEL = 'SET_ORG_UNITS_LEVEL';
const RESET_ORG_UNITS_LEVELS = 'RESET_ORG_UNITS_LEVELS';

export const setOrgUnitsLevel = (orgUnitlist, level, listIndex) => ({
    type: SET_ORG_UNITS_LEVEL,
    payload: {
        orgUnitlist,
        level,
        listIndex,
    },
});

export const resetOrgUnitsLevels = () => ({
    type: RESET_ORG_UNITS_LEVELS,
});

export const orgUnitsLevelsInitialState = {
    fetching: false,
    list: [],
};

export const orgUnitsLevelsReducer = (
    state = orgUnitsLevelsInitialState,
    action = {},
) => {
    switch (action.type) {
        case SET_ORG_UNITS_LEVEL: {
            const { orgUnitlist, level, listIndex } = action.payload;
            let list;
            if (listIndex || listIndex === 0) {
                list = [...state.list];
                list[listIndex] = [];
                if (state.list[listIndex]) {
                    state.list[listIndex].forEach((l, i) => {
                        if (i < level) {
                            list[listIndex].push(state.list[listIndex][i]);
                        }
                    });
                }
                list[listIndex][level] = orgUnitlist;
            } else {
                list = [];
                state.list.forEach((l, i) => {
                    if (i < level) {
                        list.push(state.list[i]);
                    }
                });
                list[level] = orgUnitlist;
            }
            return {
                ...state,
                list,
            };
        }
        case RESET_ORG_UNITS_LEVELS: {
            return orgUnitsLevelsInitialState;
        }

        default:
            return state;
    }
};
