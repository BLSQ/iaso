import { getRequest } from '../../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useSnackQuery } from '../../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import { apiUrl } from '../../constants';

export const useGetPreAlertDetails = (vrfId?: string) => {
    return useSnackQuery({
        queryFn: () => getRequest(`${apiUrl}${vrfId}/get_pre_alerts/`),
        queryKey: ['preAlertDetails', vrfId],
        options: { enabled: Boolean(vrfId) },
    });
};
