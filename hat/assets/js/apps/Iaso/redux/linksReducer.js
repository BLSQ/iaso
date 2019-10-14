const SET_LINKS = 'SET_LINKS';
const SET_FETCHING = 'SET_FETCHING';
const SET_LINKS_LIST_FETCHING = 'SET_LINKS_LIST_FETCHING';

export const setLinks = (list, showPagination, params, count, pages) => ({
    type: SET_LINKS,
    payload: {
        list,
        showPagination,
        params,
        count,
        pages,
    },
});

export const setLinksListFetching = currentSubOrgUnit => ({
    type: SET_LINKS_LIST_FETCHING,
    payload: currentSubOrgUnit,
});


export const setFetching = fetching => ({
    type: SET_FETCHING,
    payload: fetching,
});

export const linksInitialState = {
    current: null,
    fetchingList: false,
    fetchingDetail: true,
    linksPage: {
        list: null,
        showPagination: false,
        params: {},
        count: 0,
        pages: 0,
    },
};

export const linksReducer = (state = linksInitialState, action = {}) => {
    switch (action.type) {
        case SET_LINKS: {
            const {
                list, showPagination, params, count, pages,
            } = action.payload;
            return {
                ...state,
                linksPage: {
                    list,
                    showPagination,
                    params,
                    count,
                    pages,
                },
            };
        }

        case SET_LINKS_LIST_FETCHING: {
            const fetchingList = action.payload;
            return { ...state, fetchingList };
        }

        default:
            return state;
    }
};
