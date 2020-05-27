const SET_TABLE_SELECTION = 'SET_TABLE_SELECTION';
const RESET_TABLE_SELECTION = 'RESET_TABLE_SELECTION';

export const setTableSelection = selectionArray => ({
    type: SET_TABLE_SELECTION,
    payload: selectionArray,
});

export const resetTableSelection = () => ({
    type: RESET_TABLE_SELECTION,
});


export const tableSelectInitialState = {
    selectionArray: [],
};

export const tableSelectReducer = (state = tableSelectInitialState, action = {}) => {
    switch (action.type) {
        case SET_TABLE_SELECTION: {
            return {
                ...state,
                selectionArray: action.payload,
            };
        }
        case RESET_TABLE_SELECTION: {
            return {
                ...state,
                selectionArray: [],
            };
        }


        default:
            return state;
    }
};
