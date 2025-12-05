import { useApiParams } from 'Iaso/hooks/useApiParams';
import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';
export const tableDefaults = {
    page: 1,
    limit: 10,
    order: '-created_at',
};
export const useGetPlanningSamplingResults = (
    planningId: string,
    params: Record<string, string>,
) => {
    const safeParams = {
        page: params.page ? `${params.page}` : undefined,
        limit: params.pageSize ? `${params.pageSize}` : undefined,
        order: params.order || tableDefaults.order,
    };
    const apiParams = useApiParams(safeParams, tableDefaults);
    const queryString = new URLSearchParams(apiParams).toString();
    return useSnackQuery({
        queryKey: ['planningSamplingResults', queryString],
        queryFn: () =>
            getRequest(
                `/api/microplanning/plannings/${planningId}/samplings/?${queryString}`,
            ),

        options: {
            enabled: Boolean(planningId),
            retry: false,
            staleTime: Infinity,
            cacheTime: 60000,
            keepPreviousData: true,
        },
    });
};
