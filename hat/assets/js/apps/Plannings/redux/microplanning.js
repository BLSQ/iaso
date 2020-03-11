export const SET_VILLAGES = 'hat/microplanning/SET_VILLAGES';
export const SET_WORKZONES = 'hat/microplanning/SET_WORKZONES';
export const SET_TEAMS = 'hat/microplanning/SET_TEAMS';
export const SET_COORDINATIONS = 'hat/microplanning/SET_COORDINATIONS';
export const SET_PLANNINGS = 'hat/microplanning/SET_PLANNINGS';
// export const SET_LOCATIONS = 'hat/microplanning/SET_LOCATIONS';
// export const SET_AERAS = 'hat/microplanning/SET_AERAS';

export const setVillages = data => ({
    type: SET_VILLAGES,
    payload: data,
    errorLabel: 'villages',
    errorMessage: {
        id: 'main.snackBar.errors.fetchVillages',
        defaultMessage: 'An error occurred while fetching village list',
    },
});

export const setWorkzones = data => ({
    type: SET_WORKZONES,
    payload: data,
    errorLabel: 'workzones',
    errorMessage: {
        id: 'main.snackBar.errors.fetchWorkZones',
        defaultMessage: 'An error occurred while fetching workzones list',
    },
});

export const setTeams = data => ({
    type: SET_TEAMS,
    payload: data,
    errorLabel: 'teams',
    errorMessage: {
        id: 'main.snackBar.errors.fetchTeams',
        defaultMessage: 'An error occurred while fetching teams list',
    },
});

export const setCoordinations = data => ({
    type: SET_COORDINATIONS,
    payload: data,
    errorLabel: 'coordinations',
    errorMessage: {
        id: 'main.snackBar.errors.fetchCoordinations',
        defaultMessage: 'An error occurred while fetching coordinations list',
    },
});

export const setPlannings = data => ({
    type: SET_PLANNINGS,
    payload: data,
    errorLabel: 'plannings',
    errorMessage: {
        id: 'main.snackBar.errors.fetchPlannings',
        defaultMessage: 'An error occurred while fetching plannings list',
    },
});

// export const setLocations = data => ({
//     type: SET_LOCATIONS,
//     payload: data,
//     errorLabel: 'locations',
//     errorMessage: {
//         id: 'main.snackBar.errors.fetchLocations',
//         defaultMessage: 'An error occurred while fetching locations list',
//     },
// });

// export const setAreas = data => ({
//     type: SET_AERAS,
//     payload: data,
//     errorLabel: 'areas',
//     errorMessage: {
//         id: 'main.snackBar.errors.fetchAreas',
//         defaultMessage: 'An error occurred while fetching areas list',
//     },
// });


export const microplanningInitialState = {
    villagesObject: null,
    teamsList: [],
    workZonesList: [],
    coordinationsList: [],
    planningsList: [],
};
export const microplanningReducer = (state = microplanningInitialState, action = {}) => {
    switch (action.type) {
        case SET_VILLAGES:
            return { ...state, villagesObject: action.payload };
        case SET_TEAMS:
            return { ...state, teamsList: action.payload };
        case SET_WORKZONES:
            return { ...state, workZonesList: action.payload };
        case SET_COORDINATIONS:
            return { ...state, coordinationsList: action.payload };
        case SET_PLANNINGS:
            return { ...state, planningsList: action.payload };
            // case SET_AERAS:
            //     return { ...state, areasList: action.payload };
            // case SET_LOCATIONS:
            //     return { ...state, locationsList: action.payload };

        default:
            return state;
    }
};
