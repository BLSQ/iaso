import { iasoGetRequest } from '../../utils/requests';
import { getRequest } from '../../libs/Api';
import { enqueueSnackbar } from '../../redux/snackBarsReducer';
import { errorSnackBar } from '../../constants/snackBars';
// import { setCurrentForm } from '../forms/actions';
// import { dispatch as storeDispatch } from '../../redux/store';

export const fetchFormDetailsForInstance = formId => {
    return iasoGetRequest({
        requestParams: {
            url: `/api/forms/${formId}/?fields=name,period_type,label_keys,id`,
        },
        disableSuccessSnackBar: true,
        errorKeyMessage: 'Fetch form for Instance error',
        consoleError: 'fetchFormDetailsForInstance',
    }).then(response => {
        // TODO remove this, use local state
        // storeDispatch(setCurrentForm(response));
        return response;
    });
};

export const fetchPossibleFields = async formId => {
    if (!formId) return null;
    const response = await iasoGetRequest({
        requestParams: {
            url: `/api/forms/${formId}/?fields=possible_fields`,
        },
        disableSuccessSnackBar: true,
        errorKeyMessage: 'Error fetching possible fields',
        consoleError: 'fetchPossibleFields',
    });
    return response.possible_fields;
};
export const fetchInstancesAsDict = (dispatch, url) =>
    getRequest(url)
        .then(instances => instances)
        .catch(error => {
            dispatch(
                enqueueSnackbar(
                    errorSnackBar('fetchInstanceDictError', null, error),
                ),
            );
            console.error('Error while fetching submissions list:', error);
            throw error;
        });
export const fetchInstancesAsSmallDict = (dispatch, url) =>
    getRequest(`${url}&asSmallDict=true`)
        .then(instances => instances)
        .catch(error => {
            dispatch(
                enqueueSnackbar(
                    errorSnackBar('fetchInstanceLocationError', null, error),
                ),
            );
            console.error(
                'Error while fetching instances locations list:',
                error,
            );
            throw error;
        });
