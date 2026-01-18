import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';

export const useGetDosesPerVial = () => {
    return useSnackQuery({
        queryKey: ['doses_per_vial'],
        queryFn: () => getRequest('/api/polio/vaccine/doses_per_vial/'),
        options: {
            select: data => (data ?? [{}])[0].data,
            keepPreviousData: true,
            staleTime: 1000 * 60 * 15, // in MS
            cacheTime: 1000 * 60 * 5,
        },
    });
};
