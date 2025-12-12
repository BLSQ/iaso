import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';

export const useGetPlanningDetails = (planningId: string) => {
    return useSnackQuery({
        queryKey: ['planning', planningId],
        queryFn: () =>
            getRequest(`/api/microplanning/plannings/${planningId}/`),
        options: {
            enabled: Boolean(planningId),
            retry: false,
            staleTime: Infinity,
            cacheTime: 60000,
        },
    });
};
