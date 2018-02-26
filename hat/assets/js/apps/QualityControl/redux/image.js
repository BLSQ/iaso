export const SET_IMAGE_LIST = 'hat/locator/cases/SET_IMAGE_LIST';


// Note: `TypeError: Object.values is not a function` in tests :'(


export const setImageList = list => ({
    type: SET_IMAGE_LIST,
    payload: list,
});

export const imageActions = {
    setImageList,
};

export const imageReducer = (state = {}, action = {}) => {
    switch (action.type) {
        case SET_IMAGE_LIST: {
            const newState = action.payload;
            return { ...newState };
        }

        default:
            return state;
    }
};
