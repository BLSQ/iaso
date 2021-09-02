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

export const fetchCompleteness = dispatch => () => {
    return getRequest('/api/completeness/')
        .then(res => res.completeness)
        .catch(err =>
            dispatch(
                enqueueSnackbar(
                    errorSnackBar('fetchCompletenessError', null, err),
                ),
            ),
        );
};

export const generateDerivedInstances = derivedrequest => dispatch => {
    dispatch(startFetchingCompleteness());
    postRequest('/api/derivedinstances/', derivedrequest)
        .then(() =>
            dispatch(
                enqueueSnackbar(
                    succesfullSnackBar('generateDerivedRequestSuccess'),
                ),
            ),
        )
        .then(() => dispatch(fetchCompleteness()))
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
