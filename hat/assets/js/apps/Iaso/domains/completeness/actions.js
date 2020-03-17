import { getRequest } from '../../libs/Api';
import { enqueueSnackbar } from '../../../../redux/snackBarsReducer';
import { errorSnackBar } from '../../../../utils/constants/snackBars';

export const START_FETCHING_COMPLETENESS = 'START_FETCHING_COMPLETENESS';
export const STOP_FETCHING_COMPLETENESS = 'STOP_FETCHING_COMPLETENESS';
export const SET_COMPLETENESS = 'SET_COMPLETENESS';


const startFetchingCompleteness = () => ({
    type: START_FETCHING_COMPLETENESS,
});

const stopFetchingCompleteness = () => ({
    type: STOP_FETCHING_COMPLETENESS,
});

const setCompleteness = data => ({
    type: SET_COMPLETENESS,
    payload: data,
});

export const fetchCompleteness = () => (dispatch) => {
    dispatch(startFetchingCompleteness());
    return getRequest('/api/completeness/')
        .then(res => dispatch(setCompleteness(res.completeness)))
        .catch(() => dispatch(enqueueSnackbar(errorSnackBar('fetchCompletenessError'))))
        .then(() => {
            dispatch(stopFetchingCompleteness());
        });
};
