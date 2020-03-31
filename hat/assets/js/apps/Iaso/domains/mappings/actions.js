import { getRequest } from '../../libs/Api';
import { enqueueSnackbar } from '../../../../redux/snackBarsReducer';
import { errorSnackBar } from '../../../../utils/constants/snackBars';

export const SET_MAPPINGS = 'SET_FORMS';
export const SET_CURRENT_MAPPING = 'SET_CURRENT_FORM';
export const FETCHING_MAPPINGS = 'LOAD_MAPPINGS';


export const fetchingMapping = fetching => ({
    type: FETCHING_MAPPINGS,
    payload: fetching,
});

export const setMappings = ({ mappings, count, pages }) => ({
    type: SET_MAPPINGS,
    payload: {
        mappings, count, pages,
    },
});

export const setCurrentMApping = mapping => ({
    type: SET_CURRENT_MAPPING,
    payload: mapping,
});

export const fetchMappings = params => (dispatch) => {
    dispatch(fetchingMapping(true));
    return getRequest(`/api/mappings?order=${params.order}&limit=${params.pageSize}&page=${params.page}`)
        .then(res => dispatch(setMappings(res)))
        .catch(() => dispatch(enqueueSnackbar(errorSnackBar('fetchMappingsError'))))
        .then(() => {
            dispatch(fetchingMapping(false));
        });
};
