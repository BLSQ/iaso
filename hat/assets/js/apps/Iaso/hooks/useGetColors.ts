import { UseQueryResult } from 'react-query';
import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';

export const useGetColors = (): UseQueryResult<string[], Error> => {
    return useSnackQuery({
        queryKey: ['colors'],
        queryFn: () => getRequest('/api/colors/'),
        options: {
            select: data => data.map(color => color.value),
            staleTime: Infinity,
            cacheTime: Infinity,
        },
    });
};

export const getColor = (i: number, colors?: string[]): string => {
    if (!colors) return 'transparent';
    if (colors.length === 0) return 'transparent';
    return colors[i % colors.length];
};
