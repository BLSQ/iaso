import { useSnackQuery } from '../../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import { apiUrl } from './utils';
import { getRequest } from '../../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';

export const useGetArrivalReportsDetails = (vrfId?: string) => {
    return useSnackQuery({
        queryFn: () => getRequest(`${apiUrl}${vrfId}/get_arrival_reports/`),
        queryKey: ['arrivalReportsDetails', vrfId],
        options: { enabled: Boolean(vrfId) },
    });
};
