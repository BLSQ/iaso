// import { UseQueryResult } from 'react-query';

// import { useSnackQuery } from '../../../libs/apiHooks';
import { getRequest } from '../../../libs/Api';

import { Instance } from '../../instances/types/instance';

type Result = {
    // eslint-disable-next-line camelcase
    edit_url: string;
};

export const useGetEnketoUrl = (
    location: string,
    instance?: Instance,
): (() => void) => {
    const getEnketoUrl = () => {
        getRequest(
            `/api/enketo/edit/${instance?.uuid}?return_url=${location}`,
        ).then((res: Result) => {
            window.location.href = res.edit_url;
        });
    };
    return getEnketoUrl;
};
