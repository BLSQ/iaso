import { UseQueryResult } from 'react-query';
import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { makeUrlWithParams } from 'Iaso/libs/utils';

type Color = {
    value: string;
    label: string;
};

const getColors = async (dispersed: boolean): Promise<Color[]> => {
    const url = makeUrlWithParams('/api/colors/', {
        dispersed,
    });
    return getRequest(url) as Promise<Color[]>;
};
export const useGetColors = (
    dispersed = false,
): UseQueryResult<string[], Error> => {
    return useSnackQuery({
        queryKey: ['colors', { dispersed }],
        queryFn: () => getColors(dispersed),
        options: {
            select: data => data.map(color => color.value),
            staleTime: Infinity,
            cacheTime: Infinity,
        },
    });
};

export const getColor = (
    i: number,
    colors?: string[],
    usedColors?: string[],
): string => {
    if (!colors) return 'transparent';
    if (colors.length === 0) return 'transparent';

    const availableColors = colors.filter(
        color => !usedColors?.includes(color),
    );
    if (availableColors.length === 0) return 'transparent';

    return availableColors[i % availableColors.length];
};
