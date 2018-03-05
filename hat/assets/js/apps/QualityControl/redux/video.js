export const SET_VIDEO_LIST = 'hat/locator/cases/SET_VIDEO_LIST';


// Note: `TypeError: Object.values is not a function` in tests :'(


export const setVideoList = list => ({
    type: SET_VIDEO_LIST,
    payload: list,
});

export const videoActions = {
    setVideoList,
};

export const videoReducer = (state = {}, action = {}) => {
    switch (action.type) {
        case SET_VIDEO_LIST: {
            const newState = action.payload;
            return { ...newState };
        }

        default:
            return state;
    }
};
