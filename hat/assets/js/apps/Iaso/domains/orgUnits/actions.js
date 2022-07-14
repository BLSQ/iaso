import { postRequest } from 'Iaso/libs/Api';
import { enqueueSnackbar } from '../../redux/snackBarsReducer';
import { errorSnackBar, succesfullSnackBar } from '../../constants/snackBars';

export const SET_ORG_UNITS = 'SET_ORG_UNITS';
export const SET_ORG_UNITS_LOCATIONS = 'SET_ORG_UNITS_LOCATIONS';
export const RESET_ORG_UNITS = 'RESET_ORG_UNITS';
export const SET_SUB_ORG_UNIT = 'SET_SUB_ORG_UNIT';
export const SET_FETCHING = 'SET_FETCHING';
export const SET_ORG_UNIT_TYPES = 'SET_ORG_UNIT_TYPES';
export const SET_SOURCES = 'SET_SOURCES';
export const SET_ORG_UNITS_LIST_FETCHING = 'SET_ORG_UNITS_LIST_FETCHING';
export const SET_FETCHING_ORG_UNITS_TYPES = 'SET_FETCHING_ORG_UNITS_TYPES';
export const SET_FILTERS_UPDATED = 'SET_FILTERS_UPDATED';

export const setOrgUnits = (
    list,
    showPagination,
    params,
    count,
    pages,
    counts,
) => ({
    type: SET_ORG_UNITS,
    payload: {
        list,
        showPagination,
        params,
        count,
        pages,
        counts,
    },
});

export const setOrgUnitsLocations = orgUnitsLocations => ({
    type: SET_ORG_UNITS_LOCATIONS,
    payload: orgUnitsLocations,
});

export const resetOrgUnits = () => ({
    type: RESET_ORG_UNITS,
});

export const setCurrentSubOrgUnit = orgUnit => ({
    type: SET_SUB_ORG_UNIT,
    payload: orgUnit,
});

export const setOrgUnitTypes = orgUnitTypes => ({
    type: SET_ORG_UNIT_TYPES,
    payload: orgUnitTypes,
});

export const setSources = sources => ({
    type: SET_SOURCES,
    payload: sources,
});

export const setOrgUnitsListFetching = currentSubOrgUnit => ({
    type: SET_ORG_UNITS_LIST_FETCHING,
    payload: currentSubOrgUnit,
});

export const setFetching = fetching => ({
    type: SET_FETCHING,
    payload: fetching,
});

export const setFetchingOrgUnitTypes = fetching => ({
    type: SET_FETCHING_ORG_UNITS_TYPES,
    payload: fetching,
});

export const setFiltersUpdated = filtersUpdated => ({
    type: SET_FILTERS_UPDATED,
    payload: filtersUpdated,
});

export const saveMultiEdit = data => dispatch => {
    dispatch(setOrgUnitsListFetching(true));
    return postRequest('/api/tasks/create/orgunitsbulkupdate/', { ...data })
        .then(res => {
            dispatch(
                enqueueSnackbar(
                    succesfullSnackBar('saveMultiEditOrgUnitsLaunched'),
                ),
            );
            return res;
        })
        .catch(error => {
            dispatch(
                enqueueSnackbar(
                    errorSnackBar('saveMultiEditOrgUnitsError', null, error),
                ),
            );
            dispatch(setOrgUnitsListFetching(false));
        });
};
