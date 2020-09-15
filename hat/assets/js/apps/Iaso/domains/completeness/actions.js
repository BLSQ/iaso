import { getRequest, postRequest } from '../../libs/Api';
import { enqueueSnackbar } from '../../redux/snackBarsReducer';
import { errorSnackBar, succesfullSnackBar } from '../../constants/snackBars';

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

export const fetchCompleteness = () => dispatch => {
    dispatch(startFetchingCompleteness());
    return getRequest('/api/completeness/')
        .then(res => dispatch(setCompleteness(res.completeness)))
        .catch(err =>
            dispatch(
                enqueueSnackbar(
                    errorSnackBar('fetchCompletenessError', null, err),
                ),
            ),
        )
        .then(() => {
            dispatch(stopFetchingCompleteness());
        });
};

export const generateDerivedInstances = derivedrequest => dispatch => {
    dispatch(startFetchingCompleteness());
    postRequest('/api/derivedinstances/', derivedrequest)
        .then(res =>
            dispatch(
                enqueueSnackbar(
                    succesfullSnackBar('generateDerivedRequestSuccess'),
                ),
            ),
        )
        .then(res => dispatch(fetchCompleteness()))
        .catch(err =>
            dispatch(
                enqueueSnackbar(
                    errorSnackBar('generateDerivedRequestError', null, err),
                ),
            ),
        )
        .then(() => {
            dispatch(stopFetchingCompleteness());
        });
};
