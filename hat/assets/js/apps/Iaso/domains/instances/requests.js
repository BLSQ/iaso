import { iasoGetRequest } from '../../utils/requests';
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
