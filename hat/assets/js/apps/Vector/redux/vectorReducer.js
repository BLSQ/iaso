/*
 * Includes the actions and state necessary for the vector process
 */

export const LOAD_SITES = 'hat/vector/LOAD_SITES';
export const LOAD_TRAPS = 'hat/vector/LOAD_TRAPS';
export const LOAD_TARGETS = 'hat/vector/LOAD_TARGETS';
export const LOAD_CATCHES = 'hat/vector/LOAD_CATCHES';
export const LOAD_PAGINATED_SITES = 'hat/vector/LOAD_PAGINATED_SITES';
export const LOAD_PAGINATED_TRAPS = 'hat/vector/LOAD_PAGINATED_TRAPS';
export const LOAD_PAGINATED_TARGETS = 'hat/vector/LOAD_PAGINATED_TARGETS';
export const LOAD_PAGINATED_CATCHES = 'hat/vector/LOAD_PAGINATED_CATCHES';
export const LOAD_NON_ENDEMIC_VILLAGES = 'hat/vector/LOAD_NON_ENDEMIC_VILLAGES';
export const LOAD_ENDEMIC_VILLAGES = 'hat/vector/LOAD_ENDEMIC_VILLAGES';
export const LOAD_PROFILES = 'hat/vector/LOAD_PROFILES';
export const LOAD_TEAMS = 'hat/vector/LOAD_TEAMS';
export const LOAD_HABITATS = 'hat/vector/LOAD_HABITATS';
export const FETCH_ACTION = 'hat/vector/FETCH_ACTION';
export const IS_TRAP_UPDATED = 'hat/vector/IS_TRAP_UPDATED';


export const loadSites = payload => ({
    type: LOAD_SITES,
    payload,
});

export const loadTraps = payload => ({
    type: LOAD_TRAPS,
    payload,
});

export const loadTargets = payload => ({
    type: LOAD_TARGETS,
    payload,
});

export const loadCatches = payload => ({
    type: LOAD_CATCHES,
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
export const loadTeams = payload => ({
    type: LOAD_TEAMS,
    payload,
});
export const loadHabitats = payload => ({
    type: LOAD_HABITATS,
    payload,
});
export const trapUpdated = payload => ({
    type: IS_TRAP_UPDATED,
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

export const loadPaginatedTraps = (datas, params) => ({
    type: LOAD_PAGINATED_TRAPS,
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

export const loadPaginatedCatches = (datas, params) => ({
    type: LOAD_PAGINATED_CATCHES,
    payload: {
        list: datas.list,
        showPagination: true,
        params,
        count: datas.count,
        pages: datas.pages,
    },
});

export const vectorActions = {
    loadSites,
    loadTraps,
    loadTargets,
    loadCatches,
    loadPaginatedTraps,
    loadPaginatedSites,
    loadPaginatedTargets,
    loadPaginatedCatches,
    loadNonEndemicVillages,
    loadEndemicVillages,
    loadProfiles,
    loadTeams,
    loadHabitats,
    trapUpdated,
};

export const vectorInitialState = {
    paginatedSites: null,
    paginatedTargets: null,
    sites: null,
    traps: null,
    targets: null,
    catches: null,
    endemicVillages: undefined,
    nonEndemicVillages: undefined,
    sitesPage: {
        list: null,
        showPagination: false,
        params: {},
        count: 0,
        pages: 0,
    },
    trapsPage: {
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
    catchesPage: {
        list: null,
        showPagination: false,
        params: {},
        count: 0,
        pages: 0,
    },
    profiles: [],
    habitats: [],
    isTrapUpdated: false,
    teams: [],
};

export const vectorReducer = (state = vectorInitialState, action = {}) => {
    switch (action.type) {
        case LOAD_SITES: {
            const sites = action.payload;
            return { ...state, sites };
        }
        case LOAD_TRAPS: {
            const traps = action.payload;
            return { ...state, traps };
        }
        case LOAD_TARGETS: {
            const targets = action.payload;
            return { ...state, targets };
        }
        case LOAD_CATCHES: {
            const catches = action.payload;
            return { ...state, catches };
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
        case LOAD_TEAMS: {
            const teams = action.payload;
            return { ...state, teams };
        }
        case LOAD_HABITATS: {
            const habitats = action.payload;
            return { ...state, habitats };
        }
        case IS_TRAP_UPDATED: {
            const isTrapUpdated = action.payload;
            return { ...state, isTrapUpdated };
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
        case LOAD_PAGINATED_TRAPS: {
            const {
                list, showPagination, params, count, pages,
            } = action.payload;
            return {
                ...state,
                trapsPage: {
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

        case LOAD_PAGINATED_CATCHES: {
            const {
                list, showPagination, params, count, pages,
            } = action.payload;
            return {
                ...state,
                catchesPage: {
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
