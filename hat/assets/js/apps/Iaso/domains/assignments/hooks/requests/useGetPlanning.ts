import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';
import { Planning } from '../../types/planning';

const getPlanning = (planningId: string): Promise<Planning> => {
    return getRequest(`/api/microplanning/plannings/${planningId}/`);
};
export const useGetPlanning = (
    planningId: string,
): UseQueryResult<Planning, Error> => {
    const queryKey: any[] = ['teams', planningId];
    return useSnackQuery(queryKey, () => getPlanning(planningId), undefined, {
        retry: false,
        enabled: Boolean(planningId),
    });
};
