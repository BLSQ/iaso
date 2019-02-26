/*
 * Includes the actions and state necessary for the vector process
 */

export const LOAD_SITES = 'hat/vector/LOAD_SITES';
export const LOAD_TARGETS = 'hat/vector/LOAD_TARGETS';
export const LOAD_PAGINATED_SITES = 'hat/vector/LOAD_PAGINATED_SITES';
export const LOAD_PAGINATED_NEW_SITES = 'hat/vector/LOAD_PAGINATED_NEW_SITES';
export const LOAD_PAGINATED_TARGETS = 'hat/vector/LOAD_PAGINATED_TARGETS';
export const LOAD_NON_ENDEMIC_VILLAGES = 'hat/vector/LOAD_NON_ENDEMIC_VILLAGES';
export const LOAD_ENDEMIC_VILLAGES = 'hat/vector/LOAD_ENDEMIC_VILLAGES';
export const LOAD_PROFILES = 'hat/vector/LOAD_PROFILES';
export const LOAD_HABITATS = 'hat/vector/LOAD_HABITATS';
export const FETCH_ACTION = 'hat/vector/FETCH_ACTION';


export const loadSites = payload => ({
    type: LOAD_SITES,
    payload,
});

export const loadTargets = payload => ({
    type: LOAD_TARGETS,
    payload,
});

export const loadNonEndemicVillages = payload => ({
    type: LOAD_NON_ENDEMIC_VILLAGES,
    payload,
});
export const loadEndemicVillages = payload => ({
    type: LOAD_ENDEMIC_VILLAGES,
    payload,
});
export const loadProfiles = payload => ({
    type: LOAD_PROFILES,
    payload,
});
export const loadHabitats = payload => ({
    type: LOAD_HABITATS,
    payload,
});


export const loadPaginatedSites = (datas, params) => ({
    type: LOAD_PAGINATED_SITES,
    payload: {
        list: datas.list,
        showPagination: true,
        params,
        count: datas.count,
        pages: datas.pages,
    },
});

export const loadPaginatedNewSites = (datas, params) => ({
    type: LOAD_PAGINATED_NEW_SITES,
    payload: {
        list: datas.list,
        showPagination: true,
        params,
        count: datas.count,
        pages: datas.pages,
    },
});

export const loadPaginatedTargets = (datas, params) => ({
    type: LOAD_PAGINATED_TARGETS,
    payload: {
        list: datas.list,
        showPagination: true,
        params,
        count: datas.count,
        pages: datas.pages,
    },
});

export const vectorActions = {
    loadTraps: loadSites,
    loadTargets,
    loadPaginatedTraps: loadPaginatedSites,
    loadPaginatedNewSites,
    loadPaginatedTargets,
    loadNonEndemicVillages,
    loadEndemicVillages,
    loadProfiles,
    loadHabitats,
};

export const vectorInitialState = {
    paginatedSites: null,
    paginatedTargets: null,
    sites: null,
    newSites: null,
    targets: null,
    endemicVillages: undefined,
    nonEndemicVillages: undefined,
    sitesPage: {
        list: null,
        showPagination: false,
        params: {},
        count: 0,
        pages: 0,
    },
    newSitesPage: {
        list: null,
        showPagination: false,
        params: {},
        count: 0,
        pages: 0,
    },
    targetsPage: {
        list: null,
        showPagination: false,
        params: {},
        count: 0,
        pages: 0,
    },
    profiles: [],
    habitats: [],
};

export const vectorReducer = (state = vectorInitialState, action = {}) => {
    switch (action.type) {
        case LOAD_SITES: {
            const sites = action.payload;
            return { ...state, sites };
        }
        case LOAD_TARGETS: {
            const targets = action.payload;
            return { ...state, targets };
        }
        case LOAD_ENDEMIC_VILLAGES: {
            const endemicVillages = action.payload;
            return { ...state, endemicVillages };
        }
        case LOAD_NON_ENDEMIC_VILLAGES: {
            const nonEndemicVillages = action.payload;
            return { ...state, nonEndemicVillages };
        }
        case LOAD_PROFILES: {
            const profiles = action.payload;
            return { ...state, profiles };
        }
        case LOAD_HABITATS: {
            const habitats = action.payload;
            return { ...state, habitats };
        }

        case LOAD_PAGINATED_SITES: {
            const {
                list, showPagination, params, count, pages,
            } = action.payload;
            return {
                ...state,
                sitesPage: {
                    list,
                    showPagination,
                    params,
                    count,
                    pages,
                },
            };
        }
        case LOAD_PAGINATED_NEW_SITES: {
            const {
                list, showPagination, params, count, pages,
            } = action.payload;
            return {
                ...state,
                newSitesPage: {
                    list,
                    showPagination,
                    params,
                    count,
                    pages,
                },
            };
        }

        case LOAD_PAGINATED_TARGETS: {
            const {
                list, showPagination, params, count, pages,
            } = action.payload;
            return {
                ...state,
                targetsPage: {
                    list,
                    showPagination,
                    params,
                    count,
                    pages,
                },
            };
        }


        default:
            return state;
    }
};
