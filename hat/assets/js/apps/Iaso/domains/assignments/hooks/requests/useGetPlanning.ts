import { UseQueryResult } from 'react-query';
import { useSnackQuery } from '../../../../libs/apiHooks';
import { getRequest } from '../../../../libs/Api';
import { Planning } from '../../types/planning';

const getPlanning = (planningId: string): Promise<Planning> => {
    return getRequest(`/api/microplanning/plannings/${planningId}`);
};
export const useGetPlanning = (
    planningId: string | undefined,
): UseQueryResult<Planning, Error> => {
    const queryKey: any[] = ['teams', planningId];
    // @ts-ignore
    return useSnackQuery(queryKey, () => getPlanning(planningId), undefined, {
        retry: false,
    });
};
