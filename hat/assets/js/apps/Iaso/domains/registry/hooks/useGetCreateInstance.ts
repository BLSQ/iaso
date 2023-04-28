import { useDispatch } from 'react-redux';

import { postRequest } from '../../../libs/Api';
import { enqueueSnackbar } from '../../../redux/snackBarsReducer';
import { errorSnackBar } from '../../../constants/snackBars';

type Result = {
    // eslint-disable-next-line camelcase
    edit_url: string;
};

export const useGetCreateInstance = (
    returnUrl: string,
    formId?: string,
    // eslint-disable-next-line no-unused-vars
): ((orgUnitId: number) => void) => {
    const dispatch = useDispatch();
    const createInstance = (orgUnitId: number) => {
        if (formId) {
            postRequest('/api/enketo/create/', {
                org_unit_id: orgUnitId,
                form_id: formId,
                return_url: returnUrl,
            })
                .then((res: Result) => {
                    window.location.href = res.edit_url;
                })
                .catch(err => {
                    dispatch(
                        enqueueSnackbar(
                            errorSnackBar('fetchEnketoError', null, err),
                        ),
                    );
                });
        }
    };
    return createInstance;
};
