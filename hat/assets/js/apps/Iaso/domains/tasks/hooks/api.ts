import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../libs/Api';
import { useSnackQuery } from '../../../libs/apiHooks';

import { PolioNotificationImport } from '../types';

export const useGetPolioNotificationImport = (
    polioNotificationImportId: number | string | undefined,
): UseQueryResult<PolioNotificationImport, Error> => {
    return useSnackQuery({
        queryKey: ['instance', polioNotificationImportId],
        queryFn: () =>
            getRequest(
                `/api/polio/notifications/${polioNotificationImportId}/get_import_details/`,
            ),
        options: {
            enabled: Boolean(polioNotificationImportId),
            retry: false,
            keepPreviousData: true,
        },
    });
};
