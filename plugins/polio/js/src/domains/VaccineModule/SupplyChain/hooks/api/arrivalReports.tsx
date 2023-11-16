import { useSnackQuery } from '../../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import { getRequest } from '../../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { apiUrl } from '../../constants';

export const useGetArrivalReportsDetails = (vrfId?: string) => {
    return useSnackQuery({
        queryFn: () => getRequest(`${apiUrl}${vrfId}/get_arrival_reports/`),
        queryKey: ['arrivalReportsDetails', vrfId],
        options: { enabled: Boolean(vrfId) },
    });
};
