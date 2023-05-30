import { useDispatch } from 'react-redux';
import { getRequest } from '../../../libs/Api';

import { Instance } from '../../instances/types/instance';
import { enqueueSnackbar } from '../../../redux/snackBarsReducer';
import { errorSnackBar } from '../../../constants/snackBars';

type Result = {
    // eslint-disable-next-line camelcase
    edit_url: string;
};

export const useGetEnketoUrl = (
    returnUrl: string,
    instance?: Instance,
): (() => void) => {
    const dispatch = useDispatch();
    const getEnketoUrl = () => {
        if (instance) {
            getRequest(
                `/api/enketo/edit/${instance.uuid}?return_url=${returnUrl}`,
            )
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
    return getEnketoUrl;
};
