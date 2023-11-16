import { getRequest } from '../../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useSnackQuery } from '../../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import { PREALERT } from '../../Details/VaccineSupplyChainDetails';
import { apiUrl, makeSaveFunction } from './utils';

export const useGetPreAlertDetails = (vrfId?: string) => {
    return useSnackQuery({
        queryFn: () => getRequest(`${apiUrl}${vrfId}/get_pre_alerts/`),
        queryKey: ['preAlertDetails', vrfId],
        options: { enabled: Boolean(vrfId) },
    });
};

export const savePreAlerts = makeSaveFunction({
    key: PREALERT,
    postSuffix: `add_${PREALERT}`,
    patchSuffix: `update_${PREALERT}`,
    deleteSuffix: `delete_${PREALERT}`,
});
