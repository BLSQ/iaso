const SET_PROFILES = 'SET_PROFILES';

export const setProfiles = list => ({
    type: SET_PROFILES,
    payload: list,
});

export const profilesInitialState = {
    list: [],
};

export const profilesReducer = (state = profilesInitialState, action = {}) => {
    switch (action.type) {
        case SET_PROFILES: {
            const list = action.payload;
            return {
                ...state,
                list,
            };
        }

        default:
            return state;
    }
};
