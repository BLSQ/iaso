import { openSnackBar } from '../../../components/snackBars/EventDispatcher';
import { errorSnackBar } from '../../../constants/snackBars';
import { postRequest } from '../../../libs/Api';

type Result = {
    // eslint-disable-next-line camelcase
    edit_url: string;
};

export const useGetCreateInstance = (
    returnUrl: string,
    formId?: string,
): ((orgUnitId: number) => void) => {
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
                    openSnackBar(errorSnackBar('fetchEnketoError', null, err));
                });
        }
    };
    return createInstance;
};
