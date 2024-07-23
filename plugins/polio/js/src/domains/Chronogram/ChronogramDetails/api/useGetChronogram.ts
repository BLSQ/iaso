import { UseBaseQueryResult } from 'react-query';

import { useSnackQuery } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import { getRequest } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';

import { Chronogram } from '../../Chronogram/types';
import { apiBaseUrl } from '../../constants';

export const useGetChronogram = (
    chronogramID: string,
): UseBaseQueryResult<Chronogram, unknown> => {
    return useSnackQuery({
        queryKey: ['chronogramWithTasks', chronogramID],
        queryFn: () => getRequest(`${apiBaseUrl}/${chronogramID}/`),
    });
};
