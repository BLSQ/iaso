const SET_TABLE_SELECTED = 'SET_TABLE_SELECTED';
const SET_TABLE_UNSELECTED = 'SET_TABLE_UNSELECTED';
const SET_TABLE_SELECT_ALL = 'SET_TABLE_SELECT_ALL';
const RESET_TABLE_SELECTION = 'RESET_TABLE_SELECTION';

export const setTableSelected = selectedItems => ({
    type: SET_TABLE_SELECTED,
    payload: selectedItems,
});
export const setTableUnSelected = unSelectedItems => ({
    type: SET_TABLE_UNSELECTED,
    payload: unSelectedItems,
});
export const setTableSelectAll = () => ({
    type: SET_TABLE_SELECT_ALL,
});

export const resetTableSelection = () => ({
    type: RESET_TABLE_SELECTION,
});


export const tableSelectInitialState = {
    selectedItems: [],
    unSelectedItems: [],
    selectAll: false,
};

export const tableSelectReducer = (state = tableSelectInitialState, action = {}) => {
    switch (action.type) {
        case SET_TABLE_SELECTED: {
            return {
                ...state,
                selectedItems: action.payload,
            };
        }
        case SET_TABLE_UNSELECTED: {
            return {
                ...state,
                unSelectedItems: action.payload,
            };
        }
        case SET_TABLE_SELECT_ALL: {
            return {
                ...state,
                selectAll: true,
            };
        }
        case RESET_TABLE_SELECTION: {
            return tableSelectInitialState;
        }


        default:
            return state;
    }
};
