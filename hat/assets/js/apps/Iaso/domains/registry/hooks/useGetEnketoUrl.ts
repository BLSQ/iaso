import { openSnackBar } from '../../../components/snackBars/EventDispatcher';
import { errorSnackBar } from '../../../constants/snackBars';
import { getRequest } from '../../../libs/Api';
import { Instance } from '../../instances/types/instance';

type Result = {
    edit_url: string;
};

export const useGetEnketoUrl = (
    returnUrl: string,
    instance?: Instance,
): (() => void) => {
    const getEnketoUrl = () => {
        if (instance) {
            getRequest(
                `/api/enketo/edit/${instance.uuid}?return_url=${returnUrl}`,
            )
                .then((res: Result) => {
                    window.location.href = res.edit_url;
                })
                .catch(err => {
                    openSnackBar(errorSnackBar('fetchEnketoError', null, err));
                });
        }
    };
    return getEnketoUrl;
};
