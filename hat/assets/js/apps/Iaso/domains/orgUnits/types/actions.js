import mapValues from 'lodash/mapValues';
import {
    fetchAction,
    saveAction,
    createAction,
    deleteAction,
} from '../../../redux/actions/formsActions';

export const SET_ORG_UNIT_TYPES = 'ORG_UNIT_TYPES/SET_ORG_UNIT_TYPES';
export const SET_ALL_ORG_UNIT_TYPES = 'ORG_UNIT_TYPES/SET_ALL_ORG_UNIT_TYPES';
export const SET_CURRENT_ORG_UNIT_TYPE =
    'ORG_UNIT_TYPES/SET_CURRENT_ORG_UNIT_TYPE';
export const SET_IS_FETCHING_ORG_UNIT_TYPES =
    'ORG_UNIT_TYPES/SET_IS_FETCHING_ORG_UNIT_TYPES';

export const setOrgUnitTypes = (list, { count, pages }) => ({
    type: SET_ORG_UNIT_TYPES,
    payload: {
        list,
        count,
        pages,
    },
});

export const setAllOrgUnitTypes = orgUnitsTtypes => ({
    type: SET_ALL_ORG_UNIT_TYPES,
    payload: orgUnitsTtypes,
});

export const setIsFetching = fetching => ({
    type: SET_IS_FETCHING_ORG_UNIT_TYPES,
    payload: fetching,
});

const apiKey = 'orgunittypes';
export const fetchOrgUnitTypes = params => dispatch =>
    fetchAction(
        dispatch,
        apiKey,
        setOrgUnitTypes,
        'fetchOrgUnitTypesError',
        'orgUnitTypes',
        params,
        setIsFetching,
    );

export const fetchAllOrgUnitTypes = () => dispatch =>
    fetchAction(
        dispatch,
        apiKey,
        setAllOrgUnitTypes,
        'fetchOrgUnitTypesError',
        'orgUnitTypes',
    );

export const saveOrgUnitType = orgUnitTypeData => dispatch =>
    saveAction(
        dispatch,
        mapValues(orgUnitTypeData, v => v.value),
        apiKey,
        'saveOrgUnitTypeSuccesfull',
        'saveOrgUnitTypeError',
        setIsFetching,
    );

export const createOrgUnitType = orgUnitTypeData => dispatch =>
    createAction(
        dispatch,
        mapValues(orgUnitTypeData, v => v.value),
        apiKey,
        'saveOrgUnitTypeSuccesfull',
        'saveOrgUnitTypeError',
        setIsFetching,
    );

export const deleteOrgUnitType = (orgUnitType, params) => dispatch =>
    deleteAction(
        dispatch,
        orgUnitType,
        apiKey,
        setOrgUnitTypes,
        'deleteOrgUnitTypeSuccesfull',
        'deleteOrgUnitTypeError',
        'orgUnitTypes',
        params,
        setIsFetching,
    );
