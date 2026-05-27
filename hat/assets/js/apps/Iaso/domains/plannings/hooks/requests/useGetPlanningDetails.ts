import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { PLANNINGS_API_URL } from '../../constants';
import { Planning } from '../../types';

export const useGetPlanningDetails = (
    planningId: string,
    onSuccess?: (data: Planning) => void,
) => {
    return useSnackQuery({
        queryKey: ['planningDetails', planningId],
        queryFn: () => getRequest(`${PLANNINGS_API_URL}${planningId}/`),
        options: {
            enabled: Boolean(planningId),
            retry: false,
            staleTime: Infinity,
            cacheTime: 60000,
            onSuccess,
        },
    });
};
