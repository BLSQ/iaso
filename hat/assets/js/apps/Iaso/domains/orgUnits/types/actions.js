import {
    getRequest, patchRequest, postRequest, deleteRequest,
} from '../../../libs/Api';
import { enqueueSnackbar } from '../../../../../redux/snackBarsReducer';
import { errorSnackBar, succesfullSnackBar } from '../../../../../utils/constants/snackBars';

export const SET_ORG_UNIT_TYPES = 'ORG_UNIT_TYPES/SET_ORG_UNIT_TYPES';
export const SET_CURRENT_ORG_UNIT_TYPE = 'ORG_UNIT_TYPES/SET_CURRENT_ORG_UNIT_TYPE';
export const SET_IS_FETCHING_ORG_UNIT_TYPES = 'ORG_UNIT_TYPES/SET_IS_FETCHING_ORG_UNIT_TYPES';


export const setOrgUnitTypes = (list, { count, pages }) => ({
    type: SET_ORG_UNIT_TYPES,
    payload: {
        list,
        count,
        pages,
    },
});

export const setIsFetching = fetching => ({
    type: SET_IS_FETCHING_ORG_UNIT_TYPES,
    payload: fetching,
});


export const fetchOrgUnitTypes = params => (dispatch) => {
    let url = '/api/orgunittypes';
    if (params) {
        url += `?order=${params.order}&limit=${params.pageSize}&page=${params.page}`;
        if (params.search) {
            url += `&search=${params.search}`;
        }
        dispatch(setIsFetching(true));
    }
    return getRequest(url)
        .then(res => dispatch(setOrgUnitTypes(res.orgUnitTypes, params ? { count: res.count, pages: res.pages } : { count: res.orgUnitTypes.length, pages: 1 })))
        .catch(() => dispatch(enqueueSnackbar(errorSnackBar('fetchOrgUnitTypesError'))))
        .then(() => {
            if (params) {
                dispatch(setIsFetching(false));
            }
        });
};

export const saveOrgUnitType = orgUnitType => (dispatch) => {
    dispatch(setIsFetching(true));
    return (patchRequest(`/api/orgunittypes/${orgUnitType.id}/`, orgUnitType, true)
        .then((res) => {
            dispatch(enqueueSnackbar(succesfullSnackBar('saveOrgUnitTypeSuccesfull')));
            return res;
        })
        .catch((error) => {
            dispatch(enqueueSnackbar(errorSnackBar('saveOrgUnitTypeError')));
            dispatch(setIsFetching(false));
            throw error;
        }));
};

export const createOrgUnitType = orgUnitType => (dispatch) => {
    dispatch(setIsFetching(true));
    return (postRequest('/api/orgunittypes/', orgUnitType)
        .then((res) => {
            dispatch(enqueueSnackbar(succesfullSnackBar('saveOrgUnitTypeSuccesfull')));
            return res;
        })
        .catch((error) => {
            dispatch(enqueueSnackbar(errorSnackBar('saveOrgUnitTypeError')));
            dispatch(setIsFetching(false));
            throw error;
        }));
};

export const deleteOrgUnitType = (orgUnitType, params) => (dispatch) => {
    dispatch(setIsFetching(true));
    return (deleteRequest(`/api/orgunittypes/${orgUnitType.id}/`)
        .then((res) => {
            dispatch(enqueueSnackbar(succesfullSnackBar('deleteOrgUnitTypeSuccesfull')));
            dispatch(fetchOrgUnitTypes(params));
            return res;
        })
        .catch((error) => {
            dispatch(enqueueSnackbar(errorSnackBar('deleteOrgUnitTypeError')));
            dispatch(setIsFetching(false));
            throw error;
        }));
};
