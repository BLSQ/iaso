const SET_TABLE_SELECTED = 'SET_TABLE_SELECTED';
const SET_TABLE_UNSELECTED = 'SET_TABLE_UNSELECTED';
const SET_TABLE_SELECT_ALL = 'SET_TABLE_SELECT_ALL';
const RESET_TABLE_SELECTION = 'RESET_TABLE_SELECTION';

export const setTableSelected = selectedItems => ({
    type: SET_TABLE_SELECTED,
    payload: selectedItems,
});
export const setTableUnSelected = (unSelectedItems, totalCount) => ({
    type: SET_TABLE_UNSELECTED,
    payload: { unSelectedItems, totalCount },
});
export const setTableSelectAll = totalCount => ({
    type: SET_TABLE_SELECT_ALL,
    payload: totalCount,
});

export const resetTableSelection = () => ({
    type: RESET_TABLE_SELECTION,
});


export const tableSelectInitialState = {
    selectedItems: [],
    unSelectedItems: [],
    selectAll: false,
    count: 0,
};

export const tableSelectReducer = (state = tableSelectInitialState, action = {}) => {
    switch (action.type) {
        case SET_TABLE_SELECTED: {
            const selectedItems = action.payload;
            return {
                ...state,
                selectedItems,
                count: selectedItems.length,
            };
        }
        case SET_TABLE_UNSELECTED: {
            const { unSelectedItems, totalCount } = action.payload;
            return {
                ...state,
                unSelectedItems,
                count: totalCount - unSelectedItems.length,
            };
        }
        case SET_TABLE_SELECT_ALL: {
            const totalCount = action.payload;
            return {
                ...state,
                selectAll: true,
                count: totalCount - state.unSelectedItems.length,
            };
        }
        case RESET_TABLE_SELECTION: {
            return tableSelectInitialState;
        }


        default:
            return state;
    }
};
