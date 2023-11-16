import { useSnackQuery } from '../../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import { apiUrl, makeSaveFunction } from './utils';
import { getRequest } from '../../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { VAR } from '../../Details/VaccineSupplyChainDetails';

export const useGetArrivalReportsDetails = (vrfId?: string) => {
    return useSnackQuery({
        queryFn: () => getRequest(`${apiUrl}${vrfId}/get_arrival_reports/`),
        queryKey: ['arrivalReportsDetails', vrfId],
        options: { enabled: Boolean(vrfId) },
    });
};

export const saveArrivalReports = makeSaveFunction({
    key: VAR,
    postSuffix: `add_${VAR}`,
    patchSuffix: `update_${VAR}`,
    deleteSuffix: `delete_${VAR}`,
});
