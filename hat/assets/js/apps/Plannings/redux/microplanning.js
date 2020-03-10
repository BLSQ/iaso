import { loadActions } from '../../../redux/load';

import { enqueueSnackbar } from '../../../redux/snackBarsReducer';
import { errorSnackBar } from '../../../utils/constants/snackBars';

export const SET_VILLAGES = 'hat/microplanning/SET_VILLAGES';
export const SET_WORKZONES = 'hat/microplanning/SET_WORKZONES';
export const SET_TEAMS = 'hat/microplanning/SET_TEAMS';

const req = require('superagent');

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

export const fetchAction = (url, setAction, toggleLoad = true) => (dispatch) => {
    if (toggleLoad) {
        dispatch(loadActions.startLoading());
    }
    return req
        .get(url)
        .then((result) => {
            if (toggleLoad) {
                dispatch(loadActions.successLoadingNoData());
            }
            const reduxAction = setAction(result.body);
            dispatch(reduxAction);
            return true;
        })
        .catch((err) => {
            const reduxAction = setAction(null);
            dispatch(enqueueSnackbar(errorSnackBar(null, reduxAction.errorMessage)));
            console.error(`Error while fetching ${reduxAction.errorLabel}: ${err}`);
            return err;
        });
};


export const microplanningInitialState = {
    villagesList: null,
    workZonesList: null,
    teamsList: null,
};
export const microplanningReducer = (state = microplanningInitialState, action = {}) => {
    switch (action.type) {
        case SET_VILLAGES:
            return { ...state, villagesList: action.payload };
        case SET_TEAMS:
            return { ...state, teamsList: action.payload };
        case SET_WORKZONES:
            return { ...state, workZonesList: action.payload };

        default:
            return state;
    }
};
