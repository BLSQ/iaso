import { getRequest, postRequest } from '../../libs/Api';
import { enqueueSnackbar } from '../../redux/snackBarsReducer';
import { errorSnackBar, succesfullSnackBar } from '../../constants/snackBars';

// use a closure to pass the dispatch
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

export const generateDerivedInstances = dispatch => derivedrequest => {
    return postRequest('/api/derivedinstances/', derivedrequest)
        .then(() =>
            dispatch(
                enqueueSnackbar(
                    succesfullSnackBar('generateDerivedRequestSuccess'),
                ),
            ),
        )
        .catch(err =>
            dispatch(
                enqueueSnackbar(
                    errorSnackBar('generateDerivedRequestError', null, err),
                ),
            ),
        );
};
