import { getRequest } from '../../libs/Api';
import { enqueueSnackbar } from '../../../../redux/snackBarsReducer';
import { errorSnackBar } from '../../components/snackBars';

export const START_FETCHING_COMPLETENESS = 'START_FETCHING_COMPLETENESS';
export const STOP_FETCHING_COMPLETENESS = 'STOP_FETCHING_COMPLETENESS';
export const SET_COMPLETENESS = 'SET_COMPLETENESS';

function startFetchingCompleteness() {
    return { type: 'START_FETCHING_COMPLETENESS' };
}

function stopFetchingCompleteness() {
    return { type: 'STOP_FETCHING_COMPLETENESS' };
}

function setCompleteness(data) {
    return { type: 'SET_COMPLETENESS', payload: data };
}

// eslint-disable-next-line import/prefer-default-export
export function fetchCompleteness() {
    return (dispatch) => {
        dispatch(startFetchingCompleteness());
        return getRequest('/api/completeness/')
            .then(res => dispatch(setCompleteness(res.completeness)))
            // .catch(console.error)
            .catch(() => dispatch(enqueueSnackbar(errorSnackBar('fetchCompletenessError'))))
            .then(() => {
                dispatch(stopFetchingCompleteness());
            });
    };
}
